-- Check current user authentication
SELECT auth.uid() as current_user_id;

-- Check if current user has a profile
SELECT user_id, name, employee_role 
FROM profiles 
WHERE user_id = auth.uid();