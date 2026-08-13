CREATE OR REPLACE FUNCTION public.can_manage_stock()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND is_active = true
      AND employee_role = ANY (ARRAY['director','coordinator_madre','coordinator_floresta','coordinator_atendimento_floresta','financeiro','estoquista']::employee_role[])
  )
$$;

DROP POLICY IF EXISTS "Manage stock policy" ON public.stock_items;
DROP POLICY IF EXISTS "View stock policy" ON public.stock_items;

CREATE POLICY "Stock managers can manage items"
ON public.stock_items FOR ALL TO authenticated
USING (public.can_manage_stock())
WITH CHECK (public.can_manage_stock());

DROP POLICY IF EXISTS "Stock managers can update movements" ON public.stock_movements;
CREATE POLICY "Stock managers can update movements"
ON public.stock_movements FOR UPDATE TO authenticated
USING (public.can_manage_stock())
WITH CHECK (public.can_manage_stock());

DROP POLICY IF EXISTS "Stock managers can delete movements" ON public.stock_movements;
CREATE POLICY "Stock managers can delete movements"
ON public.stock_movements FOR DELETE TO authenticated
USING (public.can_manage_stock());