-- Recriar a view profiles_public sem security_invoker para que
-- todos os usuários autenticados possam fazer lookup de nomes/cargos
-- A view já exclui campos sensíveis (CPF, RG, salário, telefone, endereço)
DROP VIEW IF EXISTS profiles_public;

CREATE VIEW profiles_public AS
SELECT 
  id,
  user_id,
  name,
  employee_role,
  unit,
  department,
  is_active,
  avatar_url,
  created_at,
  updated_at
FROM profiles;

-- Garantir que usuários autenticados possam consultar a view
GRANT SELECT ON profiles_public TO authenticated;