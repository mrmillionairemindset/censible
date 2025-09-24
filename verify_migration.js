const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying household migration status...');
  console.log('======================================================');

  try {
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ No authenticated user - please log in to your app first');
      return;
    }

    console.log('✅ Authenticated user found:', user.email);

    // Check 1: Do we have households?
    const { data: households, error: householdError } = await supabase
      .from('households')
      .select('id, name, subscription_tier, max_members')
      .limit(5);

    if (householdError) {
      console.log('❌ households table issue:', householdError.message);
    } else {
      console.log(`✅ Found ${households.length} household(s)`);
      if (households.length > 0) {
        console.log('   Sample:', households[0]);
      }
    }

    // Check 2: Are we a household member?
    const { data: membership, error: memberError } = await supabase
      .from('household_members')
      .select('household_id, role')
      .eq('user_id', user.id);

    if (memberError) {
      console.log('❌ household_members table issue:', memberError.message);
    } else {
      console.log(`✅ User is member of ${membership.length} household(s)`);
      if (membership.length > 0) {
        console.log('   Role:', membership[0].role);
      }
    }

    // Check 3: Do income sources have household_id populated?
    const { data: income, error: incomeError } = await supabase
      .from('income_sources')
      .select('id, household_id, user_id')
      .eq('user_id', user.id);

    if (incomeError) {
      console.log('❌ income_sources check failed:', incomeError.message);
    } else {
      const withHousehold = income.filter(i => i.household_id);
      console.log(`✅ Found ${income.length} income source(s), ${withHousehold.length} have household_id`);
    }

    // Check 4: Feature gate functions exist?
    const { data: functions, error: funcError } = await supabase
      .rpc('has_premium_features', { p_household_id: membership[0]?.household_id || '00000000-0000-0000-0000-000000000000' });

    if (funcError) {
      console.log('⚠️  Premium feature functions not yet available:', funcError.message);
    } else {
      console.log('✅ Feature gate functions working:', functions);
    }

    console.log('\n🎯 Migration Status Summary:');
    console.log('- Households table:', householdError ? '❌' : '✅');
    console.log('- User household membership:', memberError ? '❌' : membership.length > 0 ? '✅' : '⚠️');
    console.log('- Income household linking:', incomeError ? '❌' : withHousehold.length > 0 ? '✅' : '⚠️');
    console.log('- Feature gate functions:', funcError ? '⚠️' : '✅');

  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

verifyMigration().then(() => {
  console.log('\n🎉 Verification complete');
  process.exit(0);
});