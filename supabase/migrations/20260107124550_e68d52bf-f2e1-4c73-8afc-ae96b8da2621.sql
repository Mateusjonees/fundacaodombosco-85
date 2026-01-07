-- Add service_type column to prescriptions table
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'private';

-- Create client_laudos table for patient reports
CREATE TABLE IF NOT EXISTS client_laudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  laudo_date DATE NOT NULL DEFAULT CURRENT_DATE,
  laudo_type TEXT DEFAULT 'neuropsicologico',
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on client_laudos
ALTER TABLE client_laudos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_laudos
CREATE POLICY "Authenticated users can view laudos"
ON client_laudos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create laudos"
ON client_laudos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update laudos"
ON client_laudos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete laudos"
ON client_laudos FOR DELETE
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_laudos_client_id ON client_laudos(client_id);
CREATE INDEX IF NOT EXISTS idx_client_laudos_employee_id ON client_laudos(employee_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_service_type ON prescriptions(service_type);