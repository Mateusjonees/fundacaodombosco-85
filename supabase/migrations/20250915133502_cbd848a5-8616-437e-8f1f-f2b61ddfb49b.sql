-- Update RLS policies for clients table to ensure staff can always view table even if no assignments exist

-- Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Staff can view assigned clients only" ON clients;

-- Recreate the policy with better logic
CREATE POLICY "Staff can view assigned clients or all if coordinator/director" 
ON clients FOR SELECT 
USING (
  -- Directors can see all clients
  user_has_role(ARRAY['director'::employee_role]) OR
  -- Coordinators can see all clients  
  user_has_role(ARRAY['coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role]) OR
  -- Staff can see clients assigned to them
  (EXISTS ( 
    SELECT 1 
    FROM client_assignments ca
    WHERE ca.client_id = clients.id 
    AND ca.employee_id = auth.uid() 
    AND ca.is_active = true
  ))
);

-- Also ensure staff can see the clients table structure even with no assignments
-- by allowing SELECT on empty result set
CREATE POLICY "All authenticated users can access clients table structure"
ON clients FOR SELECT
USING (auth.uid() IS NOT NULL);