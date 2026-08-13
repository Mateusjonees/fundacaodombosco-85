ALTER TYPE public.employee_role ADD VALUE IF NOT EXISTS 'estoquista';

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS withdrawn_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS withdrawn_by_name text,
  ADD COLUMN IF NOT EXISTS withdrawal_date date,
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS expected_return_date date,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_stock_movements_withdrawal_date ON public.stock_movements (withdrawal_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_withdrawn_by ON public.stock_movements (withdrawn_by_user_id);