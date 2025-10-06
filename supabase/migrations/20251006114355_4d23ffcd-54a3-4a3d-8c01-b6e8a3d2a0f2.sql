-- Drop políticas específicas por unidade
DROP POLICY IF EXISTS "Directors can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators Madre can view Madre clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators Floresta can view Floresta clients" ON public.clients;
DROP POLICY IF EXISTS "Receptionists can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators can update their unit clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators can create clients for their unit" ON public.clients;

-- Recriar políticas amplas originais
CREATE POLICY "Coordinators and directors can view all clients"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role, 'receptionist'::employee_role)
    AND is_active = true
  )
);

CREATE POLICY "Coordinators can update clients"
ON public.clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role)
    AND is_active = true
  )
);

CREATE POLICY "Staff can create clients"
ON public.clients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role, 'receptionist'::employee_role)
    AND is_active = true
  )
);