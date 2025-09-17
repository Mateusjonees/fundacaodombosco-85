-- Security fix: Replace insecure employee_details view with secure access patterns

-- Drop the existing insecure view that exposes all employee data
DROP VIEW IF EXISTS public.employee_details;

-- Create a secure function that implements field-level security for employee data
CREATE OR REPLACE FUNCTION public.get_secure_employee_details()
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  name text,
  employee_role employee_role,
  phone text,
  document_cpf text,
  document_rg text,
  birth_date date,
  address text,
  is_active boolean,
  hire_date date,
  department text,
  salary numeric,
  permissions jsonb,
  employee_code text,
  emergency_contact text,
  emergency_phone text,
  professional_license text,
  specialization text,
  work_schedule jsonb,
  employee_notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return employee details with field-level security based on user role and ownership
  SELECT 
    p.id AS profile_id,
    p.user_id,
    p.name,
    p.employee_role,
    CASE 
      -- Sensitive phone data: only directors/coordinators or own record
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role]) 
      THEN p.phone 
      ELSE NULL 
    END AS phone,
    CASE 
      -- CPF: only directors or own record (most sensitive)
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN p.document_cpf 
      ELSE NULL 
    END AS document_cpf,
    CASE 
      -- RG: only directors or own record (most sensitive)
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN p.document_rg 
      ELSE NULL 
    END AS document_rg,
    p.birth_date,
    CASE 
      -- Address: only directors or own record (sensitive)
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN p.address 
      ELSE NULL 
    END AS address,
    p.is_active,
    p.hire_date,
    p.department,
    CASE 
      -- Salary: only directors or own record (highly sensitive)
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN p.salary 
      ELSE NULL 
    END AS salary,
    p.permissions,
    e.employee_code,
    CASE 
      -- Emergency contact: only directors or own record (sensitive)
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN e.emergency_contact 
      ELSE NULL 
    END AS emergency_contact,
    CASE 
      -- Emergency phone: only directors or own record (sensitive)
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN e.emergency_phone 
      ELSE NULL 
    END AS emergency_phone,
    e.professional_license,
    e.specialization,
    e.work_schedule,
    e.notes AS employee_notes,
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN employees e ON p.id = e.profile_id
  WHERE p.employee_role IS NOT NULL
    AND (
      -- User can access their own record
      auth.uid() = p.user_id 
      -- Directors can access all records (but sensitive fields are still conditionally hidden above)
      OR user_has_role(ARRAY['director'::employee_role])
      -- Coordinators can access basic employee info (sensitive fields nulled above)
      OR user_has_role(ARRAY['coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role])
    );
$$;

-- Add missing INSERT policy for employees table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employees' 
    AND policyname = 'Only directors can create employee records'
  ) THEN
    EXECUTE 'CREATE POLICY "Only directors can create employee records" ON public.employees FOR INSERT WITH CHECK (user_has_role(ARRAY[''director''::employee_role]))';
  END IF;
END $$;

-- Log this critical security fix
SELECT public.log_sensitive_access(
  'employee_details',
  NULL::uuid,
  'critical_security_fix_view_replaced',
  jsonb_build_object(
    'description', 'CRITICAL: Replaced insecure employee_details view with secure function implementing field-level access control',
    'sensitive_fields_protected', ARRAY['document_cpf', 'document_rg', 'phone', 'address', 'salary', 'emergency_contact', 'emergency_phone'],
    'old_access_model', 'unprotected_view_with_full_data_exposure',
    'new_access_model', 'secure_function_with_role_based_field_level_security',
    'security_level', 'critical',
    'action_taken', 'view_dropped_and_replaced_with_secure_function'
  )
);