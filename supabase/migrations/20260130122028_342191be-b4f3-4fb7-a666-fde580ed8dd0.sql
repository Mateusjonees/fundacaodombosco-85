-- Adicionar colunas para rastrear confirmação do paciente por e-mail
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS confirmation_token text;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS patient_confirmed boolean DEFAULT false;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS patient_confirmed_at timestamptz;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_schedules_confirmation_token ON public.schedules(confirmation_token) WHERE confirmation_token IS NOT NULL;