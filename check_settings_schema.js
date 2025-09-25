const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function checkSettingsSchema() {
  console.log('🔍 Checking settings-related database schema...');
  console.log('======================================================');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');

    // Check all existing tables
    const allTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 All existing tables:');
    allTables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Check profiles table structure
    const profilesSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 profiles table structure:');
    if (profilesSchema.rows.length === 0) {
      console.log('❌ profiles table does not exist');
    } else {
      profilesSchema.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
      });
    }

    // Check for settings-related tables
    const settingsTables = [
      'user_preferences',
      'user_settings',
      'user_sessions',
      'notifications',
      'audit_logs',
      'user_security',
      'notification_settings'
    ];

    console.log('\n🔍 Checking for settings-related tables:');
    for (const tableName of settingsTables) {
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `, [tableName]);

      if (tableExists.rows[0].exists) {
        console.log(`  ✅ ${tableName} - exists`);

        // Get column structure if it exists
        const schema = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        schema.rows.forEach(row => {
          console.log(`    └─ ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
      } else {
        console.log(`  ❌ ${tableName} - does not exist`);
      }
    }

    // Check subscription/household related constraints
    console.log('\n🔍 Checking subscription-related fields:');

    // Check households subscription fields
    const householdsFields = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'households'
      AND column_name IN ('subscription_tier', 'max_members', 'max_savings_goals', 'data_retention_months')
      ORDER BY column_name
    `);

    console.log('  📊 Households subscription fields:');
    if (householdsFields.rows.length === 0) {
      console.log('    ❌ No subscription fields found in households table');
    } else {
      householdsFields.rows.forEach(row => {
        console.log(`    ✅ ${row.column_name}: ${row.data_type}`);
      });
    }

    // Check household_members permission fields
    const memberFields = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'household_members'
      AND column_name IN ('role', 'can_edit_budget', 'can_add_transactions', 'spending_limit', 'member_type')
      ORDER BY column_name
    `);

    console.log('  👥 Household member permission fields:');
    if (memberFields.rows.length === 0) {
      console.log('    ❌ No permission fields found in household_members table');
    } else {
      memberFields.rows.forEach(row => {
        console.log(`    ✅ ${row.column_name}: ${row.data_type}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Schema check complete');
  }
}

checkSettingsSchema();