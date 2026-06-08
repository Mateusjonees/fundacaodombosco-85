
-- =========================================================================
-- Security hardening: storage buckets + profiles SELECT scope
-- =========================================================================

-- ---------- LAUDOS bucket ----------
DROP POLICY IF EXISTS "Funcionários ativos podem visualizar laudos" ON storage.objects;
DROP POLICY IF EXISTS "Funcionários ativos podem fazer upload de laudos" ON storage.objects;
DROP POLICY IF EXISTS "Funcionários ativos podem atualizar laudos" ON storage.objects;

CREATE POLICY "Laudos: managers or assigned staff can view"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'laudos'
  AND (
    is_manager_role()
    OR owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.client_laudos cl
      JOIN public.client_assignments ca ON ca.client_id = cl.client_id
      WHERE cl.file_path = storage.objects.name
        AND ca.employee_id = auth.uid()
        AND ca.is_active = true
    )
  )
);

CREATE POLICY "Laudos: managers or assigned staff can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'laudos'
  AND (
    is_manager_role()
    OR EXISTS (
      SELECT 1 FROM public.client_assignments ca
      WHERE ca.employee_id = auth.uid() AND ca.is_active = true
    )
  )
);

CREATE POLICY "Laudos: managers or owner can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'laudos'
  AND (is_manager_role() OR owner = auth.uid())
);

-- ---------- PRESCRIPTIONS bucket ----------
DROP POLICY IF EXISTS "Funcionários ativos podem visualizar receitas" ON storage.objects;
DROP POLICY IF EXISTS "Funcionários ativos podem fazer upload de receitas" ON storage.objects;
DROP POLICY IF EXISTS "Funcionários ativos podem atualizar receitas" ON storage.objects;

CREATE POLICY "Prescriptions: managers or assigned staff can view"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions'
  AND (
    is_manager_role()
    OR owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.prescriptions p
      JOIN public.client_assignments ca ON ca.client_id = p.client_id
      WHERE ca.employee_id = auth.uid()
        AND ca.is_active = true
        AND storage.objects.name LIKE '%' || p.id::text || '%'
    )
  )
);

CREATE POLICY "Prescriptions: managers or assigned staff can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions'
  AND (
    is_manager_role()
    OR EXISTS (
      SELECT 1 FROM public.client_assignments ca
      WHERE ca.employee_id = auth.uid() AND ca.is_active = true
    )
  )
);

CREATE POLICY "Prescriptions: managers or owner can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prescriptions'
  AND (is_manager_role() OR owner = auth.uid())
);

-- ---------- USER-DOCUMENTS bucket: fix permissive INSERT ----------
DROP POLICY IF EXISTS "Staff can upload documents for assigned clients" ON storage.objects;

CREATE POLICY "Staff can upload docs for assigned clients (scoped)"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents'
  AND (
    director_has_god_mode()
    OR user_has_any_role(ARRAY['coordinator_madre'::employee_role, 'coordinator_floresta'::employee_role, 'coordinator_atendimento_floresta'::employee_role])
    OR (auth.uid())::text = (storage.foldername(name))[1]
  )
);

-- ---------- ATTENDANCE-DOCUMENTS bucket: add missing SELECT ----------
CREATE POLICY "Users view own attendance documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attendance-documents'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR is_manager_role()
  )
);

-- ---------- PROFILES: scope coordinator SELECT to same unit ----------
DROP POLICY IF EXISTS "Coordinators can view profiles" ON public.profiles;

CREATE POLICY "Coordinators view profiles in their unit"
ON public.profiles FOR SELECT
USING (
  is_coordinator()
  AND (
    -- self always allowed via other policy, but harmless
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.user_id = auth.uid()
        AND me.is_active = true
        AND (
          -- same single unit
          (me.unit IS NOT NULL AND profiles.unit = me.unit)
          -- overlap on multi-unit arrays
          OR (me.units IS NOT NULL AND profiles.unit = ANY(me.units))
          OR (me.units IS NOT NULL AND profiles.units IS NOT NULL AND me.units && profiles.units)
        )
    )
  )
);
