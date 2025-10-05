-- Corrigir políticas RLS para tabelas sem acesso

-- ============================================
-- 1. CLIENT_ASSIGNMENTS
-- ============================================
CREATE POLICY "Directors have full access to client assignments"
ON client_assignments FOR ALL 
TO authenticated
USING (director_has_god_mode())
WITH CHECK (director_has_god_mode());

CREATE POLICY "Staff can view assigned clients"
ON client_assignments FOR SELECT 
TO authenticated
USING (employee_id = auth.uid() OR director_has_god_mode());

CREATE POLICY "Coordinators can manage assignments"
ON client_assignments FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('coordinator_madre', 'coordinator_floresta', 'director')
  )
);

-- ============================================
-- 2. CLIENT_DOCUMENTS
-- ============================================
CREATE POLICY "Directors have full access to client documents"
ON client_documents FOR ALL 
TO authenticated
USING (director_has_god_mode())
WITH CHECK (director_has_god_mode());

CREATE POLICY "Staff can view documents of assigned clients"
ON client_documents FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = client_documents.client_id
    AND ca.employee_id = auth.uid()
    AND ca.is_active = true
  ) OR director_has_god_mode()
);

CREATE POLICY "Staff can manage documents of assigned clients"
ON client_documents FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = client_documents.client_id
    AND ca.employee_id = auth.uid()
    AND ca.is_active = true
  ) OR director_has_god_mode()
);

-- ============================================
-- 3. CLIENT_NOTES
-- ============================================
CREATE POLICY "Directors have full access to client notes"
ON client_notes FOR ALL 
TO authenticated
USING (director_has_god_mode())
WITH CHECK (director_has_god_mode());

CREATE POLICY "Staff can view notes of assigned clients"
ON client_notes FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = client_notes.client_id
    AND ca.employee_id = auth.uid()
    AND ca.is_active = true
  ) OR director_has_god_mode()
);

CREATE POLICY "Staff can manage notes of assigned clients"
ON client_notes FOR ALL 
TO authenticated
USING (
  (created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = client_notes.client_id
    AND ca.employee_id = auth.uid()
    AND ca.is_active = true
  )) OR director_has_god_mode()
);

-- ============================================
-- 4. FINANCIAL_RECORDS
-- ============================================
CREATE POLICY "Directors and financial staff have full access"
ON financial_records FOR ALL 
TO authenticated
USING (
  director_has_god_mode() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'financeiro', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

CREATE POLICY "Staff can view financial records"
ON financial_records FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- ============================================
-- 5. PAYMENT_INSTALLMENTS
-- ============================================
CREATE POLICY "Directors and financial staff manage installments"
ON payment_installments FOR ALL 
TO authenticated
USING (
  director_has_god_mode() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'financeiro', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

CREATE POLICY "Staff can view payment installments"
ON payment_installments FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- ============================================
-- 6. PERMISSION_AUDIT_LOG
-- ============================================
CREATE POLICY "Directors can view permission audit logs"
ON permission_audit_log FOR SELECT 
TO authenticated
USING (director_has_god_mode());

CREATE POLICY "System can insert audit logs"
ON permission_audit_log FOR INSERT 
TO authenticated
WITH CHECK (true);

-- ============================================
-- 7. APPOINTMENT_SESSIONS
-- ============================================
CREATE POLICY "Directors have full access to appointment sessions"
ON appointment_sessions FOR ALL 
TO authenticated
USING (director_has_god_mode())
WITH CHECK (director_has_god_mode());

CREATE POLICY "Staff can view appointment sessions"
ON appointment_sessions FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Staff can manage appointment sessions"
ON appointment_sessions FOR ALL 
TO authenticated
USING (
  (created_by = auth.uid() OR director_has_god_mode())
);

-- ============================================
-- 8. MEDICAL_RECORDS - Adicionar políticas faltantes
-- ============================================
CREATE POLICY "Directors have full access to medical records"
ON medical_records FOR ALL 
TO authenticated
USING (director_has_god_mode())
WITH CHECK (director_has_god_mode());

CREATE POLICY "Staff can view medical records of assigned clients"
ON medical_records FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = medical_records.client_id
    AND ca.employee_id = auth.uid()
    AND ca.is_active = true
  ) OR director_has_god_mode()
);

CREATE POLICY "Staff can update medical records of assigned clients"
ON medical_records FOR UPDATE 
TO authenticated
USING (
  (employee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = medical_records.client_id
    AND ca.employee_id = auth.uid()
    AND ca.is_active = true
  )) OR director_has_god_mode()
);