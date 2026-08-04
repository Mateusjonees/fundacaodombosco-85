ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_license text,
  ADD COLUMN IF NOT EXISTS professional_rqe text;