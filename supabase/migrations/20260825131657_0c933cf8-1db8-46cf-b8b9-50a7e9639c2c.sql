-- 1) patient_portal_tokens: restrict INSERT to assigned staff or managers
DROP POLICY IF EXISTS "Authenticated users can insert patient_portal_tokens" ON public.patient_portal_tokens;

CREATE POLICY "Assigned staff or managers can create portal tokens"
ON public.patient_portal_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.is_manager_role()
    OR public.is_director()
    OR public.is_assigned_to_client(client_id)
  )
);

-- 2) profiles: remove duplicated permissive self-update policy (no WITH CHECK)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Keep a single, explicit self-update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Harden the column-level guard: block privilege/compensation escalation
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Directors can change anything
  IF public.is_god_mode_director() OR public.is_director() THEN
    RETURN NEW;
  END IF;

  IF NEW.employee_role IS DISTINCT FROM OLD.employee_role THEN
    RAISE EXCEPTION 'Not authorized to change employee_role';
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Not authorized to change is_active';
  END IF;
  IF NEW.salary IS DISTINCT FROM OLD.salary THEN
    RAISE EXCEPTION 'Not authorized to change salary';
  END IF;
  IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
    RAISE EXCEPTION 'Not authorized to change permissions';
  END IF;
  IF NEW.units IS DISTINCT FROM OLD.units THEN
    RAISE EXCEPTION 'Not authorized to change units';
  END IF;
  IF NEW.unit IS DISTINCT FROM OLD.unit THEN
    RAISE EXCEPTION 'Not authorized to change unit';
  END IF;
  IF NEW.department IS DISTINCT FROM OLD.department THEN
    RAISE EXCEPTION 'Not authorized to change department';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_update_security ON public.profiles;
CREATE TRIGGER enforce_profile_update_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_profile_update_allowed();