
-- Adicionar coluna reminder_sent_at na tabela schedules
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Criar índice para busca eficiente de agendamentos sem lembrete enviado
CREATE INDEX IF NOT EXISTS idx_schedules_reminder_pending 
ON public.schedules (start_time) 
WHERE reminder_sent_at IS NULL AND status = 'scheduled';
