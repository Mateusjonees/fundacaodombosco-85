
-- 1. Audit logs: require authenticated user
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System creates financial audit entries" ON public.financial_audit_log;
CREATE POLICY "Authenticated users insert financial audit"
ON public.financial_audit_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.permission_audit_log;
CREATE POLICY "Authenticated users insert permission audit"
ON public.permission_audit_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. client_payments: restrict INSERT to authorized roles or assigned professionals
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.client_payments;
CREATE POLICY "Authorized users can insert payments"
ON public.client_payments FOR INSERT TO authenticated
WITH CHECK (
  is_manager_role()
  OR is_assigned_to_client(client_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.is_active = true
      AND profiles.employee_role IN ('financeiro','receptionist')
  )
);

-- 3. notes: restrict non-private notes to assigned/manager
DROP POLICY IF EXISTS "Users can view non-private notes" ON public.notes;
CREATE POLICY "Users can view notes they have access to"
ON public.notes FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    created_by = auth.uid()
    OR is_manager_role()
    OR (
      is_private = false
      AND client_id IS NOT NULL
      AND is_assigned_to_client(client_id)
    )
    OR (is_private = false AND client_id IS NULL)
  )
);

-- 4. stock_movements: only stock managers can INSERT
DROP POLICY IF EXISTS "Authenticated users can create stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Staff can create stock movements" ON public.stock_movements;
CREATE POLICY "Stock managers can create movements"
ON public.stock_movements FOR INSERT TO authenticated
WITH CHECK (can_manage_stock());

-- 5. attendance-documents bucket: allow managers to DELETE
DROP POLICY IF EXISTS "Managers can delete attendance documents" ON storage.objects;
CREATE POLICY "Managers can delete attendance documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attendance-documents' AND is_manager_role());
