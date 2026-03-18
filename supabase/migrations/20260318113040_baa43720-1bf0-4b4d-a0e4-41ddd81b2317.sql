
-- Tabela de tarefas pessoais do profissional
CREATE TABLE public.professional_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de eventos/compromissos pessoais
CREATE TABLE public.personal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  recurrence TEXT, -- 'daily', 'weekly', 'monthly' ou null
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.professional_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_events ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuário só vê/edita suas próprias tarefas e eventos
CREATE POLICY "Users can manage own tasks" ON public.professional_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own events" ON public.personal_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_professional_tasks_user_id ON public.professional_tasks(user_id);
CREATE INDEX idx_professional_tasks_due_date ON public.professional_tasks(due_date);
CREATE INDEX idx_personal_events_user_id ON public.personal_events(user_id);
CREATE INDEX idx_personal_events_start_time ON public.personal_events(start_time);
