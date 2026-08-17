ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS clinic_unit text NOT NULL DEFAULT 'todas';
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS clinic_unit text;

CREATE INDEX IF NOT EXISTS idx_stock_items_clinic_unit ON public.stock_items(clinic_unit);

CREATE OR REPLACE FUNCTION public.can_view_stock()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_stock()
     OR EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.user_id = auth.uid()
         AND p.is_active = true
         AND p.employee_role IN ('nutritionist','receptionist')
     );
$$;

DROP POLICY IF EXISTS "Stock viewers can read items" ON public.stock_items;
CREATE POLICY "Stock viewers can read items"
ON public.stock_items FOR SELECT TO authenticated
USING (public.can_view_stock());

DROP POLICY IF EXISTS "Stock viewers can read movements" ON public.stock_movements;
CREATE POLICY "Stock viewers can read movements"
ON public.stock_movements FOR SELECT TO authenticated
USING (public.can_view_stock());