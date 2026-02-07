
-- Primeiro dropar as versões existentes da função
DROP FUNCTION IF EXISTS public.get_user_permissions(uuid);

-- Recriar com a lógica integrada de cargos personalizados
CREATE FUNCTION public.get_user_permissions(user_uuid uuid)
RETURNS TABLE(permission permission_action, granted boolean, source text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- 1. Permissões específicas do usuário (maior prioridade)
  SELECT 
    usp.permission::permission_action,
    usp.granted,
    'user_specific'::text as source
  FROM user_specific_permissions usp
  WHERE usp.user_id = user_uuid 
    AND (usp.expires_at IS NULL OR usp.expires_at > NOW())
  
  UNION
  
  -- 2. Permissões de cargos personalizados (via user_job_assignments + custom_job_positions)
  SELECT 
    perm_key::permission_action,
    true,
    'custom_position'::text as source
  FROM user_job_assignments uja
  JOIN custom_job_positions cjp ON cjp.id = uja.position_id
  CROSS JOIN LATERAL jsonb_each_text(COALESCE(cjp.permissions, '{}'::jsonb)) AS kv(perm_key, perm_val)
  WHERE uja.user_id = user_uuid
    AND uja.is_active = true
    AND cjp.is_active = true
    AND kv.perm_val = 'true'
    AND perm_key = ANY(enum_range(NULL::permission_action)::text[])
    AND NOT EXISTS (
      SELECT 1 FROM user_specific_permissions usp2 
      WHERE usp2.user_id = user_uuid 
        AND usp2.permission::text = perm_key
        AND (usp2.expires_at IS NULL OR usp2.expires_at > NOW())
    )
  
  UNION
  
  -- 3. Permissões do cargo padrão do sistema (menor prioridade)
  SELECT 
    rp.permission::text::permission_action,
    rp.granted,
    'role'::text as source
  FROM profiles p
  JOIN role_permissions rp ON rp.employee_role = p.employee_role
  WHERE p.user_id = user_uuid
    AND rp.granted = true
    AND rp.permission::text = ANY(enum_range(NULL::permission_action)::text[])
    AND NOT EXISTS (
      SELECT 1 FROM user_specific_permissions usp3 
      WHERE usp3.user_id = user_uuid 
        AND usp3.permission::text = rp.permission::text
        AND (usp3.expires_at IS NULL OR usp3.expires_at > NOW())
    )
    AND NOT EXISTS (
      SELECT 1 
      FROM user_job_assignments uja2
      JOIN custom_job_positions cjp2 ON cjp2.id = uja2.position_id
      WHERE uja2.user_id = user_uuid
        AND uja2.is_active = true
        AND cjp2.is_active = true
        AND cjp2.permissions ? rp.permission::text
    );
END;
$$;
