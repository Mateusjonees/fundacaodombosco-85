ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS alert_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS alert_quantity integer;