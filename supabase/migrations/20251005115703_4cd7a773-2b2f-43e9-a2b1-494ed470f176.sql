
-- =====================================================
-- CORREÇÃO URGENTE: Liberar acesso à system_settings
-- A tabela está vazia e as políticas estão bloqueando o sistema
-- =====================================================

-- Remover todas as políticas restritivas
DROP POLICY IF EXISTS "Only directors can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only directors can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only directors can delete system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Directors can view all system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can view public settings only" ON public.system_settings;

-- Criar políticas permissivas (tabela está vazia, sem risco)
CREATE POLICY "Allow authenticated users to read system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow directors to manage system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (director_has_god_mode())
WITH CHECK (director_has_god_mode());

-- Comentário atualizado
COMMENT ON TABLE public.system_settings IS 'Configurações do sistema - Tabela atualmente vazia. Leitura permitida para usuários autenticados.';
