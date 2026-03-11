-- Remover política antiga que permite acesso via schedules (agendamentos antigos/cancelados)
DROP POLICY IF EXISTS "View clients policy" ON clients;

-- Nova política: profissionais só veem clientes via client_assignments ativos (sem schedules)
CREATE POLICY "View clients policy" ON clients FOR SELECT USING (
  -- Diretores: acesso total
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role = 'director'::employee_role
    AND profiles.is_active = true
  ))
  -- Coordenador Madre: apenas unidade madre
  OR (unit = 'madre' AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role = 'coordinator_madre'::employee_role
    AND profiles.is_active = true
  ))
  -- Coordenador Floresta: apenas unidade floresta
  OR (unit = 'floresta' AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role = 'coordinator_floresta'::employee_role
    AND profiles.is_active = true
  ))
  -- Coordenador Atendimento Floresta
  OR (unit = 'atendimento_floresta' AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role = 'coordinator_atendimento_floresta'::employee_role
    AND profiles.is_active = true
  ))
  -- Recepcionistas: acesso a todos
  OR (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role = 'receptionist'::employee_role
    AND profiles.is_active = true
  ))
  -- Profissionais: APENAS via client_assignments ATIVOS (removido schedules)
  OR (EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = clients.id
    AND ca.employee_id = auth.uid()
    AND ca.is_active = true
  ))
  -- Feedback control
  OR (EXISTS (
    SELECT 1 FROM client_feedback_control cfc
    WHERE cfc.client_id = clients.id
    AND cfc.assigned_to = auth.uid()
  ))
);