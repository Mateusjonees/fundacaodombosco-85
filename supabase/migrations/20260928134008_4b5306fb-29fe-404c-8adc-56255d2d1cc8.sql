CREATE TABLE public.stock_user_access (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'manager')),
  allowed_units text[] NOT NULL DEFAULT ARRAY[]::text[],
  granted_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_user_access TO authenticated;
GRANT ALL ON public.stock_user_access TO service_role;

ALTER TABLE public.stock_user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock access"
ON public.stock_user_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Directors can view all stock access"
ON public.stock_user_access
FOR SELECT
TO authenticated
USING (public.is_director());

CREATE POLICY "Directors can create stock access"
ON public.stock_user_access
FOR INSERT
TO authenticated
WITH CHECK (public.is_director() AND granted_by = auth.uid());

CREATE POLICY "Directors can update stock access"
ON public.stock_user_access
FOR UPDATE
TO authenticated
USING (public.is_director())
WITH CHECK (public.is_director() AND granted_by = auth.uid());

CREATE POLICY "Directors can delete stock access"
ON public.stock_user_access
FOR DELETE
TO authenticated
USING (public.is_director());

CREATE TRIGGER update_stock_user_access_updated_at
BEFORE UPDATE ON public.stock_user_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_view_stock()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND (
        p.employee_role IN ('director', 'estoquista')
        OR EXISTS (
          SELECT 1
          FROM public.stock_user_access sua
          WHERE sua.user_id = auth.uid()
            AND sua.access_level IN ('viewer', 'manager')
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_stock()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND (
        p.employee_role IN ('director', 'estoquista')
        OR EXISTS (
          SELECT 1
          FROM public.stock_user_access sua
          WHERE sua.user_id = auth.uid()
            AND sua.access_level = 'manager'
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_stock_unit(target_unit text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND (
        p.employee_role IN ('director', 'estoquista')
        OR EXISTS (
          SELECT 1
          FROM public.stock_user_access sua
          WHERE sua.user_id = auth.uid()
            AND sua.access_level IN ('viewer', 'manager')
            AND (
              target_unit IS NULL
              OR target_unit = 'todas'
              OR 'todas' = ANY(sua.allowed_units)
              OR target_unit = ANY(sua.allowed_units)
            )
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_stock() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_stock() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_stock_unit(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "All staff can view stock items" ON public.stock_items;
DROP POLICY IF EXISTS "Stock viewers can read items" ON public.stock_items;
DROP POLICY IF EXISTS "Stock managers can manage items" ON public.stock_items;

CREATE POLICY "Authorized users can view stock items"
ON public.stock_items
FOR SELECT
TO authenticated
USING (public.can_view_stock() AND public.can_access_stock_unit(clinic_unit));

CREATE POLICY "Authorized managers can create stock items"
ON public.stock_items
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_stock() AND public.can_access_stock_unit(clinic_unit));

CREATE POLICY "Authorized managers can update stock items"
ON public.stock_items
FOR UPDATE
TO authenticated
USING (public.can_manage_stock() AND public.can_access_stock_unit(clinic_unit))
WITH CHECK (public.can_manage_stock() AND public.can_access_stock_unit(clinic_unit));

CREATE POLICY "Authorized managers can delete stock items"
ON public.stock_items
FOR DELETE
TO authenticated
USING (public.can_manage_stock() AND public.can_access_stock_unit(clinic_unit));

DROP POLICY IF EXISTS "All staff can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Stock viewers can read movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Stock managers can create movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Stock managers can update movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Stock managers can delete movements" ON public.stock_movements;

CREATE POLICY "Authorized users can view stock movements"
ON public.stock_movements
FOR SELECT
TO authenticated
USING (public.can_view_stock() AND public.can_access_stock_unit(clinic_unit));

CREATE POLICY "Authorized managers can create stock movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_stock() AND public.can_access_stock_unit(clinic_unit));

CREATE POLICY "Authorized managers can update stock movements"
ON public.stock_movements
FOR UPDATE
TO authenticated
USING (public.can_manage_stock() AND public.can_access_stock_unit(clinic_unit))
WITH CHECK (public.can_manage_stock() AND public.can_access_stock_unit(clinic_unit));

CREATE POLICY "Authorized managers can delete stock movements"
ON public.stock_movements
FOR DELETE
TO authenticated
USING (public.can_manage_stock() AND public.can_access_stock_unit(clinic_unit));
