-- Add optional display fields for prescription PDF
ALTER TABLE prescriptions 
ADD COLUMN show_print_date BOOLEAN DEFAULT false,
ADD COLUMN show_prescription_date BOOLEAN DEFAULT true;