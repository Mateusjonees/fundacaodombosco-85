
-- Adicionar colunas de foto na tabela de ponto (pode já existir das migrações anteriores parciais)
ALTER TABLE public.employee_timesheet
ADD COLUMN IF NOT EXISTS clock_in_photo_url TEXT,
ADD COLUMN IF NOT EXISTS clock_out_photo_url TEXT,
ADD COLUMN IF NOT EXISTS break_start_photo_url TEXT,
ADD COLUMN IF NOT EXISTS break_end_photo_url TEXT;

-- Criar bucket para fotos de ponto (pode já existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('timesheet-photos', 'timesheet-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Verificar se policies já existem antes de criar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Employees upload own timesheet photos') THEN
    EXECUTE 'CREATE POLICY "Employees upload own timesheet photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''timesheet-photos'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Employees view own timesheet photos') THEN
    EXECUTE 'CREATE POLICY "Employees view own timesheet photos" ON storage.objects FOR SELECT USING (bucket_id = ''timesheet-photos'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all timesheet photos') THEN
    EXECUTE 'CREATE POLICY "Admins view all timesheet photos" ON storage.objects FOR SELECT USING (bucket_id = ''timesheet-photos'' AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND employee_role IN (''director''::employee_role, ''coordinator_madre''::employee_role, ''coordinator_floresta''::employee_role, ''coordinator_atendimento_floresta''::employee_role)))';
  END IF;
END $$;
