-- Add service_type column to client_notes table
ALTER TABLE client_notes 
ADD COLUMN service_type TEXT DEFAULT 'private';

-- Update existing records to have default value
UPDATE client_notes SET service_type = 'private' WHERE service_type IS NULL;

-- Create index for queries
CREATE INDEX idx_client_notes_service_type ON client_notes(service_type);