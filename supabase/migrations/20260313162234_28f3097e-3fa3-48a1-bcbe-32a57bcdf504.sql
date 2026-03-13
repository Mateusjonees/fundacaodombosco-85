
-- Fix View clients policy: coordinators should see ALL clients, not just their unit
DROP POLICY IF EXISTS "View clients policy" ON clients;
CREATE POLICY "View clients policy" ON clients
FOR SELECT TO authenticated
USING (
  director_has_god_mode()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist')
    AND is_active = true
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

-- Fix Update clients policy: coordinators should update ALL clients
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
  )
);

-- Fix Create clients policy: coordinators should create clients for any unit
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
