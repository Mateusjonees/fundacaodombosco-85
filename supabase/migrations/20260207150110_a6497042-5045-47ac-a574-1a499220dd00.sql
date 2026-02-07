-- Create prescriptions storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for prescriptions bucket
CREATE POLICY "Funcionários ativos podem visualizar receitas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true
  )
);

CREATE POLICY "Funcionários ativos podem fazer upload de receitas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true
  )
);

CREATE POLICY "Funcionários ativos podem atualizar receitas"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prescriptions' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true
  )
);

CREATE POLICY "Coordenadores e diretores podem excluir receitas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prescriptions' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true 
    AND profiles.employee_role IN ('director', 'coordinator_floresta', 'coordinator_madre', 'coordinator_atendimento_floresta')
  )
);