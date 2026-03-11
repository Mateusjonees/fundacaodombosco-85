-- Permitir recepcionistas a criar notificações de chegada de paciente
DROP POLICY IF EXISTS "Coordinators and directors can create notifications" ON appointment_notifications;

CREATE POLICY "Staff can create appointment notifications" ON appointment_notifications
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.employee_role IN (
      'director', 
      'coordinator_madre', 
      'coordinator_floresta', 
      'coordinator_atendimento_floresta',
      'receptionist'
    )
    AND p.is_active = true
  )
);