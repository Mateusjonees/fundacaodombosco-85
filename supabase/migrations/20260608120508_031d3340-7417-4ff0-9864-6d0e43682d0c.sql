CREATE POLICY "Staff can view clients of their schedules"
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schedules s
    WHERE s.client_id = clients.id
      AND s.employee_id = auth.uid()
  )
);