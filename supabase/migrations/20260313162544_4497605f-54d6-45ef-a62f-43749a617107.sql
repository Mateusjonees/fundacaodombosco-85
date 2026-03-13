
-- Revert: coordinators should only see clients from their own unit
-- Tatiane has units=[madre,floresta,atendimento_floresta] so she sees all
DROP POLICY IF EXISTS "View clients policy" ON clients;
CREATE POLICY "View clients policy" ON clients
FOR SELECT TO authenticated
USING (
  director_has_god_mode()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('receptionist')
    AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND is_active = true
    AND (
      -- If coordinator has units array, check if client unit matches any
      (units IS NOT NULL AND clients.unit = ANY(units))
      -- If no units array, fall back to single unit match
      OR (units IS NULL AND clients.unit = unit)
    )
  )
  OR EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = clients.id AND ca.employee_id = auth.uid() AND ca.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM client_feedback_control cfc
    WHERE cfc.client_id = clients.id AND cfc.assigned_to = auth.uid()
  )
);

-- Update clients policy: coordinators edit only their unit's clients (Tatiane has all units)
DROP POLICY IF EXISTS "Update clients policy" ON clients;
CREATE POLICY "Update clients policy" ON clients
FOR UPDATE TO authenticated
USING (
  director_has_god_mode()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND is_active = true
    AND (
      (units IS NOT NULL AND clients.unit = ANY(units))
      OR (units IS NULL AND clients.unit = unit)
    )
  )
);

-- Create clients policy: coordinators can create for their units
DROP POLICY IF EXISTS "Create clients policy" ON clients;
CREATE POLICY "Create clients policy" ON clients
FOR INSERT TO authenticated
WITH CHECK (
  director_has_god_mode()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist')
    AND is_active = true
  )
);
