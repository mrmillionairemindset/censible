const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function checkSchema() {
  console.log('🔍 Checking current database schema...');
  console.log('======================================================');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');

    // Check households table structure
    const householdsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'households'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 households table structure:');
    if (householdsSchema.rows.length === 0) {
      console.log('❌ households table does not exist');
    } else {
      householdsSchema.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Check income_sources table structure
    const incomeSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'income_sources'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 income_sources table structure:');
    incomeSchema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check household_members table
    const membersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'household_members'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 household_members table structure:');
    if (membersSchema.rows.length === 0) {
      console.log('❌ household_members table does not exist');
    } else {
      membersSchema.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    console.log('\n✅ Schema check complete');

  } catch (error) {
    console.error('💥 Schema check failed:', error);
  } finally {
    await client.end();
  }
}

checkSchema();