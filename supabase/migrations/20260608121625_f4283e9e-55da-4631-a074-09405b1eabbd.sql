DROP POLICY IF EXISTS "Coordinators view profiles in their unit" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);