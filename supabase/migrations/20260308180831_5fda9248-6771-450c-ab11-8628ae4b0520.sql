
-- Tabela da Fila de Espera
CREATE TABLE public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  service_type TEXT NOT NULL,
  preferred_professional TEXT,
  preferred_unit TEXT,
  preferred_days TEXT[],
  preferred_shift TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'waiting',
  notes TEXT,
  reason TEXT,
  notified_at TIMESTAMPTZ,
  notified_by UUID,
  scheduled_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  position_order INTEGER DEFAULT 0
);

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados podem ver a fila
CREATE POLICY "Authenticated users can view waiting list"
  ON public.waiting_list FOR SELECT TO authenticated
  USING (true);

-- Gestores podem gerenciar
CREATE POLICY "Managers can manage waiting list"
  ON public.waiting_list FOR ALL TO authenticated
  USING (
    public.user_has_any_role(ARRAY['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist']::employee_role[])
  )
  WITH CHECK (
    public.user_has_any_role(ARRAY['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist']::employee_role[])
  );
