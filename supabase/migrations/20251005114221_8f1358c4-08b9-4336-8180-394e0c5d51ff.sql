-- Políticas permissivas mas seguras para publicação do sistema
-- Todas as políticas permitem acesso a usuários autenticados e ativos

-- 1. Tabela employee_timesheet - permitir gestão completa
DROP POLICY IF EXISTS "Users can insert their own timesheet entries" ON public.employee_timesheet;

CREATE POLICY "Staff can manage timesheet" ON public.employee_timesheet
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_active = true)
);

-- 2. Tabela permission_audit_log - permitir visualização para diretores
CREATE POLICY "Directors can view permission audit" ON public.permission_audit_log
FOR SELECT USING (
  director_has_god_mode()
);

-- 3. Tabela financial_audit_log - permitir visualização para diretores e financeiro
CREATE POLICY "Financial staff can view audit log" ON public.financial_audit_log
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'financeiro', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

-- 4. Corrigir funções sem search_path definido
CREATE OR REPLACE FUNCTION public.update_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  payment_record RECORD;
  total_paid NUMERIC := 0;
  pending_count INTEGER := 0;
BEGIN
  SELECT * INTO payment_record 
  FROM public.client_payments 
  WHERE id = COALESCE(NEW.client_payment_id, OLD.client_payment_id);
  
  SELECT 
    COALESCE(SUM(paid_amount), 0),
    COUNT(*) FILTER (WHERE status IN ('pending', 'partial'))
  INTO total_paid, pending_count
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
      type,
      category,
      description,
      amount,
      date,
      payment_method,
      notes,
      created_by
    ) VALUES (
      'expense'::text,
      'supplies'::text,
      'Compra de estoque: ' || NEW.name,
      financial_amount,
      CURRENT_DATE,
      'cash'::text,
      'Registro automático - Item: ' || NEW.name || 
      ' | Categoria: ' || COALESCE(NEW.category, 'N/A') ||
      ' | Quantidade: ' || NEW.current_quantity ||
      ' | Unidade: ' || NEW.unit ||
      ' | Custo unitário: R$ ' || NEW.unit_cost ||
      CASE 
        WHEN NEW.total_expense IS NOT NULL AND NEW.total_expense > 0 THEN
          ' | Despesa total: R$ ' || NEW.total_expense
        ELSE
          ' | Despesa calculada: R$ ' || financial_amount
      END ||
      ' | Fornecedor: ' || COALESCE(NEW.supplier, 'N/A') ||
      ' | Localização: ' || COALESCE(NEW.location, 'N/A'),
      COALESCE(NEW.created_by, auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;