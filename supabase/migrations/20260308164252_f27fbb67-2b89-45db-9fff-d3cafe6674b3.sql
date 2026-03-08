-- =====================================================
-- FIX CRITICAL RLS SECURITY ISSUES
-- Restrict access to sensitive clinical/financial data
-- =====================================================

-- Helper: check if user is assigned to a client
CREATE OR REPLACE FUNCTION public.is_assigned_to_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM client_assignments
    WHERE client_id = p_client_id
    AND employee_id = auth.uid()
    AND is_active = true
  );
$$;

-- Helper: check if user is manager (director/coordinator)
CREATE OR REPLACE FUNCTION public.is_manager_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND is_active = true
  );
$$;

-- =====================================================
-- 1. ANAMNESIS_RECORDS - restrict SELECT/INSERT
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view anamnesis records" ON anamnesis_records;
CREATE POLICY "Restricted view anamnesis records" ON anamnesis_records
  FOR SELECT TO authenticated
  USING (
    filled_by = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can create anamnesis records" ON anamnesis_records;
CREATE POLICY "Staff can create anamnesis records" ON anamnesis_records
  FOR INSERT TO authenticated
  WITH CHECK (
    filled_by = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

-- =====================================================
-- 2. CLIENT_LAUDOS - restrict all operations
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view laudos" ON client_laudos;
CREATE POLICY "Restricted view laudos" ON client_laudos
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can create laudos" ON client_laudos;
CREATE POLICY "Restricted create laudos" ON client_laudos
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can update laudos" ON client_laudos;
CREATE POLICY "Restricted update laudos" ON client_laudos
  FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can delete laudos" ON client_laudos;
CREATE POLICY "Restricted delete laudos" ON client_laudos
  FOR DELETE TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_manager_role()
  );

-- =====================================================
-- 3. NEURO_TEST_RESULTS - restrict all operations
-- =====================================================
DROP POLICY IF EXISTS "Usuários autenticados podem ver resultados de testes" ON neuro_test_results;
CREATE POLICY "Restricted view neuro test results" ON neuro_test_results
  FOR SELECT TO authenticated
  USING (
    applied_by = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Usuários autenticados podem inserir resultados" ON neuro_test_results;
CREATE POLICY "Restricted insert neuro test results" ON neuro_test_results
  FOR INSERT TO authenticated
  WITH CHECK (
    applied_by = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar resultados" ON neuro_test_results;
CREATE POLICY "Restricted update neuro test results" ON neuro_test_results
  FOR UPDATE TO authenticated
  USING (
    applied_by = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Usuários autenticados podem deletar resultados" ON neuro_test_results;

-- =====================================================
-- 4. PRESCRIPTIONS - restrict all operations
-- =====================================================
DROP POLICY IF EXISTS "Employees can view all prescriptions" ON prescriptions;
CREATE POLICY "Restricted view prescriptions" ON prescriptions
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Employees can insert prescriptions" ON prescriptions;
CREATE POLICY "Restricted insert prescriptions" ON prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Employees can update prescriptions" ON prescriptions;
CREATE POLICY "Restricted update prescriptions" ON prescriptions
  FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Employees can delete prescriptions" ON prescriptions;
CREATE POLICY "Restricted delete prescriptions" ON prescriptions
  FOR DELETE TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_manager_role()
  );

-- =====================================================
-- 5. THERAPEUTIC_PLANS - restrict all operations
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view therapeutic_plans" ON therapeutic_plans;
CREATE POLICY "Restricted view therapeutic_plans" ON therapeutic_plans
  FOR SELECT TO authenticated
  USING (
    professional_id = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can insert therapeutic_plans" ON therapeutic_plans;
CREATE POLICY "Restricted insert therapeutic_plans" ON therapeutic_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    professional_id = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can update therapeutic_plans" ON therapeutic_plans;
CREATE POLICY "Restricted update therapeutic_plans" ON therapeutic_plans
  FOR UPDATE TO authenticated
  USING (
    professional_id = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can delete therapeutic_plans" ON therapeutic_plans;
CREATE POLICY "Restricted delete therapeutic_plans" ON therapeutic_plans
  FOR DELETE TO authenticated
  USING (is_manager_role());

-- =====================================================
-- 6. CONSENT_RECORDS - restrict SELECT/UPDATE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view consent_records" ON consent_records;
CREATE POLICY "Restricted view consent_records" ON consent_records
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can update consent_records" ON consent_records;
CREATE POLICY "Restricted update consent_records" ON consent_records
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can insert consent_records" ON consent_records;
CREATE POLICY "Restricted insert consent_records" ON consent_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 7. PATIENT_PORTAL_TOKENS - remove anon, restrict auth
-- =====================================================
DROP POLICY IF EXISTS "Public can read active tokens" ON patient_portal_tokens;

DROP POLICY IF EXISTS "Authenticated users can view patient_portal_tokens" ON patient_portal_tokens;
CREATE POLICY "Restricted view patient_portal_tokens" ON patient_portal_tokens
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR is_manager_role()
  );

DROP POLICY IF EXISTS "Authenticated users can update patient_portal_tokens" ON patient_portal_tokens;
CREATE POLICY "Restricted update patient_portal_tokens" ON patient_portal_tokens
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR is_manager_role()
  );

-- =====================================================
-- 8. CLIENT_PAYMENTS - restrict to financial roles
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can read payments" ON client_payments;
CREATE POLICY "Financial roles can read payments" ON client_payments
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND employee_role IN ('financeiro', 'receptionist')
      AND is_active = true
    )
  );

-- =====================================================
-- 9. ATTENDANCE_REPORTS - restrict SELECT
-- =====================================================
DROP POLICY IF EXISTS "View attendance reports" ON attendance_reports;
CREATE POLICY "Restricted view attendance reports" ON attendance_reports
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR completed_by = auth.uid()
    OR employee_id = auth.uid()
    OR is_assigned_to_client(client_id)
    OR is_manager_role()
  );

