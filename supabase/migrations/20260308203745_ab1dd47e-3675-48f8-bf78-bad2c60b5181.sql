ALTER TABLE profiles DISABLE TRIGGER enforce_profile_update_security;

UPDATE profiles 
SET employee_role = 'receptionist', unit = 'atendimento_floresta', updated_at = now() 
WHERE user_id = '72c334c0-97a3-4b9c-a78b-751ceefa8cc9';

ALTER TABLE profiles ENABLE TRIGGER enforce_profile_update_security;