-- Harden RLS for clients using security definer helpers
-- This avoids policy instability caused by nested RLS context on profiles.

CREATE OR REPLACE FUNCTION public.can_access_client_unit(target_unit text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND (
        -- Diretor e recepção com acesso amplo
        p.employee_role = 'director'::employee_role
        OR p.employee_role = 'receptionist'::employee_role
        OR (
          p.employee_role IN (
            'coordinator_madre'::employee_role,
            'coordinator_floresta'::employee_role,
            'coordinator_atendimento_floresta'::employee_role
          )
          AND (
            -- Regra principal: array de unidades
            (p.units IS NOT NULL AND target_unit = ANY(p.units))
            -- Fallback: coluna unit simples
            OR (p.units IS NULL AND p.unit IS NOT NULL AND target_unit = p.unit)
            -- Fallback final por cargo
            OR (
              p.units IS NULL AND p.unit IS NULL AND (
                (p.employee_role = 'coordinator_madre'::employee_role AND target_unit = 'madre')
                OR (p.employee_role = 'coordinator_floresta'::employee_role AND target_unit = 'floresta')
                OR (p.employee_role = 'coordinator_atendimento_floresta'::employee_role AND target_unit = 'atendimento_floresta')
              )
            )
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_update_client_unit(target_unit text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND (
        p.employee_role = 'director'::employee_role
        OR (
          p.employee_role IN (
            'coordinator_madre'::employee_role,
            'coordinator_floresta'::employee_role,
            'coordinator_atendimento_floresta'::employee_role
          )
          AND (
            (p.units IS NOT NULL AND target_unit = ANY(p.units))
            OR (p.units IS NULL AND p.unit IS NOT NULL AND target_unit = p.unit)
            OR (
              p.units IS NULL AND p.unit IS NULL AND (
                (p.employee_role = 'coordinator_madre'::employee_role AND target_unit = 'madre')
                OR (p.employee_role = 'coordinator_floresta'::employee_role AND target_unit = 'floresta')
                OR (p.employee_role = 'coordinator_atendimento_floresta'::employee_role AND target_unit = 'atendimento_floresta')
              )
            )
          )
        )
      )
  );
$$;

DROP POLICY IF EXISTS "View clients policy" ON public.clients;
CREATE POLICY "View clients policy"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.can_access_client_unit(clients.unit)
  OR EXISTS (
    SELECT 1
    FROM public.client_assignments ca
    WHERE ca.client_id = clients.id
      AND ca.employee_id = auth.uid()
      AND ca.is_active = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.client_feedback_control cfc
    WHERE cfc.client_id = clients.id
      AND cfc.assigned_to = auth.uid()
  )
);

DROP POLICY IF EXISTS "Update clients policy" ON public.clients;
CREATE POLICY "Update clients policy"
ON public.clients
FOR UPDATE
TO authenticated
USING (public.can_update_client_unit(clients.unit));