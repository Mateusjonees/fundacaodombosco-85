
-- Fix RLS on client_payments: allow all authenticated users to insert and read
CREATE POLICY "Authenticated users can insert payments"
  ON public.client_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read payments"
  ON public.client_payments FOR SELECT
  TO authenticated
  USING (true);

-- Mark existing contract records for manual review
UPDATE public.financial_records 
SET notes = '⚠️ Revisar forma de pagamento - ' || COALESCE(notes, 'Contrato gerado')
WHERE payment_method = 'contract'
  AND (notes NOT LIKE '⚠️%' OR notes IS NULL);
