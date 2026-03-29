-- Fix: old INSERT policy missing coordinator_atendimento_floresta
DROP POLICY IF EXISTS "Staff can create clients" ON public.clients;

-- Recreate with the correct roles
CREATE POLICY "Staff can create clients" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.employee_role = ANY(ARRAY[
        'director'::employee_role,
        'coordinator_madre'::employee_role,
        'coordinator_floresta'::employee_role,
        'coordinator_atendimento_floresta'::employee_role,
        'receptionist'::employee_role
      ])
      AND profiles.is_active = true
    )
  );