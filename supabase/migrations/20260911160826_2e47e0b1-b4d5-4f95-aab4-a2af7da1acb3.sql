DROP INDEX IF EXISTS public.attendance_reports_one_per_schedule_idx;
CREATE UNIQUE INDEX attendance_reports_one_per_schedule_idx
ON public.attendance_reports (schedule_id);

DROP INDEX IF EXISTS public.medical_records_one_per_schedule_idx;
CREATE UNIQUE INDEX medical_records_one_per_schedule_idx
ON public.medical_records (schedule_id);