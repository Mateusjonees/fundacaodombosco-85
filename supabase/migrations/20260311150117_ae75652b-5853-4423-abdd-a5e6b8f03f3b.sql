ALTER TABLE profiles DISABLE TRIGGER enforce_profile_update_security;

UPDATE profiles 
SET employee_role = 'coordinator_atendimento_floresta', 
    is_active = true, 
    updated_at = NOW() 
WHERE user_id = 'e31a8fba-e385-43e8-a141-9d8987575782';

ALTER TABLE profiles ENABLE TRIGGER enforce_profile_update_security;