-- Garantir acesso por unidade para coordenadores (somente Tatiane com multi-unidade)
UPDATE profiles
SET
  unit = CASE
    WHEN user_id = 'e99472e0-91c6-4982-8efb-e9eb4dcb1c26' THEN 'floresta' -- Tatiane
    WHEN employee_role = 'coordinator_madre' THEN 'madre'
    WHEN employee_role = 'coordinator_floresta' THEN 'floresta'
    WHEN employee_role = 'coordinator_atendimento_floresta' THEN 'atendimento_floresta'
    ELSE unit
  END,
  units = CASE
    WHEN user_id = 'e99472e0-91c6-4982-8efb-e9eb4dcb1c26' THEN ARRAY['madre','floresta','atendimento_floresta']::text[]
    WHEN employee_role = 'coordinator_madre' THEN ARRAY['madre']::text[]
    WHEN employee_role = 'coordinator_floresta' THEN ARRAY['floresta']::text[]
    WHEN employee_role = 'coordinator_atendimento_floresta' THEN ARRAY['atendimento_floresta']::text[]
    ELSE units
  END
WHERE is_active = true
  AND employee_role IN ('coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta');

-- Policy SELECT: coordenador vê apenas unidade permitida
DROP POLICY IF EXISTS "View clients policy" ON clients;
CREATE POLICY "View clients policy" ON clients
FOR SELECT TO authenticated
USING (
  director_has_god_mode()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND employee_role = 'receptionist'
      AND is_active = true
  )
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.employee_role IN ('coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
      AND p.is_active = true
      AND (
        (p.units IS NOT NULL AND clients.unit = ANY(p.units))
        OR (p.units IS NULL AND p.unit IS NOT NULL AND clients.unit = p.unit)
        OR (
          p.units IS NULL AND p.unit IS NULL AND (
            (p.employee_role = 'coordinator_madre' AND clients.unit = 'madre')
            OR (p.employee_role = 'coordinator_floresta' AND clients.unit = 'floresta')
            OR (p.employee_role = 'coordinator_atendimento_floresta' AND clients.unit = 'atendimento_floresta')
          )
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM client_assignments ca
    WHERE ca.client_id = clients.id
      AND ca.employee_id = auth.uid()
      AND ca.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM client_feedback_control cfc
    WHERE cfc.client_id = clients.id
      AND cfc.assigned_to = auth.uid()
  )
);

-- Policy UPDATE: coordenador altera apenas unidade permitida
DROP POLICY IF EXISTS "Update clients policy" ON clients;
CREATE POLICY "Update clients policy" ON clients
FOR UPDATE TO authenticated
USING (
  director_has_god_mode()
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.employee_role IN ('coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
      AND p.is_active = true
      AND (
        (p.units IS NOT NULL AND clients.unit = ANY(p.units))
        OR (p.units IS NULL AND p.unit IS NOT NULL AND clients.unit = p.unit)
        OR (
          p.units IS NULL AND p.unit IS NULL AND (
            (p.employee_role = 'coordinator_madre' AND clients.unit = 'madre')
            OR (p.employee_role = 'coordinator_floresta' AND clients.unit = 'floresta')
            OR (p.employee_role = 'coordinator_atendimento_floresta' AND clients.unit = 'atendimento_floresta')
          )
        )
      )
  )
);