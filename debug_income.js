const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugIncomeLoading() {
  console.log('🔍 Debug: Income Loading Process');
  console.log('==============================');

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }

    if (!user) {
      console.log('❌ No authenticated user found');
      console.log('   Make sure you are logged in to the app');
      return;
    }

    console.log('✅ User authenticated:', user.id);
    console.log('   Email:', user.email);

    // Check if income_sources table exists and is accessible
    console.log('\n📋 Checking income_sources table...');
    const { data: testData, error: testError } = await supabase
      .from('income_sources')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error accessing income_sources:', testError);
      return;
    }

    console.log('✅ income_sources table is accessible');

    // Try to fetch user's income sources
    console.log('\n💰 Fetching income sources for user...');
    const { data: incomeData, error: incomeError } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (incomeError) {
      console.error('❌ Error fetching income sources:', incomeError);
      return;
    }

    console.log(`✅ Found ${incomeData?.length || 0} income sources`);
    if (incomeData && incomeData.length > 0) {
      console.log('   Income sources:');
      incomeData.forEach((income, index) => {
        console.log(`   ${index + 1}. ${income.name}: $${income.amount} ${income.frequency}`);
      });
    } else {
      console.log('   No income sources found in database');
    }

    // Check localStorage for any existing data
    console.log('\n🗄️  Checking localStorage...');
    const localStorageIncome = localStorage.getItem('centsible_income_sources');
    if (localStorageIncome) {
      const parsedIncome = JSON.parse(localStorageIncome);
      console.log(`   Found ${parsedIncome.length} income sources in localStorage`);
      console.log('   ⚠️  This data should be migrated to database');
    } else {
      console.log('   No income data in localStorage');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run in browser environment
if (typeof window !== 'undefined') {
  debugIncomeLoading();
} else {
  console.log('This script should be run in the browser console');
  console.log('Copy and paste the debugIncomeLoading function into the browser console and call it');
}