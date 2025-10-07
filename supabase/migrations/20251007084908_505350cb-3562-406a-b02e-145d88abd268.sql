-- PARTE 1: POLÍTICAS PARA CLIENTES
-- Coordenadores veem APENAS clientes da sua unidade

DROP POLICY IF EXISTS "Directors can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators Madre can view Madre clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators Floresta can view Floresta clients" ON public.clients;
DROP POLICY IF EXISTS "Receptionists can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators can update their unit clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators can create clients for their unit" ON public.clients;
DROP POLICY IF EXISTS "Professionals can view assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators and directors can view all clients" ON public.clients;
DROP POLICY IF EXISTS "View clients policy" ON public.clients;
DROP POLICY IF EXISTS "Update clients policy" ON public.clients;
DROP POLICY IF EXISTS "Create clients policy" ON public.clients;

-- SELECT: Ver clientes
CREATE POLICY "View clients policy"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'
    AND is_active = true
  )
  OR
  (unit = 'madre' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_madre'
    AND is_active = true
  ))
  OR
  (unit = 'floresta' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_floresta'
    AND is_active = true
  ))
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'receptionist'
    AND is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = clients.id 
    AND ca.employee_id = auth.uid() 
    AND ca.is_active = true
  )
);

-- UPDATE: Atualizar clientes
CREATE POLICY "Update clients policy"
ON public.clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'
    AND is_active = true
  )
  OR
  (unit = 'madre' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_madre'
    AND is_active = true
  ))
  OR
  (unit = 'floresta' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_floresta'
    AND is_active = true
  ))
);

-- INSERT: Criar clientes
CREATE POLICY "Create clients policy"
ON public.clients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'
    AND is_active = true
  )
  OR
  (unit = 'madre' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_madre'
    AND is_active = true
  ))
  OR
  (unit = 'floresta' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_floresta'
    AND is_active = true
  ))
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'receptionist'
    AND is_active = true
  )
);