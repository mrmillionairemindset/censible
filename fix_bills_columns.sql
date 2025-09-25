-- Fix missing columns in bills table
-- Add is_recurring and is_active columns

-- Check if bills table exists and what columns it has
\d bills;

-- Add missing columns to bills table
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Update any existing bills to have sensible defaults
-- Bills with frequency other than 'one-time' should be recurring
UPDATE bills
SET is_recurring = true
WHERE frequency IS NOT NULL AND frequency != 'one-time';

-- All existing bills should be active by default
UPDATE bills
SET is_active = true;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bills'
AND column_name IN ('is_recurring', 'is_active')
ORDER BY column_name;

-- Show sample data to verify
SELECT id, name, frequency, is_recurring, is_active
FROM bills
LIMIT 5;