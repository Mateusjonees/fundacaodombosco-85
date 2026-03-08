-- FIX 1: Prevent privilege escalation on profiles UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

-- Create a security definer function to check sensitive fields unchanged
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Directors can change anything
  IF public.is_god_mode_director() THEN
    RETURN NEW;
  END IF;
  
  -- Non-directors cannot change sensitive fields
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
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce column-level security
DROP TRIGGER IF EXISTS enforce_profile_update_security ON public.profiles;
CREATE TRIGGER enforce_profile_update_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_update_allowed();

-- Simple UPDATE policy: users can update own row (trigger handles column security)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Directors can update any profile
DROP POLICY IF EXISTS "Directors can update any profile" ON public.profiles;
CREATE POLICY "Directors can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_god_mode_director())
WITH CHECK (true);