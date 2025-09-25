-- Add missing columns to transactions table
-- Fix for PGRST204 error: Could not find the 'location' column

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS merchant TEXT;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
AND column_name IN ('location', 'merchant', 'payment_method', 'receipt_url')
ORDER BY column_name;