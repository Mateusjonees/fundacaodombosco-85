
-- =============================================
-- ETAPA 1: Criação de 8 novas tabelas + teleconsulta
-- =============================================

-- 1. Fila de Espera
CREATE TABLE public.wait_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Madre',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'high')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'cancelled')),
  notes TEXT,
  position INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wait_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view wait_list" ON public.wait_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert wait_list" ON public.wait_list FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update wait_list" ON public.wait_list FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete wait_list" ON public.wait_list FOR DELETE TO authenticated USING (true);

-- 2. Registro de Faltas
CREATE TABLE public.absence_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  absence_date DATE NOT NULL,
  was_notified BOOLEAN NOT NULL DEFAULT false,
  consecutive_count INT NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.absence_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view absence_records" ON public.absence_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert absence_records" ON public.absence_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update absence_records" ON public.absence_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete absence_records" ON public.absence_records FOR DELETE TO authenticated USING (true);

-- 3. Planos Terapêuticos
CREATE TABLE public.therapeutic_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  professional_id UUID,
  title TEXT NOT NULL,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.therapeutic_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view therapeutic_plans" ON public.therapeutic_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert therapeutic_plans" ON public.therapeutic_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update therapeutic_plans" ON public.therapeutic_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete therapeutic_plans" ON public.therapeutic_plans FOR DELETE TO authenticated USING (true);

-- 4. Progresso Terapêutico
CREATE TABLE public.therapeutic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.therapeutic_plans(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_value INT NOT NULL DEFAULT 0 CHECK (progress_value >= 0 AND progress_value <= 100),
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.therapeutic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view therapeutic_progress" ON public.therapeutic_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert therapeutic_progress" ON public.therapeutic_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update therapeutic_progress" ON public.therapeutic_progress FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete therapeutic_progress" ON public.therapeutic_progress FOR DELETE TO authenticated USING (true);

-- 5. Modelos de Termos de Consentimento
CREATE TABLE public.consent_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view consent_templates" ON public.consent_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert consent_templates" ON public.consent_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update consent_templates" ON public.consent_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete consent_templates" ON public.consent_templates FOR DELETE TO authenticated USING (true);

-- 6. Termos Assinados
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.consent_templates(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  witness_name TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view consent_records" ON public.consent_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert consent_records" ON public.consent_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update consent_records" ON public.consent_records FOR UPDATE TO authenticated USING (true);

-- 7. Encaminhamentos Internos
CREATE TABLE public.internal_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  from_professional UUID NOT NULL,
  to_professional UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'rejected')),
  notes TEXT,
  response_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view internal_referrals" ON public.internal_referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert internal_referrals" ON public.internal_referrals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update internal_referrals" ON public.internal_referrals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete internal_referrals" ON public.internal_referrals FOR DELETE TO authenticated USING (true);

-- 8. Tokens do Portal do Paciente
CREATE TABLE public.patient_portal_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view patient_portal_tokens" ON public.patient_portal_tokens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert patient_portal_tokens" ON public.patient_portal_tokens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update patient_portal_tokens" ON public.patient_portal_tokens FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Public can read active tokens" ON public.patient_portal_tokens FOR SELECT TO anon USING (is_active = true AND expires_at > now());

-- 9. Teleconsulta - Colunas na tabela schedules
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Triggers de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_wait_list_updated_at BEFORE UPDATE ON public.wait_list FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_therapeutic_plans_updated_at BEFORE UPDATE ON public.therapeutic_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consent_templates_updated_at BEFORE UPDATE ON public.consent_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internal_referrals_updated_at BEFORE UPDATE ON public.internal_referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes para performance
CREATE INDEX idx_wait_list_status ON public.wait_list(status);
CREATE INDEX idx_wait_list_unit ON public.wait_list(unit);
CREATE INDEX idx_absence_records_client ON public.absence_records(client_id);
CREATE INDEX idx_absence_records_date ON public.absence_records(absence_date);
CREATE INDEX idx_therapeutic_plans_client ON public.therapeutic_plans(client_id);
CREATE INDEX idx_therapeutic_progress_plan ON public.therapeutic_progress(plan_id);
CREATE INDEX idx_consent_records_client ON public.consent_records(client_id);
CREATE INDEX idx_internal_referrals_status ON public.internal_referrals(status);
CREATE INDEX idx_internal_referrals_to ON public.internal_referrals(to_professional);
CREATE INDEX idx_patient_portal_tokens_token ON public.patient_portal_tokens(token);
