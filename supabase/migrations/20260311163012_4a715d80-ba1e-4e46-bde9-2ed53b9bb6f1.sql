ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS service_type text DEFAULT NULL;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS professional_amount numeric DEFAULT NULL;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS foundation_amount numeric DEFAULT NULL;

COMMENT ON COLUMN public.schedules.service_type IS 'Tipo de demanda (private, sus, external, laudo) - usado para Atendimento Floresta';
COMMENT ON COLUMN public.schedules.professional_amount IS 'Valor destinado ao profissional - definido pelo coordenador';
COMMENT ON COLUMN public.schedules.foundation_amount IS 'Valor destinado à fundação - definido pelo coordenador';