-- =====================================================
-- 10. EMPLOYEE_REPORTS - restrict SELECT
-- =====================================================
DROP POLICY IF EXISTS "View employee reports" ON employee_reports;
CREATE POLICY "Restricted view employee reports" ON employee_reports
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR (client_id IS NOT NULL AND is_assigned_to_client(client_id))
    OR is_manager_role()
  );

-- =====================================================
-- 11. CONSENT_TEMPLATES - restrict write to managers
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can insert consent_templates" ON consent_templates;
CREATE POLICY "Managers can insert consent_templates" ON consent_templates
  FOR INSERT TO authenticated
  WITH CHECK (is_manager_role());

DROP POLICY IF EXISTS "Authenticated users can update consent_templates" ON consent_templates;
CREATE POLICY "Managers can update consent_templates" ON consent_templates
  FOR UPDATE TO authenticated
  USING (is_manager_role());

DROP POLICY IF EXISTS "Authenticated users can delete consent_templates" ON consent_templates;
CREATE POLICY "Managers can delete consent_templates" ON consent_templates
  FOR DELETE TO authenticated
  USING (is_manager_role());

-- =====================================================
-- 12. FINANCIAL_NOTES - restrict to financial roles
-- =====================================================
DROP POLICY IF EXISTS "Users can view financial notes" ON financial_notes;
CREATE POLICY "Financial roles can view notes" ON financial_notes
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR is_manager_role()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND employee_role = 'financeiro'
      AND is_active = true
    )
  );

-- =====================================================
-- 13. ANAMNESIS_QUESTIONS - restrict write to managers
-- =====================================================
DROP POLICY IF EXISTS "Coordinators can manage anamnesis questions" ON anamnesis_questions;
CREATE POLICY "Managers can manage anamnesis questions" ON anamnesis_questions
  FOR ALL TO authenticated
  USING (is_manager_role())
  WITH CHECK (is_manager_role());