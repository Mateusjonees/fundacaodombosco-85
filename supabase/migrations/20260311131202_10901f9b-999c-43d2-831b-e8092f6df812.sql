-- Atualizar o campo units do Gabriel Arcanjo para incluir atendimento_floresta
UPDATE profiles 
SET units = ARRAY['atendimento_floresta']::text[]
WHERE user_id = '72c334c0-97a3-4b9c-a78b-751ceefa8cc9';