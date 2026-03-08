-- Fix security definer view: profiles_public should use SECURITY INVOKER
DROP VIEW IF EXISTS profiles_public;
CREATE VIEW profiles_public WITH (security_invoker = true) AS
SELECT id, user_id, name, employee_role, phone, email, unit, is_active, avatar_url, department, created_at
FROM profiles;

-- Fix functions missing search_path
CREATE OR REPLACE FUNCTION public.create_director_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  new_user_id := gen_random_uuid();
  INSERT INTO public.profiles (user_id, name, employee_role, is_active, unit, created_at, updated_at)
  VALUES (new_user_id, 'Elvimar Peixoto', 'director'::employee_role, true, 'madre', now(), now());
  result := json_build_object('success', true, 'user_id', new_user_id, 'message', 'Usuário diretor criado.');
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE profiles SET updated_at = NOW() WHERE user_id = auth.uid();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE profiles SET updated_at = NOW() WHERE user_id = auth.uid();
  RETURN NEW;
END;
$function$;