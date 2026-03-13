-- Update units for Gabriel and Felipe to have access to all units
UPDATE profiles SET units = ARRAY['madre','floresta','atendimento_floresta']
WHERE user_id IN (
  '72c334c0-97a3-4b9c-a78b-751ceefa8cc9',
  '7571f0eb-e676-4650-a510-f4e6ed7bbe5b'
);