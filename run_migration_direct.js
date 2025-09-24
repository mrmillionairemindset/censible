const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Need REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('📁 Running household migration script via individual queries...');
  console.log('======================================================');

  try {
    const migration = fs.readFileSync('household_migration.sql', 'utf8');

    console.log('🔧 Step 1: Create default households...');
    // Step 1: Create households for users
    const { data: createHouseholds, error: householdError } = await supabase
      .from('households')
      .select('id')
      .limit(1);

    if (householdError) {
      console.log('⚠️  Households table may not exist yet, that\'s OK');
    }

    console.log('🔧 Step 2: Check current database structure...');

    // Check what tables exist
    const { data: tables, error: tableError } = await supabase
      .rpc('exec', {
        query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      });

    if (tableError) {
      console.log('⚠️  Cannot check tables via RPC, using direct approach...');

      // Try a direct table check
      const { data: incomeCheck, error: incomeError } = await supabase
        .from('income_sources')
        .select('id, household_id')
        .limit(1);

      if (!incomeError) {
        console.log('✅ income_sources table exists');
        if (incomeCheck && incomeCheck[0] && incomeCheck[0].household_id !== undefined) {
          console.log('✅ household_id column already exists in income_sources');
        } else {
          console.log('⚠️  household_id column missing from income_sources - manual migration needed');
        }
      }

      const { data: householdCheck, error: householdError } = await supabase
        .from('households')
        .select('id, subscription_tier')
        .limit(1);

      if (!householdError) {
        console.log('✅ households table exists');
        if (householdCheck && householdCheck[0] && householdCheck[0].subscription_tier !== undefined) {
          console.log('✅ subscription_tier column already exists in households');
        }
      }

    } else if (tables) {
      console.log('📊 Available tables:', tables.map(t => t.table_name).join(', '));
    }

    console.log('\n🎯 Manual migration steps needed:');
    console.log('1. Use Supabase SQL Editor to run household_migration.sql');
    console.log('2. Or use a PostgreSQL client with your DATABASE_URL');

    console.log('\n✅ Migration check complete - manual execution required');

  } catch (error) {
    console.error('💥 Migration check failed:', error);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('🎉 Migration check process complete');
  process.exit(0);
});