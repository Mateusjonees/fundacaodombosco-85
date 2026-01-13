-- Remover políticas antigas restritivas do bucket laudos
DROP POLICY IF EXISTS "Diretores e coordenadores podem visualizar laudos" ON storage.objects;
DROP POLICY IF EXISTS "Diretores e coordenadores podem fazer upload de laudos" ON storage.objects;
DROP POLICY IF EXISTS "Diretores e coordenadores podem atualizar laudos" ON storage.objects;
DROP POLICY IF EXISTS "Diretores e coordenadores podem deletar laudos" ON storage.objects;
DROP POLICY IF EXISTS "Coordenadores e funcionários podem fazer upload de laudos" ON storage.objects;
DROP POLICY IF EXISTS "Coordenadores e funcionários podem visualizar laudos" ON storage.objects;
DROP POLICY IF EXISTS "Apenas coordenadores podem excluir laudos" ON storage.objects;

-- Criar políticas mais abrangentes para funcionários ativos

-- Política de SELECT: Qualquer funcionário ativo pode visualizar laudos
CREATE POLICY "Funcionários ativos podem visualizar laudos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'laudos' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true
  )
);

-- Política de INSERT: Qualquer funcionário ativo pode fazer upload de laudos
CREATE POLICY "Funcionários ativos podem fazer upload de laudos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'laudos' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true
  )
);

-- Política de UPDATE: Qualquer funcionário ativo pode atualizar laudos
CREATE POLICY "Funcionários ativos podem atualizar laudos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'laudos' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true
  )
);

-- Política de DELETE: Diretores e coordenadores podem excluir laudos
CREATE POLICY "Coordenadores e diretores podem excluir laudos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'laudos' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true
    AND profiles.employee_role IN (
      'director', 
      'coordinator_floresta', 
      'coordinator_madre', 
      'coordinator_atendimento_floresta'
    )
  )
);