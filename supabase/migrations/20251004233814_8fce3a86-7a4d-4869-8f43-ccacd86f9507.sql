-- Permitir coordenadores a atualizar perfis de funcionários
CREATE POLICY "Coordinators can update employee profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  user_has_role(ARRAY['director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role])
)
WITH CHECK (
  user_has_role(ARRAY['director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role])
);