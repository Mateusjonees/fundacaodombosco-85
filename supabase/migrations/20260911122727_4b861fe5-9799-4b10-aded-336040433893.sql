ALTER TABLE public.medical_records
ADD COLUMN IF NOT EXISTS schedule_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_reports_one_per_schedule_idx
ON public.attendance_reports (schedule_id)
WHERE schedule_id IS NOT NULL;