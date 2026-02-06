-- Atualizar o perfil do Felipe para ter acesso às unidades floresta e atendimento_floresta
UPDATE profiles 
SET units = ARRAY['floresta', 'atendimento_floresta']
WHERE user_id = '7571f0eb-e676-4650-a510-f4e6ed7bbe5b';