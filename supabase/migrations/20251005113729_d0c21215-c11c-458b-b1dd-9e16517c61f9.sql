-- Corrigir apenas as tabelas que não têm políticas

-- ============================================
-- 1. CLIENT_ASSIGNMENTS (verificar se já tem, se não criar)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_assignments' 
    AND policyname = 'Directors have full access to client assignments'
  ) THEN
    EXECUTE 'CREATE POLICY "Directors have full access to client assignments"
    ON client_assignments FOR ALL 
    TO authenticated
    USING (director_has_god_mode())
    WITH CHECK (director_has_god_mode())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_assignments' 
    AND policyname = 'Staff can view assigned clients'
  ) THEN
    EXECUTE 'CREATE POLICY "Staff can view assigned clients"
    ON client_assignments FOR SELECT 
    TO authenticated
    USING (employee_id = auth.uid() OR director_has_god_mode())';
  END IF;
END $$;

-- ============================================
-- 2. CLIENT_DOCUMENTS
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_documents' AND policyname = 'Directors have full access to client documents') THEN
    EXECUTE 'CREATE POLICY "Directors have full access to client documents"
    ON client_documents FOR ALL 
    TO authenticated
    USING (director_has_god_mode())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_documents' AND policyname = 'Staff can view documents of assigned clients') THEN
    EXECUTE 'CREATE POLICY "Staff can view documents of assigned clients"
    ON client_documents FOR SELECT 
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM client_assignments ca
        WHERE ca.client_id = client_documents.client_id
        AND ca.employee_id = auth.uid()
        AND ca.is_active = true
      ) OR director_has_god_mode()
    )';
  END IF;
END $$;

-- ============================================
-- 3. CLIENT_NOTES
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_notes' AND policyname = 'Directors have full access to client notes') THEN
    EXECUTE 'CREATE POLICY "Directors have full access to client notes"
    ON client_notes FOR ALL 
    TO authenticated
    USING (director_has_god_mode())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_notes' AND policyname = 'Staff can view notes of assigned clients') THEN
    EXECUTE 'CREATE POLICY "Staff can view notes of assigned clients"
    ON client_notes FOR SELECT 
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM client_assignments ca
        WHERE ca.client_id = client_notes.client_id
        AND ca.employee_id = auth.uid()
        AND ca.is_active = true
      ) OR director_has_god_mode()
    )';
  END IF;
END $$;

-- ============================================
-- 4. FINANCIAL_RECORDS
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'financial_records' AND policyname = 'Directors and financial staff have full access') THEN
    EXECUTE 'CREATE POLICY "Directors and financial staff have full access"
    ON financial_records FOR ALL 
    TO authenticated
    USING (
      director_has_god_mode() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND employee_role IN (''director'', ''financeiro'', ''coordinator_madre'', ''coordinator_floresta'')
        AND is_active = true
      )
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'financial_records' AND policyname = 'Staff can view financial records') THEN
    EXECUTE 'CREATE POLICY "Staff can view financial records"
    ON financial_records FOR SELECT 
    TO authenticated
    USING (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';
  END IF;
END $$;

-- ============================================
-- 5. PAYMENT_INSTALLMENTS
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_installments') THEN
    EXECUTE 'CREATE POLICY "Directors and financial staff manage installments"
    ON payment_installments FOR ALL 
    TO authenticated
    USING (
      director_has_god_mode() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND employee_role IN (''director'', ''financeiro'', ''coordinator_madre'', ''coordinator_floresta'')
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "Staff can view payment installments"
    ON payment_installments FOR SELECT 
    TO authenticated
    USING (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';
  END IF;
END $$;

-- ============================================
-- 6. PERMISSION_AUDIT_LOG
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permission_audit_log') THEN
    EXECUTE 'CREATE POLICY "Directors can view permission audit logs"
    ON permission_audit_log FOR SELECT 
    TO authenticated
    USING (director_has_god_mode())';

    EXECUTE 'CREATE POLICY "System can insert audit logs"
    ON permission_audit_log FOR INSERT 
    TO authenticated
    WITH CHECK (true)';
  END IF;
END $$;

-- ============================================
-- 7. APPOINTMENT_SESSIONS
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_sessions') THEN
    EXECUTE 'CREATE POLICY "Directors have full access to appointment sessions"
    ON appointment_sessions FOR ALL 
    TO authenticated
    USING (director_has_god_mode())';

    EXECUTE 'CREATE POLICY "Staff can view appointment sessions"
    ON appointment_sessions FOR SELECT 
    TO authenticated
    USING (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "Staff can manage appointment sessions"
    ON appointment_sessions FOR INSERT 
    TO authenticated
    WITH CHECK (created_by = auth.uid() OR director_has_god_mode())';
  END IF;
END $$;

-- ============================================
-- 8. MEDICAL_RECORDS - Adicionar políticas faltantes
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_records' AND policyname = 'Directors have full access to medical records') THEN
    EXECUTE 'CREATE POLICY "Directors have full access to medical records"
    ON medical_records FOR ALL 
    TO authenticated
    USING (director_has_god_mode())';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_records' AND policyname = 'Staff can view medical records of assigned clients') THEN
    EXECUTE 'CREATE POLICY "Staff can view medical records of assigned clients"
    ON medical_records FOR SELECT 
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM client_assignments ca
        WHERE ca.client_id = medical_records.client_id
        AND ca.employee_id = auth.uid()
        AND ca.is_active = true
      ) OR director_has_god_mode()
    )';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_records' AND policyname = 'Staff can update medical records') THEN
    EXECUTE 'CREATE POLICY "Staff can update medical records"
    ON medical_records FOR UPDATE 
    TO authenticated
    USING (
      employee_id = auth.uid() OR director_has_god_mode()
    )';
  END IF;
END $$;