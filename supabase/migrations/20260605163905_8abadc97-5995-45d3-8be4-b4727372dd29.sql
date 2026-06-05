
-- absence_records: drop blanket policies
DROP POLICY IF EXISTS "Authenticated users can delete absence_records" ON public.absence_records;
DROP POLICY IF EXISTS "Authenticated users can insert absence_records" ON public.absence_records;
DROP POLICY IF EXISTS "Authenticated users can update absence_records" ON public.absence_records;
DROP POLICY IF EXISTS "Authenticated users can view absence_records" ON public.absence_records;

-- internal_referrals: drop blanket policies and add scoped ones
DROP POLICY IF EXISTS "Authenticated users can delete internal_referrals" ON public.internal_referrals;
DROP POLICY IF EXISTS "Authenticated users can insert internal_referrals" ON public.internal_referrals;
DROP POLICY IF EXISTS "Authenticated users can update internal_referrals" ON public.internal_referrals;
DROP POLICY IF EXISTS "Authenticated users can view internal_referrals" ON public.internal_referrals;

CREATE POLICY "Involved staff can view internal_referrals"
ON public.internal_referrals FOR SELECT TO authenticated
USING (
  from_professional = auth.uid()
  OR to_professional = auth.uid()
  OR is_assigned_to_client(client_id)
  OR is_manager_role()
);

CREATE POLICY "Staff can insert internal_referrals they send"
ON public.internal_referrals FOR INSERT TO authenticated
WITH CHECK (
  from_professional = auth.uid() OR is_manager_role()
);

CREATE POLICY "Involved staff can update internal_referrals"
ON public.internal_referrals FOR UPDATE TO authenticated
USING (
  from_professional = auth.uid()
  OR to_professional = auth.uid()
  OR is_manager_role()
)
WITH CHECK (
  from_professional = auth.uid()
  OR to_professional = auth.uid()
  OR is_manager_role()
);

-- therapeutic_progress: drop blanket and scope
DROP POLICY IF EXISTS "Authenticated users can delete therapeutic_progress" ON public.therapeutic_progress;
DROP POLICY IF EXISTS "Authenticated users can insert therapeutic_progress" ON public.therapeutic_progress;
DROP POLICY IF EXISTS "Authenticated users can update therapeutic_progress" ON public.therapeutic_progress;
DROP POLICY IF EXISTS "Authenticated users can view therapeutic_progress" ON public.therapeutic_progress;

CREATE POLICY "Recorder and managers view therapeutic_progress"
ON public.therapeutic_progress FOR SELECT TO authenticated
USING (recorded_by = auth.uid() OR is_manager_role());

CREATE POLICY "Recorder inserts therapeutic_progress"
ON public.therapeutic_progress FOR INSERT TO authenticated
WITH CHECK (recorded_by = auth.uid() OR is_manager_role());

CREATE POLICY "Recorder and managers update therapeutic_progress"
ON public.therapeutic_progress FOR UPDATE TO authenticated
USING (recorded_by = auth.uid() OR is_manager_role())
WITH CHECK (recorded_by = auth.uid() OR is_manager_role());

CREATE POLICY "Managers delete therapeutic_progress"
ON public.therapeutic_progress FOR DELETE TO authenticated
USING (is_manager_role());

-- wait_list: drop blanket and restrict to managers/receptionists
DROP POLICY IF EXISTS "Authenticated users can delete wait_list" ON public.wait_list;
DROP POLICY IF EXISTS "Authenticated users can insert wait_list" ON public.wait_list;
DROP POLICY IF EXISTS "Authenticated users can update wait_list" ON public.wait_list;
DROP POLICY IF EXISTS "Authenticated users can view wait_list" ON public.wait_list;

CREATE POLICY "Managers and receptionists manage wait_list"
ON public.wait_list FOR ALL TO authenticated
USING (user_has_any_role(ARRAY['director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role, 'coordinator_atendimento_floresta'::employee_role, 'receptionist'::employee_role]))
WITH CHECK (user_has_any_role(ARRAY['director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role, 'coordinator_atendimento_floresta'::employee_role, 'receptionist'::employee_role]));

-- waiting_list: drop blanket SELECT
DROP POLICY IF EXISTS "Authenticated users can view waiting list" ON public.waiting_list;

-- system_settings: fix logic bug
DROP POLICY IF EXISTS "Authenticated users can view public settings only" ON public.system_settings;
CREATE POLICY "Authenticated users can view public settings only"
ON public.system_settings FOR SELECT TO authenticated
USING (is_public = true);

-- quality_evaluations: add manager SELECT + evaluator INSERT/UPDATE
CREATE POLICY "Managers can view all quality_evaluations"
ON public.quality_evaluations FOR SELECT TO authenticated
USING (is_manager_role());

CREATE POLICY "Managers can insert quality_evaluations"
ON public.quality_evaluations FOR INSERT TO authenticated
WITH CHECK (is_manager_role());

CREATE POLICY "Managers can update quality_evaluations"
ON public.quality_evaluations FOR UPDATE TO authenticated
USING (is_manager_role())
WITH CHECK (is_manager_role());

CREATE POLICY "Managers can delete quality_evaluations"
ON public.quality_evaluations FOR DELETE TO authenticated
USING (is_manager_role());
