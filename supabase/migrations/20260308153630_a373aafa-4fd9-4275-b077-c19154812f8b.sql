
-- Allow coordinators and directors to DELETE clients
CREATE POLICY "Coordinators can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete medical_records
CREATE POLICY "Coordinators can delete medical_records"
ON public.medical_records
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete attendance_reports
CREATE POLICY "Coordinators can delete attendance_reports"
ON public.attendance_reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete appointment_notifications
CREATE POLICY "Coordinators can delete appointment_notifications"
ON public.appointment_notifications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete schedules
CREATE POLICY "Coordinators can delete schedules"
ON public.schedules
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete client_payments
CREATE POLICY "Coordinators can delete client_payments"
ON public.client_payments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete neuro_test_results
CREATE POLICY "Coordinators can delete neuro_test_results"
ON public.neuro_test_results
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete financial_records
CREATE POLICY "Coordinators can delete financial_records"
ON public.financial_records
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete automatic_financial_records
CREATE POLICY "Coordinators can delete automatic_financial_records"
ON public.automatic_financial_records
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete anamnesis_records
CREATE POLICY "Coordinators can delete anamnesis_records"
ON public.anamnesis_records
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete consent_records
CREATE POLICY "Coordinators can delete consent_records"
ON public.consent_records
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete internal_referrals
CREATE POLICY "Coordinators can delete internal_referrals"
ON public.internal_referrals
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);

-- Allow coordinators to delete meeting_alerts
CREATE POLICY "Coordinators can delete meeting_alerts"
ON public.meeting_alerts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role IN ('director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta')
    AND profiles.is_active = true
  )
);
