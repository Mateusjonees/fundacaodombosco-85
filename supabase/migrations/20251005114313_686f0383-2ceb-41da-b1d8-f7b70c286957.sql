-- Correção completa de políticas RLS para publicação
-- Dropar políticas antigas e criar novas permissivas

-- 1. Tabela employee_timesheet
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert their own timesheet entries" ON public.employee_timesheet;
  DROP POLICY IF EXISTS "Staff can manage timesheet" ON public.employee_timesheet;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Authenticated users can manage timesheet" ON public.employee_timesheet
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active = true)
);

-- 2. Tabela permission_audit_log
DO $$ BEGIN
  DROP POLICY IF EXISTS "Directors can view permission audit" ON public.permission_audit_log;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Directors view permission audit log" ON public.permission_audit_log
FOR SELECT USING (director_has_god_mode());

-- 3. Tabela financial_audit_log  
DO $$ BEGIN
  DROP POLICY IF EXISTS "System can create audit log entries" ON public.financial_audit_log;
  DROP POLICY IF EXISTS "Financial staff can view audit log" ON public.financial_audit_log;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "System creates financial audit entries" ON public.financial_audit_log
FOR INSERT WITH CHECK (true);

CREATE POLICY "Financial staff view audit log" ON public.financial_audit_log
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'financeiro', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

-- 4. Corrigir funções sem search_path
CREATE OR REPLACE FUNCTION public.update_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  payment_record RECORD;
  total_paid NUMERIC := 0;
BEGIN
  SELECT * INTO payment_record 
  FROM public.client_payments 
  WHERE id = COALESCE(NEW.client_payment_id, OLD.client_payment_id);
  
  SELECT COALESCE(SUM(paid_amount), 0)
  INTO total_paid
  FROM public.payment_installments 
  WHERE client_payment_id = payment_record.id;
  
  UPDATE public.client_payments 
  SET 
    amount_paid = total_paid,
    amount_remaining = total_amount - total_paid,
    installments_paid = (
      SELECT COUNT(*) FROM public.payment_installments 
      WHERE client_payment_id = payment_record.id AND status = 'paid'
    ),
    status = CASE 
      WHEN total_paid = 0 THEN 'pending'
      WHEN total_paid >= payment_record.total_amount THEN 'completed'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = payment_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_stock_financial_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  financial_amount NUMERIC;
BEGIN
  IF NEW.total_expense IS NOT NULL AND NEW.total_expense > 0 THEN
    financial_amount := NEW.total_expense;
  ELSIF NEW.unit_cost > 0 AND NEW.current_quantity > 0 THEN
    financial_amount := NEW.current_quantity * NEW.unit_cost;
  ELSE
    financial_amount := 0;
  END IF;

  IF financial_amount > 0 THEN
    INSERT INTO public.financial_records (
      type, category, description, amount, date, payment_method, notes, created_by
    ) VALUES (
      'expense', 'supplies', 'Compra de estoque: ' || NEW.name,
      financial_amount, CURRENT_DATE, 'cash',
      'Registro automático - ' || NEW.name,
      COALESCE(NEW.created_by, auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;