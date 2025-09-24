const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function runBillsMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Check if bills table already exists
    console.log('🔍 Checking if bills table exists...');
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'bills'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('⚠️  Bills table already exists, skipping creation');
      return;
    }

    // Read and execute the SQL script
    console.log('📖 Reading bills table SQL script...');
    const sql = fs.readFileSync('./create_bills_table.sql', 'utf8');

    console.log('🚀 Creating bills table and related functions...');
    await client.query(sql);

    // Verify the table was created
    const verifyResult = await client.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bills'
      ORDER BY ordinal_position
    `);

    console.log('✅ Bills table created successfully!');
    console.log(`📊 Table has ${verifyResult.rows.length} columns:`);
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check if RLS policies were created
    const policyCheck = await client.query(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual
      FROM pg_policies
      WHERE tablename = 'bills'
    `);

    console.log(`🛡️  Created ${policyCheck.rows.length} RLS policies for bills table`);
    policyCheck.rows.forEach(policy => {
      console.log(`   - ${policy.policyname} (${policy.cmd})`);
    });

    // Check if functions were created
    const functionCheck = await client.query(`
      SELECT proname, pronargs
      FROM pg_proc
      WHERE proname IN ('get_upcoming_bills', 'mark_bill_paid', 'update_bills_updated_at')
    `);

    console.log(`⚙️  Created ${functionCheck.rows.length} helper functions`);
    functionCheck.rows.forEach(func => {
      console.log(`   - ${func.proname}() with ${func.pronargs} parameters`);
    });

  } catch (error) {
    console.error('❌ Error during bills table migration:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runBillsMigration()
  .then(() => {
    console.log('🎉 Bills table migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  });