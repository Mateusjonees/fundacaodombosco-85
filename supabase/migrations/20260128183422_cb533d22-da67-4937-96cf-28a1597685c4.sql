-- Criar tabela para armazenar resultados dos testes neuropsicológicos
CREATE TABLE public.neuro_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  attendance_report_id UUID REFERENCES public.attendance_reports(id) ON DELETE SET NULL,
  test_code TEXT NOT NULL,
  test_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  raw_scores JSONB NOT NULL DEFAULT '{}',
  calculated_scores JSONB NOT NULL DEFAULT '{}',
  percentiles JSONB NOT NULL DEFAULT '{}',
  classifications JSONB NOT NULL DEFAULT '{}',
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para buscas eficientes
CREATE INDEX idx_neuro_test_results_client_id ON public.neuro_test_results(client_id);
CREATE INDEX idx_neuro_test_results_schedule_id ON public.neuro_test_results(schedule_id);
CREATE INDEX idx_neuro_test_results_applied_at ON public.neuro_test_results(applied_at DESC);
CREATE INDEX idx_neuro_test_results_test_code ON public.neuro_test_results(test_code);

-- Habilitar RLS
ALTER TABLE public.neuro_test_results ENABLE ROW LEVEL SECURITY;

-- Policies de segurança
CREATE POLICY "Usuários autenticados podem ver resultados de testes"
ON public.neuro_test_results
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir resultados"
ON public.neuro_test_results
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar resultados"
ON public.neuro_test_results
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar resultados"
ON public.neuro_test_results
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_neuro_test_results_updated_at
BEFORE UPDATE ON public.neuro_test_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();