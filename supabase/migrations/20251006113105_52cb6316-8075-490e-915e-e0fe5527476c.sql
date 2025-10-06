-- Remover política anterior de coordenadores
DROP POLICY IF EXISTS "Coordinators and directors can view all clients" ON public.clients;

-- Diretores podem ver TODOS os clientes
CREATE POLICY "Directors can view all clients"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'
    AND is_active = true
  )
);

-- Coordenadores da Madre podem ver apenas clientes da unidade Madre
CREATE POLICY "Coordinators Madre can view Madre clients"
ON public.clients
FOR SELECT
USING (
  unit = 'madre' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_madre'
    AND is_active = true
  )
);

-- Coordenadores da Floresta podem ver apenas clientes da unidade Floresta
CREATE POLICY "Coordinators Floresta can view Floresta clients"
ON public.clients
FOR SELECT
USING (
  unit = 'floresta' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_floresta'
    AND is_active = true
  )
);

-- Recepcionistas podem ver todos os clientes
CREATE POLICY "Receptionists can view all clients"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'receptionist'
    AND is_active = true
  )
);

-- Atualizar política de UPDATE para coordenadores considerarem a unidade
DROP POLICY IF EXISTS "Coordinators can update clients" ON public.clients;

CREATE POLICY "Coordinators can update their unit clients"
ON public.clients
FOR UPDATE
USING (
  (
    -- Coordenador Madre pode atualizar clientes da Madre
    (unit = 'madre' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND employee_role = 'coordinator_madre'
      AND is_active = true
    ))
    OR
    -- Coordenador Floresta pode atualizar clientes da Floresta
    (unit = 'floresta' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND employee_role = 'coordinator_floresta'
      AND is_active = true
    ))
    OR
    -- Diretor pode atualizar qualquer cliente
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND employee_role = 'director'
      AND is_active = true
    )
  )
);

-- Atualizar política de INSERT para coordenadores
DROP POLICY IF EXISTS "Staff can create clients" ON public.clients;

CREATE POLICY "Coordinators can create clients for their unit"
ON public.clients
FOR INSERT
WITH CHECK (
  (
    -- Coordenador Madre só pode criar clientes da Madre
    (unit = 'madre' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND employee_role = 'coordinator_madre'
      AND is_active = true
    ))
    OR
    -- Coordenador Floresta só pode criar clientes da Floresta
    (unit = 'floresta' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND employee_role = 'coordinator_floresta'
      AND is_active = true
    ))
    OR
    -- Diretor e recepcionista podem criar em qualquer unidade
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND employee_role IN ('director', 'receptionist')
      AND is_active = true
    )
  )
);