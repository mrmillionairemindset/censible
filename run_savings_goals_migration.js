const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function runSavingsGoalsMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Check if savings_goals table already exists
    console.log('🔍 Checking if savings_goals table exists...');
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'savings_goals'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('⚠️  Savings goals table already exists, skipping creation');
      return;
    }

    // Read and execute the SQL script
    console.log('📖 Reading savings goals table SQL script...');
    const sql = fs.readFileSync('./create_savings_goals_table.sql', 'utf8');

    console.log('🚀 Creating savings_goals table and related functions...');
    await client.query(sql);

    // Verify the table was created
    const verifyResult = await client.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'savings_goals'
      ORDER BY ordinal_position
    `);

    console.log('✅ Savings goals table created successfully!');
    console.log(`📊 Table has ${verifyResult.rows.length} columns:`);
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check if RLS policies were created
    const policyCheck = await client.query(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual
      FROM pg_policies
      WHERE tablename = 'savings_goals'
    `);

    console.log(`🛡️  Created ${policyCheck.rows.length} RLS policies for savings_goals table`);
    policyCheck.rows.forEach(policy => {
      console.log(`   - ${policy.policyname} (${policy.cmd})`);
    });

    // Check if functions were created
    const functionCheck = await client.query(`
      SELECT proname, pronargs
      FROM pg_proc
      WHERE proname IN ('get_savings_progress', 'add_savings_contribution', 'get_priority_savings_goals', 'update_savings_goals_updated_at')
    `);

    console.log(`⚙️  Created ${functionCheck.rows.length} helper functions`);
    functionCheck.rows.forEach(func => {
      console.log(`   - ${func.proname}() with ${func.pronargs} parameters`);
    });

  } catch (error) {
    console.error('❌ Error during savings goals table migration:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runSavingsGoalsMigration()
  .then(() => {
    console.log('🎉 Savings goals table migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  });