-- FIX 1: Restrict absence_records RLS
DROP POLICY IF EXISTS "Authenticated users can view absence records" ON public.absence_records;
DROP POLICY IF EXISTS "Authenticated users can insert absence records" ON public.absence_records;
DROP POLICY IF EXISTS "Authenticated users can update absence records" ON public.absence_records;
DROP POLICY IF EXISTS "Authenticated users can delete absence records" ON public.absence_records;

-- SELECT: only assigned professionals or managers
CREATE POLICY "Staff can view assigned client absences"
ON public.absence_records FOR SELECT TO authenticated
USING (
  public.is_assigned_to_client(client_id)
  OR public.is_manager_role()
);

-- INSERT: only assigned professionals or managers
CREATE POLICY "Staff can insert assigned client absences"
ON public.absence_records FOR INSERT TO authenticated
WITH CHECK (
  public.is_assigned_to_client(client_id)
  OR public.is_manager_role()
);

-- UPDATE: only assigned professionals or managers
CREATE POLICY "Staff can update assigned client absences"
ON public.absence_records FOR UPDATE TO authenticated
USING (
  public.is_assigned_to_client(client_id)
  OR public.is_manager_role()
)
WITH CHECK (
  public.is_assigned_to_client(client_id)
  OR public.is_manager_role()
);

-- DELETE: only managers
CREATE POLICY "Only managers can delete absence records"
ON public.absence_records FOR DELETE TO authenticated
USING (public.is_manager_role());

-- FIX 2: Add is_active check to user_has_any_role
CREATE OR REPLACE FUNCTION public.user_has_any_role(allowed_roles employee_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = ANY(allowed_roles)
    AND is_active = true
  );
$$;