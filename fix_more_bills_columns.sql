-- Fix additional missing columns in bills table
-- Add reminder_enabled, start_date, and end_date columns

-- Check current bills table structure
\d bills;

-- Add missing columns to bills table
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bills'
AND column_name IN ('reminder_enabled', 'start_date', 'end_date')
ORDER BY column_name;

-- Show all columns to verify schema matches interface
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'bills'
ORDER BY column_name;