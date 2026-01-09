-- Remover constraint antigo
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_unit_check;

-- Adicionar novo constraint com todas as unidades
ALTER TABLE schedules ADD CONSTRAINT schedules_unit_check 
CHECK ((unit = ANY (ARRAY['madre'::text, 'floresta'::text, 'atendimento_floresta'::text])));