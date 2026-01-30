-- Adicionar campos para controle de recusa do paciente
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS patient_declined boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS patient_declined_at timestamptz;