INSERT INTO public.user_specific_permissions (user_id, permission, granted, granted_by)
VALUES
  ('14a88df6-c8a3-4214-9fa1-e22827611f05', 'manage_users', true, auth.uid()),
  ('14a88df6-c8a3-4214-9fa1-e22827611f05', 'view_employees', true, auth.uid()),
  ('14a88df6-c8a3-4214-9fa1-e22827611f05', 'create_employees', true, auth.uid()),
  ('14a88df6-c8a3-4214-9fa1-e22827611f05', 'edit_employees', true, auth.uid()),
  ('14a88df6-c8a3-4214-9fa1-e22827611f05', 'edit_user_permissions', true, auth.uid()),
  ('14a88df6-c8a3-4214-9fa1-e22827611f05', 'change_user_passwords', true, auth.uid())
ON CONFLICT (user_id, permission) DO UPDATE SET granted = true, expires_at = NULL;