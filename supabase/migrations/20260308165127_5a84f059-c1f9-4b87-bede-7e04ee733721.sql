-- FIX 2: Secure profiles_public
-- Check if it's a table and convert to security-invoker view
DROP VIEW IF EXISTS public.profiles_public;

-- If it exists as a table, drop it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles_public' AND table_type = 'BASE TABLE') THEN
    DROP TABLE public.profiles_public CASCADE;
  END IF;
END $$;

-- Recreate as security-invoker view with only non-sensitive fields
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
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
FROM public.profiles;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;