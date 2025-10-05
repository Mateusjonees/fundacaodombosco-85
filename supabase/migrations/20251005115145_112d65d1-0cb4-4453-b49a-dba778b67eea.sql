
-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: system_settings
-- Habilitar RLS e criar políticas para proteger configurações
-- =====================================================

-- Habilitar Row Level Security na tabela system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política 1: Apenas diretores podem inserir novas configurações
CREATE POLICY "Only directors can insert system settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (
  director_has_god_mode()
);

-- Política 2: Apenas diretores podem atualizar configurações
CREATE POLICY "Only directors can update system settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (director_has_god_mode())
WITH CHECK (director_has_god_mode());

-- Política 3: Apenas diretores podem deletar configurações
CREATE POLICY "Only directors can delete system settings"
ON public.system_settings
FOR DELETE
TO authenticated
USING (director_has_god_mode());

-- Política 4: Diretores podem ver todas as configurações
CREATE POLICY "Directors can view all system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (director_has_god_mode());

-- Política 5: Usuários autenticados podem ver APENAS configurações públicas
CREATE POLICY "Authenticated users can view public settings only"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  is_public = true
  AND auth.uid() IS NOT NULL
);

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON public.system_settings(is_public) WHERE is_public = true;

-- Comentário de documentação
COMMENT ON TABLE public.system_settings IS 'Configurações sensíveis do sistema protegidas por RLS. Acesso restrito a diretores.';
