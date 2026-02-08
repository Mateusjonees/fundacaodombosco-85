
-- ============================================================
-- FIX 1: PROFILES - Remove overly broad SELECT policy
-- Keep: own profile, coordinators, directors policies
-- Replace broad messaging policy with one that requires authentication
-- ============================================================

-- Drop the overly broad policy that exposes all active profiles
DROP POLICY IF EXISTS "Authenticated users can view other profiles for messaging" ON public.profiles;

-- Create a restricted view for non-sensitive profile data (for messaging, scheduling lookups)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, user_id, name, employee_role, phone, email, unit, units, is_active, avatar_url, created_at
  FROM public.profiles;
-- Excludes: document_cpf, document_rg, birth_date, address, salary, hire_date, department, permissions, must_change_password

-- Add a policy so authenticated users can still SELECT from profiles base table
-- but only their own row, coordinators, or directors (already covered by existing policies)
-- No new broad policy needed - existing policies cover own profile + coordinators + directors

-- ============================================================
-- FIX 2: AUTOMATIC_FINANCIAL_RECORDS - Restrict to directors/managers only
-- ============================================================

-- Drop the overly permissive policies (using public role!)
DROP POLICY IF EXISTS "Staff can view automatic financial records" ON public.automatic_financial_records;
DROP POLICY IF EXISTS "View automatic financial records" ON public.automatic_financial_records;

-- Create restricted SELECT policy for directors and coordinators only
CREATE POLICY "Directors and managers can view financial records"
ON public.automatic_financial_records
FOR SELECT
TO authenticated
USING (
  director_has_god_mode() 
  OR is_manager()
  OR created_by = auth.uid()
);

-- ============================================================
-- FIX 3: EMPLOYEE_TIMESHEET - Restrict to own records + managers
-- ============================================================

-- Drop the overly broad ALL policy (uses public role!)
DROP POLICY IF EXISTS "Authenticated users can manage timesheet" ON public.employee_timesheet;

-- SELECT: own records + managers
CREATE POLICY "Users can view own timesheet"
ON public.employee_timesheet
FOR SELECT
TO authenticated
USING (
  employee_id = auth.uid()
  OR director_has_god_mode()
  OR is_manager()
);

-- INSERT: own records only
CREATE POLICY "Users can insert own timesheet"
ON public.employee_timesheet
FOR INSERT
TO authenticated
WITH CHECK (
  employee_id = auth.uid()
);

-- UPDATE: own records + managers (for approval)
CREATE POLICY "Users can update own timesheet or managers approve"
ON public.employee_timesheet
FOR UPDATE
TO authenticated
USING (
  employee_id = auth.uid()
  OR director_has_god_mode()
  OR is_manager()
);

-- DELETE: directors only
CREATE POLICY "Directors can delete timesheet records"
ON public.employee_timesheet
FOR DELETE
TO authenticated
USING (
  director_has_god_mode()
);

-- ============================================================
-- FIX 4: SCHEDULES - Drop duplicate public-role policies
-- The authenticated-role policies already provide proper access
-- ============================================================

-- Drop public-role policies (keep authenticated-role ones)
DROP POLICY IF EXISTS "View schedules" ON public.schedules;
DROP POLICY IF EXISTS "Create schedules" ON public.schedules;
DROP POLICY IF EXISTS "Update schedules" ON public.schedules;
DROP POLICY IF EXISTS "Delete schedules" ON public.schedules;
DROP POLICY IF EXISTS "Receptionists can view schedules for patient arrival" ON public.schedules;
DROP POLICY IF EXISTS "Receptionists can update patient arrival status" ON public.schedules;

-- Re-create receptionist policies with authenticated role
CREATE POLICY "Receptionists can view schedules"
ON public.schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role = 'receptionist'::employee_role
    AND profiles.is_active = true
  )
);

CREATE POLICY "Receptionists can update arrival status"
ON public.schedules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.employee_role = 'receptionist'::employee_role
    AND profiles.is_active = true
  )
);

-- ============================================================
-- FIX 5: INTERNAL_MESSAGES - Already properly secured
-- Policies already restrict to sender/recipient/channel members
-- with authenticated role. No changes needed.
-- ============================================================
