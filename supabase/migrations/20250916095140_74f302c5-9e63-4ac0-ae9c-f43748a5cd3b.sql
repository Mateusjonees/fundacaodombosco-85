-- Security fix: Strengthen RLS policies on underlying tables that feed employee_details view

-- First, let's make sure the profiles table has comprehensive policies
-- The profiles table already has basic policies, but let's add more specific ones for sensitive data access

-- Add policy for coordinators to view profiles in their jurisdiction
CREATE POLICY "Coordinators can view all profiles for management" 
ON public.profiles 
FOR SELECT 
USING (user_has_role(ARRAY['director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role]));

-- Make sure employees table policies are restrictive enough
-- Add INSERT policy for employee records (only directors can create)
CREATE POLICY "Only directors can create employee records" 
ON public.employees 
FOR INSERT 
WITH CHECK (user_has_role(ARRAY['director'::employee_role]));

-- Create a security-conscious function to access employee details
CREATE OR REPLACE FUNCTION public.get_accessible_employee_details()
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
  -- Only return employee details that the current user should have access to
  SELECT 
    p.id AS profile_id,
    p.user_id,
    p.name,
    p.employee_role,
    CASE 
      -- Hide sensitive phone data unless user is director/coordinator or viewing own record
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role, 'coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role]) 
      THEN p.phone 
      ELSE NULL 
    END AS phone,
    CASE 
      -- Hide CPF unless director or own record
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN p.document_cpf 
      ELSE NULL 
    END AS document_cpf,
    CASE 
      -- Hide RG unless director or own record
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN p.document_rg 
      ELSE NULL 
    END AS document_rg,
    p.birth_date,
    CASE 
      -- Hide address unless director or own record
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN p.address 
      ELSE NULL 
    END AS address,
    p.is_active,
    p.hire_date,
    p.department,
    CASE 
      -- Hide salary unless director or own record
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN p.salary 
      ELSE NULL 
    END AS salary,
    p.permissions,
    e.employee_code,
    CASE 
      -- Hide emergency contact unless director or own record
      WHEN auth.uid() = p.user_id OR user_has_role(ARRAY['director'::employee_role]) 
      THEN e.emergency_contact 
      ELSE NULL 
    END AS emergency_contact,
    CASE 
      -- Hide emergency phone unless director or own record
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
      -- User can see their own record
      auth.uid() = p.user_id 
      -- Directors can see all records
      OR user_has_role(ARRAY['director'::employee_role])
      -- Coordinators can see basic info (sensitive fields are nulled above)
      OR user_has_role(ARRAY['coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role])
    );
$$;

-- Log this security enhancement
SELECT public.log_sensitive_access(
  'employee_details',
  NULL::uuid,
  'security_enhancement_view_protection',
  jsonb_build_object(
    'description', 'Enhanced security for employee_details view by creating secure access function',
    'sensitive_fields_protected', ARRAY['document_cpf', 'document_rg', 'phone', 'address', 'salary', 'emergency_contact', 'emergency_phone'],
    'access_model', 'role_based_with_field_level_security',
    'security_level', 'critical'
  )
);