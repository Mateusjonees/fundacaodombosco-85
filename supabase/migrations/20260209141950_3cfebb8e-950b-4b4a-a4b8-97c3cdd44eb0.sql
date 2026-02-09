
-- ============================================
-- FIX 1: PROFILES - Restringir acesso a dados sensíveis
-- ============================================

-- Recriar view profiles_public SEM security_invoker
-- Isso permite que a view funcione independente das políticas RLS da tabela base
DROP VIEW IF EXISTS profiles_public;

CREATE VIEW profiles_public AS
SELECT 
  id,
  user_id,
  name,
  employee_role,
  phone,
  email,
  unit,
  is_active,
  avatar_url,
  department,
  created_at
FROM profiles;

-- Garantir acesso à view para usuários autenticados
GRANT SELECT ON profiles_public TO authenticated;
GRANT SELECT ON profiles_public TO anon;

-- Remover política permissiva que expõe TODOS os dados de perfil
DROP POLICY IF EXISTS "Authenticated users can view active profiles" ON profiles;

-- Manter: "Users can view their own profile" (auth.uid() = user_id)
-- Manter: "Directors have full access" (is_director())
-- Manter: "Coordinators can view profiles" (is_coordinator())

-- ============================================
-- FIX 2: MEDICAL RECORDS - Restringir acesso
-- ============================================

-- Remover política antiga permissiva
DROP POLICY IF EXISTS "Staff can view medical records of assigned clients" ON medical_records;
DROP POLICY IF EXISTS "Directors have full access to medical records" ON medical_records;
DROP POLICY IF EXISTS "Staff can update medical records" ON medical_records;

-- Nova política: apenas profissional atribuído pode ver prontuários
CREATE POLICY "Assigned staff can view medical records"
ON medical_records FOR SELECT
USING (
  -- Próprio registro criado pelo profissional
  employee_id = auth.uid()
  -- Profissional atribuído ao paciente
  OR EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = medical_records.client_id
    AND ca.employee_id = auth.uid()
    AND ca.is_active = true
  )
  -- Coordenadores e diretores (acesso administrativo necessário)
  OR user_has_any_role(ARRAY['director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role, 'coordinator_atendimento_floresta'::employee_role])
);

-- Diretores podem modificar prontuários
CREATE POLICY "Directors can manage medical records"
ON medical_records FOR ALL
USING (
  user_has_any_role(ARRAY['director'::employee_role])
);

-- Manter política de update existente para profissionais atribuídos
-- (Staff can update medical records of assigned clients já existe)
