
DROP POLICY IF EXISTS "Staff can update attendance reports" ON public.attendance_reports;

CREATE POLICY "Staff can update attendance reports"
  ON public.attendance_reports
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR completed_by = auth.uid()
    OR employee_id = auth.uid()
    OR director_has_god_mode()
  )
  WITH CHECK (
    created_by = auth.uid()
    OR completed_by = auth.uid()
    OR employee_id = auth.uid()
    OR director_has_god_mode()
  );
