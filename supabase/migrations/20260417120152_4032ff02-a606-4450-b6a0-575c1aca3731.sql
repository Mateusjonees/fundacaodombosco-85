INSERT INTO public.profiles (user_id, name, employee_role, is_active, must_change_password, unit, units)
VALUES (
  '14a88df6-c8a3-4214-9fa1-e22827611f05',
  'CHRISTOPHER COELHO',
  'coordinator_madre'::employee_role,
  true,
  true,
  'madre',
  ARRAY['madre']
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  employee_role = EXCLUDED.employee_role,
  is_active = true,
  must_change_password = true,
  unit = EXCLUDED.unit,
  units = EXCLUDED.units,
  updated_at = now();