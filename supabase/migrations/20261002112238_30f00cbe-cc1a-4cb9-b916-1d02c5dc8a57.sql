GRANT SELECT, INSERT, UPDATE ON public.employee_reports TO authenticated;
GRANT ALL ON public.employee_reports TO service_role;

DROP POLICY IF EXISTS "Professionals can create own employee reports" ON public.employee_reports;
CREATE POLICY "Professionals can create own employee reports"
ON public.employee_reports
FOR INSERT
TO authenticated
WITH CHECK (
  employee_id = auth.uid()
  AND completed_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
  )
);

DROP POLICY IF EXISTS "Professionals can update own employee reports" ON public.employee_reports;
CREATE POLICY "Professionals can update own employee reports"
ON public.employee_reports
FOR UPDATE
TO authenticated
USING (
  employee_id = auth.uid()
  AND completed_by = auth.uid()
)
WITH CHECK (
  employee_id = auth.uid()
  AND completed_by = auth.uid()
);