const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Expected: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database connection and income sources...');
  console.log('======================================================');

  try {
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ No authenticated user - you need to be logged in to the app');
      console.log('   Please log in to your app first, then run this script');
      return;
    }

    console.log('✅ Authenticated user found:', user.email);

    // Check income_sources table
    const { data: incomeData, error: incomeError, count } = await supabase
      .from('income_sources')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (incomeError) {
      console.error('❌ Error querying income_sources:', incomeError);
      return;
    }

    console.log(`📊 Found ${count} income source(s) in database for user ${user.id}`);

    if (incomeData && incomeData.length > 0) {
      console.log('💰 Income sources:');
      incomeData.forEach((income, index) => {
        console.log(`   ${index + 1}. ${income.name || income.source}: $${income.amount} ${income.frequency} (Active: ${income.is_active})`);
        console.log(`      ID: ${income.id}`);
        console.log(`      Created: ${income.created_at}`);
      });
    } else {
      console.log('   No income sources found in database');
    }

    // Check if there are any income sources for any user (debugging)
    const { data: allIncome, error: allError, count: totalCount } = await supabase
      .from('income_sources')
      .select('user_id', { count: 'exact' })
      .limit(10);

    if (!allError) {
      console.log(`📈 Total income sources in database (all users): ${totalCount}`);
      if (allIncome && allIncome.length > 0) {
        const userIds = [...new Set(allIncome.map(i => i.user_id))];
        console.log(`   Data exists for ${userIds.length} different user(s)`);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkDatabase().then(() => {
  process.exit(0);
});