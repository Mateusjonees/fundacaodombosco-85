-- ====================================
-- POLÍTICAS PARA CLIENTES
-- ====================================
-- Coordenadores veem APENAS clientes da sua unidade
-- Diretores veem TODOS os clientes

DROP POLICY IF EXISTS "Directors can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators Madre can view Madre clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators Floresta can view Floresta clients" ON public.clients;
DROP POLICY IF EXISTS "Receptionists can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators can update their unit clients" ON public.clients;
DROP POLICY IF EXISTS "Coordinators can create clients for their unit" ON public.clients;
DROP POLICY IF EXISTS "Professionals can view assigned clients" ON public.clients;

-- SELECT: Ver clientes
CREATE POLICY "View clients policy"
ON public.clients
FOR SELECT
USING (
  -- Diretor vê todos
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'
    AND is_active = true
  )
  OR
  -- Coordenador Madre vê apenas clientes da Madre
  (unit = 'madre' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_madre'
    AND is_active = true
  ))
  OR
  -- Coordenador Floresta vê apenas clientes da Floresta
  (unit = 'floresta' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_floresta'
    AND is_active = true
  ))
  OR
  -- Recepcionista vê todos
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'receptionist'
    AND is_active = true
  )
  OR
  -- Profissionais veem clientes atribuídos a eles
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
  -- Diretor pode atualizar todos
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'
    AND is_active = true
  )
  OR
  -- Coordenador Madre pode atualizar apenas clientes da Madre
  (unit = 'madre' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_madre'
    AND is_active = true
  ))
  OR
  -- Coordenador Floresta pode atualizar apenas clientes da Floresta
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
  -- Diretor pode criar em qualquer unidade
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'
    AND is_active = true
  )
  OR
  -- Coordenador Madre pode criar apenas na Madre
  (unit = 'madre' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_madre'
    AND is_active = true
  ))
  OR
  -- Coordenador Floresta pode criar apenas na Floresta
  (unit = 'floresta' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'coordinator_floresta'
    AND is_active = true
  ))
  OR
  -- Recepcionista pode criar em qualquer unidade
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'receptionist'
    AND is_active = true
  )
);

-- ====================================
-- POLÍTICAS PARA FINANCEIRO
-- ====================================
-- Coordenadores NÃO têm acesso
-- Apenas Diretor e Financeiro

DROP POLICY IF EXISTS "Directors and financial staff have full access" ON public.financial_records;
DROP POLICY IF EXISTS "Staff can view financial records" ON public.financial_records;

-- Acesso completo apenas para Diretor e Financeiro
CREATE POLICY "Financial access policy"
ON public.financial_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'financeiro')
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'financeiro')
    AND is_active = true
  )
);

-- ====================================
-- POLÍTICAS PARA SCHEDULES (Agendamentos)
-- ====================================
-- Coordenadores têm acesso total a agendamentos

DROP POLICY IF EXISTS "Staff can view schedules" ON public.schedules;
DROP POLICY IF EXISTS "Staff can create schedules" ON public.schedules;
DROP POLICY IF EXISTS "Staff can update schedules" ON public.schedules;

CREATE POLICY "View schedules policy"
ON public.schedules
FOR SELECT
USING (
  -- Diretor vê todos
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'
    AND is_active = true
  )
  OR
  -- Coordenadores veem todos
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
  OR
  -- Profissional vê seus próprios agendamentos
  auth.uid() = employee_id
  OR
  -- Recepcionista vê todos
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'receptionist'
    AND is_active = true
  )
);

CREATE POLICY "Create schedules policy"
ON public.schedules
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'receptionist')
    AND is_active = true
  )
  OR auth.uid() = employee_id
);

CREATE POLICY "Update schedules policy"
ON public.schedules
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'receptionist')
    AND is_active = true
  )
  OR auth.uid() = employee_id
);

-- ====================================
-- POLÍTICAS PARA ESTOQUE
-- ====================================
-- Coordenadores têm acesso ao estoque

DROP POLICY IF EXISTS "View stock items" ON public.stock_items;
DROP POLICY IF EXISTS "Manage stock items" ON public.stock_items;

CREATE POLICY "View stock policy"
ON public.stock_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'financeiro')
    AND is_active = true
  )
);

CREATE POLICY "Manage stock policy"
ON public.stock_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'financeiro')
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'financeiro')
    AND is_active = true
  )
);