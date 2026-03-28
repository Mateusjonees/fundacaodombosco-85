CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND employee_role IN (
      'coordinator_madre'::employee_role,
      'coordinator_floresta'::employee_role,
      'coordinator_atendimento_floresta'::employee_role
    )
    AND is_active = true
  );
$$;