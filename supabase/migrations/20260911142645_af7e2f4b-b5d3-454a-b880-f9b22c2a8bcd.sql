CREATE UNIQUE INDEX IF NOT EXISTS medical_records_one_per_schedule_idx
ON public.medical_records (schedule_id)
WHERE schedule_id IS NOT NULL;