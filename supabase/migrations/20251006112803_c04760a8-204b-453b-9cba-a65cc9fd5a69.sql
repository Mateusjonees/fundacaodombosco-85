-- Corrigir políticas RLS para coordenadores terem acesso aos clientes
DROP POLICY IF EXISTS "Staff can view assigned clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can create new clients" ON public.clients;

-- Coordenadores e diretores podem ver TODOS os clientes
CREATE POLICY "Coordinators and directors can view all clients"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'receptionist')
    AND is_active = true
  )
);

-- Profissionais podem ver clientes atribuídos a eles
CREATE POLICY "Professionals can view assigned clients"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = clients.id 
    AND ca.employee_id = auth.uid() 
    AND ca.is_active = true
  )
);

-- Coordenadores, diretores e recepcionistas podem criar clientes
CREATE POLICY "Staff can create clients"
ON public.clients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'receptionist')
    AND is_active = true
  )
);

-- Coordenadores e diretores podem atualizar clientes
CREATE POLICY "Coordinators can update clients"
ON public.clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

-- Corrigir políticas de schedules para coordenadores
DROP POLICY IF EXISTS "Staff can view all schedules" ON public.schedules;

CREATE POLICY "Coordinators can view all schedules"
ON public.schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'receptionist')
    AND is_active = true
  )
);

CREATE POLICY "Professionals can view their schedules"
ON public.schedules
FOR SELECT
USING (
  employee_id = auth.uid()
);

CREATE POLICY "Coordinators can manage schedules"
ON public.schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'receptionist')
    AND is_active = true
  )
);