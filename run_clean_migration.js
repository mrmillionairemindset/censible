const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runCleanMigration() {
  console.log('🔧 RUNNING CLEAN BILLING PERIOD MIGRATION\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Add billing period fields
    await client.query(`
      ALTER TABLE households
      ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
    `);

    await client.query(`
      ALTER TABLE households
      ADD COLUMN IF NOT EXISTS access_ends_at TIMESTAMP WITH TIME ZONE;
    `);

    console.log('✅ Added billing period fields');

    // Add comments
    await client.query(`
      COMMENT ON COLUMN households.cancel_at_period_end IS 'True if subscription is set to cancel at the end of current billing period';
    `);

    await client.query(`
      COMMENT ON COLUMN households.access_ends_at IS 'Final date when premium access expires (for cancelled subscriptions/trials)';
    `);

    console.log('✅ Added field documentation');

    // Update existing cancelled subscriptions
    const result1 = await client.query(`
      UPDATE households
      SET access_ends_at = subscription_current_period_end
      WHERE subscription_status = 'cancelled'
        AND subscription_current_period_end IS NOT NULL
        AND access_ends_at IS NULL
      RETURNING id;
    `);

    const result2 = await client.query(`
      UPDATE households
      SET access_ends_at = trial_ends_at
      WHERE subscription_status = 'cancelled'
        AND trial_ends_at IS NOT NULL
        AND subscription_current_period_end IS NULL
        AND access_ends_at IS NULL
      RETURNING id;
    `);

    console.log(`✅ Updated ${result1.rowCount} cancelled active subscriptions`);
    console.log(`✅ Updated ${result2.rowCount} cancelled trial subscriptions`);

    console.log('\n🎯 BILLING PERIOD MIGRATION COMPLETE!');
    console.log('Database now tracks cancellation end dates properly.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runCleanMigration();