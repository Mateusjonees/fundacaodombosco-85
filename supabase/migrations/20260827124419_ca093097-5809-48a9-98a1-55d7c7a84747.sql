CREATE OR REPLACE FUNCTION public.check_profile_update_allowed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Chamadas administrativas do servidor (edge functions com service_role)
  -- ou gatilhos internos do banco sem usuário autenticado
  IF auth.uid() IS NULL OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Diretores podem alterar tudo
  IF public.is_god_mode_director() OR public.is_director() THEN
    RETURN NEW;
  END IF;

  IF NEW.employee_role IS DISTINCT FROM OLD.employee_role THEN
    RAISE EXCEPTION 'Not authorized to change employee_role';
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Not authorized to change is_active';
  END IF;
  IF NEW.salary IS DISTINCT FROM OLD.salary THEN
    RAISE EXCEPTION 'Not authorized to change salary';
  END IF;
  IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
    RAISE EXCEPTION 'Not authorized to change permissions';
  END IF;
  IF NEW.units IS DISTINCT FROM OLD.units THEN
    RAISE EXCEPTION 'Not authorized to change units';
  END IF;
  IF NEW.unit IS DISTINCT FROM OLD.unit THEN
    RAISE EXCEPTION 'Not authorized to change unit';
  END IF;
  IF NEW.department IS DISTINCT FROM OLD.department THEN
    RAISE EXCEPTION 'Not authorized to change department';
  END IF;

  RETURN NEW;
END;
$function$;