-- Remover políticas existentes de coordenadores para employees
DROP POLICY IF EXISTS "Coordinators can view employee records" ON public.employees;
DROP POLICY IF EXISTS "Directors can view all employee records" ON public.employees;
DROP POLICY IF EXISTS "Directors can update all employee records" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employee record" ON public.employees;

-- Política simples: Coordenadores e Diretores podem ver TODOS os registros de employees
CREATE POLICY "Coordinators and directors view all employees"
ON public.employees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
  OR auth.uid() = user_id  -- Usuário pode ver seu próprio registro
);

-- Coordenadores e Diretores podem CRIAR registros de employees
CREATE POLICY "Coordinators and directors create employees"
ON public.employees
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

-- Coordenadores e Diretores podem ATUALIZAR registros de employees
CREATE POLICY "Coordinators and directors update employees"
ON public.employees
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
  OR auth.uid() = user_id  -- Usuário pode atualizar seu próprio registro
);

-- Agora para a tabela profiles (que contém dados dos funcionários)
-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Directors can view all employee records" ON public.profiles;
DROP POLICY IF EXISTS "Coordinators can view employee records" ON public.profiles;

-- Coordenadores e Diretores podem ver TODOS os profiles de funcionários
CREATE POLICY "Coordinators and directors view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.user_id = auth.uid() 
    AND p2.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND p2.is_active = true
  )
  OR auth.uid() = user_id  -- Usuário pode ver seu próprio profile
);

-- Coordenadores e Diretores podem CRIAR profiles de funcionários
CREATE POLICY "Coordinators and directors create profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

-- Coordenadores e Diretores podem ATUALIZAR profiles de funcionários
CREATE POLICY "Coordinators and directors update profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.user_id = auth.uid() 
    AND p2.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND p2.is_active = true
  )
  OR auth.uid() = user_id  -- Usuário pode atualizar seu próprio profile
);