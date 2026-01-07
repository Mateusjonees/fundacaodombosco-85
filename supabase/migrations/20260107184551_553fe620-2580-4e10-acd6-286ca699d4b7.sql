-- Primeiro, remover a constraint antiga
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_unit_check;

-- Adicionar nova constraint que inclui 'atendimento_floresta'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_unit_check 
CHECK (unit IS NULL OR unit = ANY (ARRAY['madre'::text, 'floresta'::text, 'atendimento_floresta'::text]));

-- Adicionar coluna units para suportar múltiplas unidades
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS units text[] DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.units IS 'Array de unidades vinculadas ao funcionário';