-- Limpar TODAS as políticas das tabelas employees e profiles relacionadas a coordenadores/diretores
DO $$
DECLARE
    pol record;
BEGIN
    -- Drop policies on employees table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'employees' 
        AND schemaname = 'public'
        AND policyname LIKE '%oordinator%'
           OR policyname LIKE '%irector%'
           OR policyname LIKE '%mployee%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.employees';
    END LOOP;
    
    -- Drop policies on profiles table (only coordinator/director related)
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
        AND (policyname LIKE '%oordinator%' OR policyname LIKE '%irector%')
        AND (policyname LIKE '%employee%' OR policyname LIKE '%profile%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Criar políticas para EMPLOYEES
-- Visualizar: Coordenadores, Diretores e o próprio usuário
CREATE POLICY "Staff can view employee records"
ON public.employees
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

-- Criar: Apenas Coordenadores e Diretores
CREATE POLICY "Management can create employee records"
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

-- Atualizar: Coordenadores, Diretores e o próprio usuário
CREATE POLICY "Staff can update employee records"
ON public.employees
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND is_active = true
  )
);

-- Criar políticas para PROFILES (relacionadas a funcionários)
-- Visualizar: Coordenadores, Diretores e o próprio usuário podem ver profiles
CREATE POLICY "Staff can view employee profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.user_id = auth.uid() 
    AND p2.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND p2.is_active = true
  )
);

-- Criar: Coordenadores e Diretores podem criar profiles
CREATE POLICY "Management can create employee profiles"
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

-- Atualizar: Coordenadores, Diretores e o próprio usuário podem atualizar
CREATE POLICY "Staff can update employee profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.user_id = auth.uid() 
    AND p2.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta')
    AND p2.is_active = true
  )
);