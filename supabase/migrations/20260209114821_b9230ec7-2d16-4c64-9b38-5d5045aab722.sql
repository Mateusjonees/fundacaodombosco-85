
-- Re-add authenticated SELECT policy for profiles since the app requires 
-- employees to look up other employees for messaging, scheduling, etc.
-- This is authenticated-only (not public/anonymous), scoped to active users.
CREATE POLICY "Authenticated users can view active profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_active = true);
