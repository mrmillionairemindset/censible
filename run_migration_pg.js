const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function runMigration() {
  console.log('📁 Running household migration via direct PostgreSQL connection...');
  console.log('======================================================');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('📄 Reading targeted migration script...');
    const migration = fs.readFileSync('household_migration_targeted.sql', 'utf8');

    console.log('🚀 Executing migration...');
    const result = await client.query(migration);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Query result:', result);

    console.log('\n🔍 Running verification checks...');

    // Check households table
    try {
      const householdCheck = await client.query('SELECT COUNT(*) as count FROM households');
      console.log('✅ Households table exists, count:', householdCheck.rows[0].count);
    } catch (err) {
      console.log('⚠️  Households table issue:', err.message);
    }

    // Check feature functions
    try {
      const funcCheck = await client.query("SELECT proname FROM pg_proc WHERE proname LIKE '%premium%'");
      console.log('✅ Feature functions:', funcCheck.rows.map(r => r.proname));
    } catch (err) {
      console.log('⚠️  Function check failed:', err.message);
    }

    console.log('\n🎉 Migration process complete!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();