-- Adicionar novas permissões ao enum permission_action
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'view_documents';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'create_documents';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'edit_documents';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'delete_documents';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'system_admin';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'manage_permissions';