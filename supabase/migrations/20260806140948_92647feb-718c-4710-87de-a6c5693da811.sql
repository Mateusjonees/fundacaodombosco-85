DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT id, user_id, name, employee_role, unit, department, is_active, avatar_url,
       professional_license, professional_rqe, created_at, updated_at
FROM public.profiles;
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
GRANT ALL ON public.profiles_public TO service_role;