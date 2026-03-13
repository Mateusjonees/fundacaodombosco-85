-- Fix "View schedules with unit access control" - add coordinator_atendimento_floresta
DROP POLICY IF EXISTS "View schedules with unit access control" ON schedules;
CREATE POLICY "View schedules with unit access control" ON schedules
FOR SELECT TO authenticated
USING (
  director_has_god_mode()
  OR (
    (unit = 'madre') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_madre' AND is_active = true
    )
  )
  OR (
    (unit = 'floresta') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_floresta' AND is_active = true
    )
  )
  OR (
    (unit = 'atendimento_floresta') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_atendimento_floresta' AND is_active = true
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'receptionist' AND is_active = true
  )
  OR (employee_id = auth.uid())
);

-- Fix "Update schedules with unit access control" - add coordinator_atendimento_floresta
DROP POLICY IF EXISTS "Update schedules with unit access control" ON schedules;
CREATE POLICY "Update schedules with unit access control" ON schedules
FOR UPDATE TO authenticated
USING (
  director_has_god_mode()
  OR (
    (unit = 'madre') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_madre' AND is_active = true
    )
  )
  OR (
    (unit = 'floresta') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_floresta' AND is_active = true
    )
  )
  OR (
    (unit = 'atendimento_floresta') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_atendimento_floresta' AND is_active = true
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'receptionist' AND is_active = true
  )
  OR (employee_id = auth.uid())
);

-- Fix "Create schedules with unit access control" - add coordinator_atendimento_floresta
DROP POLICY IF EXISTS "Create schedules with unit access control" ON schedules;
CREATE POLICY "Create schedules with unit access control" ON schedules
FOR INSERT TO authenticated
WITH CHECK (
  director_has_god_mode()
  OR (
    (unit = 'madre') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_madre' AND is_active = true
    )
  )
  OR (
    (unit = 'floresta') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_floresta' AND is_active = true
    )
  )
  OR (
    (unit = 'atendimento_floresta') AND EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'coordinator_atendimento_floresta' AND is_active = true
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role = 'receptionist' AND is_active = true
  )
);