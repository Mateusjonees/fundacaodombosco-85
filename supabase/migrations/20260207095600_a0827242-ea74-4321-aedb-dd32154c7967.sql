
-- Adicionar coluna permissions na tabela custom_job_positions
ALTER TABLE public.custom_job_positions 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}';

-- Comentário na coluna
COMMENT ON COLUMN public.custom_job_positions.permissions IS 'Permissões padrão associadas ao cargo personalizado';
