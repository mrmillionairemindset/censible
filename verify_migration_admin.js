const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role for admin verification
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function verifyMigrationAdmin() {
  console.log('🔍 Admin verification of household migration...');
  console.log('======================================================');

  try {
    // Check 1: Households table structure
    const { data: households, error: householdError } = await supabase
      .from('households')
      .select('id, name, household_name, subscription_tier, max_members, max_savings_goals')
      .limit(5);

    if (householdError) {
      console.log('❌ households table issue:', householdError.message);
    } else {
      console.log(`✅ Found ${households.length} household(s)`);
      if (households.length > 0) {
        console.log('   Sample household:', households[0]);
      } else {
        console.log('   No households exist yet - this is normal for new setup');
      }
    }

    // Check 2: Income sources have household_id column
    const { data: income, error: incomeError } = await supabase
      .from('income_sources')
      .select('id, household_id, user_id, is_shared')
      .limit(3);

    if (incomeError) {
      console.log('❌ income_sources check failed:', incomeError.message);
    } else {
      console.log(`✅ Found ${income.length} income source(s)`);
      const withHousehold = income.filter(i => i.household_id);
      console.log(`   ${withHousehold.length} have household_id populated`);
      if (income.length > 0) {
        console.log('   Sample:', income[0]);
      }
    }

    // Check 3: Household members table
    const { data: members, error: memberError } = await supabase
      .from('household_members')
      .select('id, household_id, user_id, role, display_name, spending_limit')
      .limit(3);

    if (memberError) {
      console.log('❌ household_members table issue:', memberError.message);
    } else {
      console.log(`✅ Found ${members.length} household member(s)`);
      if (members.length > 0) {
        console.log('   Sample member:', members[0]);
      }
    }

    // Check 4: Feature gate functions using direct SQL
    const { data: functionTest, error: funcError } = await supabase.rpc('sql', {
      query: `
        SELECT
          has_premium_features('00000000-0000-0000-0000-000000000000') as premium_test,
          can_use_ocr('00000000-0000-0000-0000-000000000000') as ocr_test
      `
    }).single();

    if (funcError) {
      console.log('⚠️  Feature functions test (expected to fail with dummy ID):', funcError.message);
    } else {
      console.log('✅ Feature gate functions working:', functionTest);
    }

    // Check 5: User count
    const { count: userCount, error: userError } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    if (!userError) {
      console.log(`📊 Total users in system: ${userCount}`);
    }

    console.log('\n🎯 Migration Status Summary:');
    console.log('- Households table with subscription columns:', householdError ? '❌' : '✅');
    console.log('- Income sources with household linking:', incomeError ? '❌' : '✅');
    console.log('- Household members table:', memberError ? '❌' : '✅');
    console.log('- Feature gate functions:', funcError && !funcError.message.includes('dummy') ? '⚠️' : '✅');

    console.log('\n💡 To test with real user data:');
    console.log('1. Log into your web app');
    console.log('2. Run: node verify_migration.js');

  } catch (error) {
    console.error('💥 Admin verification failed:', error);
  }
}

verifyMigrationAdmin().then(() => {
  console.log('\n🎉 Admin verification complete');
  process.exit(0);
});