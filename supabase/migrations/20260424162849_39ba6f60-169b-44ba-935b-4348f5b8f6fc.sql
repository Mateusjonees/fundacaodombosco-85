INSERT INTO public.client_assignments (client_id, employee_id, assigned_by, assigned_at, is_active)
SELECT DISTINCT ON (s.client_id, s.employee_id)
  s.client_id,
  s.employee_id,
  CASE
    WHEN s.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = s.created_by)
      THEN s.created_by
    ELSE s.employee_id
  END AS assigned_by,
  now() AS assigned_at,
  true AS is_active
FROM public.schedules s
WHERE s.client_id IS NOT NULL
  AND s.employee_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.user_id = s.employee_id)
  AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = s.client_id)
ON CONFLICT (client_id, employee_id)
DO UPDATE SET
  is_active = true,
  assigned_at = COALESCE(public.client_assignments.assigned_at, EXCLUDED.assigned_at);