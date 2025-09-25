-- Extend transactions table with additional fields for TransactionsPage UI
-- This adds the missing fields that the frontend expects

DO $$
BEGIN
  -- Add payment_method field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'payment_method') THEN
    ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(100);
  END IF;

  -- Add location field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'location') THEN
    ALTER TABLE transactions ADD COLUMN location VARCHAR(255);
  END IF;

  -- Add receipt_url field for receipt storage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'receipt_url') THEN
    ALTER TABLE transactions ADD COLUMN receipt_url VARCHAR(500);
  END IF;

  -- Add time field separate from transaction_date for more granular tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'transaction_time') THEN
    ALTER TABLE transactions ADD COLUMN transaction_time TIME DEFAULT NOW()::TIME;
  END IF;

  RAISE NOTICE 'Extended transactions table with additional UI fields';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS transactions_payment_method_idx ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS transactions_location_idx ON transactions(location);