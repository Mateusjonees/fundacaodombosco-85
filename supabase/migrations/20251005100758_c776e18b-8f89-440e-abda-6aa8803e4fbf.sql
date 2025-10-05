-- FASE 1: CORREÇÕES CRÍTICAS - Sistema Seguro de Roles

-- 1. Criar enum (se não existir)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'director', 'coordinator_madre', 'coordinator_floresta',
    'psychologist', 'psychopedagogue', 'speech_therapist',
    'nutritionist', 'terapeuta_ocupacional', 'receptionist',
    'intern', 'financeiro'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Criar tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Migrar dados
INSERT INTO public.user_roles (user_id, role, granted_at, is_active)
SELECT p.user_id, p.employee_role::text::app_role, p.created_at, p.is_active
FROM public.profiles p
WHERE p.employee_role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Criar função has_role SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;

-- 5. Remover função antiga COM CASCADE
DROP FUNCTION IF EXISTS public.user_has_role(employee_role[]) CASCADE;

-- 6. Criar nova função user_has_role
CREATE FUNCTION public.user_has_role(allowed_roles employee_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::text = ANY(allowed_roles::text[])
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  )
$$;

-- 7. Políticas RLS para user_roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own roles' AND tablename = 'user_roles') THEN
    EXECUTE 'CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Directors can manage all roles' AND tablename = 'user_roles') THEN
    EXECUTE 'CREATE POLICY "Directors can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''director'')) WITH CHECK (public.has_role(auth.uid(), ''director''))';
  END IF;
END $$;

-- 8. Atualizar get_accessible_employee_details
CREATE OR REPLACE FUNCTION public.get_accessible_employee_details()
RETURNS TABLE(
  profile_id UUID, user_id UUID, name TEXT, employee_role employee_role,
  phone TEXT, document_cpf TEXT, document_rg TEXT, birth_date DATE,
  address TEXT, is_active BOOLEAN, hire_date DATE, department TEXT,
  salary NUMERIC, permissions JSONB, employee_code TEXT,
  emergency_contact TEXT, emergency_phone TEXT, professional_license TEXT,
  specialization TEXT, work_schedule JSONB, employee_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.user_id, p.name, p.employee_role,
    CASE WHEN auth.uid() = p.user_id OR public.has_role(auth.uid(), 'director') OR 
              public.has_role(auth.uid(), 'coordinator_madre') OR public.has_role(auth.uid(), 'coordinator_floresta')
         THEN p.phone ELSE NULL END,
    CASE WHEN auth.uid() = p.user_id OR public.has_role(auth.uid(), 'director')
         THEN p.document_cpf ELSE NULL END,
    CASE WHEN auth.uid() = p.user_id OR public.has_role(auth.uid(), 'director')
         THEN p.document_rg ELSE NULL END,
    p.birth_date,
    CASE WHEN auth.uid() = p.user_id OR public.has_role(auth.uid(), 'director')
         THEN p.address ELSE NULL END,
    p.is_active, p.hire_date, p.department,
    CASE WHEN auth.uid() = p.user_id OR public.has_role(auth.uid(), 'director')
         THEN p.salary ELSE NULL END,
    p.permissions, e.employee_code,
    CASE WHEN auth.uid() = p.user_id OR public.has_role(auth.uid(), 'director')
         THEN e.emergency_contact ELSE NULL END,
    CASE WHEN auth.uid() = p.user_id OR public.has_role(auth.uid(), 'director')
         THEN e.emergency_phone ELSE NULL END,
    e.professional_license, e.specialization, e.work_schedule,
    e.notes, p.created_at, p.updated_at
  FROM profiles p
  LEFT JOIN employees e ON p.id = e.profile_id
  WHERE p.employee_role IS NOT NULL
    AND (auth.uid() = p.user_id OR public.has_role(auth.uid(), 'director') OR
         public.has_role(auth.uid(), 'coordinator_madre') OR public.has_role(auth.uid(), 'coordinator_floresta'));
$$;

COMMENT ON TABLE public.user_roles IS 'Sistema seguro de roles - previne escalação de privilégios';
COMMENT ON FUNCTION public.has_role IS 'Verifica roles de forma segura';
COMMENT ON FUNCTION public.user_has_role IS 'Compatível com código existente, usa user_roles';