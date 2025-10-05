-- =====================================================
-- REVERTER MUDANÇAS: Voltar system_settings ao estado original
-- =====================================================

-- Remover políticas criadas na última migração
DROP POLICY IF EXISTS "Allow authenticated users to read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow directors to manage system settings" ON public.system_settings;

-- Recriar políticas originais mais permissivas
CREATE POLICY "Authenticated users can view public settings only"
ON public.system_settings
FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Directors can view all system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'::employee_role
  )
);

CREATE POLICY "Only directors can insert system settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'::employee_role
  )
);

CREATE POLICY "Only directors can update system settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'::employee_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'::employee_role
  )
);

CREATE POLICY "Only directors can delete system settings"
ON public.system_settings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND employee_role = 'director'::employee_role
  )
);

COMMENT ON TABLE public.system_settings IS 'Configurações gerais do sistema com controle de acesso baseado em roles';