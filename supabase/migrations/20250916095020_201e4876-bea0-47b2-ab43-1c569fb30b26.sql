-- Fix critical security issue: Enable RLS on employee_details table and create proper access policies

-- Enable Row Level Security on employee_details table
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and update their own employee details only
CREATE POLICY "Users can view their own employee details" 
ON public.employee_details 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own employee details" 
ON public.employee_details 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Directors can manage all employee details (full access)
CREATE POLICY "Directors can manage all employee details" 
ON public.employee_details 
FOR ALL 
USING (user_has_role(ARRAY['director'::employee_role]));

-- Policy: Coordinators can view employee details (read-only access)
CREATE POLICY "Coordinators can view employee details" 
ON public.employee_details 
FOR SELECT 
USING (user_has_role(ARRAY['coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role]));

-- Log this security fix in audit logs
SELECT public.log_sensitive_access(
  'employee_details',
  NULL::uuid,
  'security_fix_rls_enabled',
  jsonb_build_object(
    'description', 'Critical security fix: Enabled RLS on employee_details table',
    'policies_created', ARRAY['Users can view their own employee details', 'Users can update their own employee details', 'Directors can manage all employee details', 'Coordinators can view employee details'],
    'security_level', 'critical',
    'issue_type', 'data_exposure_prevention'
  )
);