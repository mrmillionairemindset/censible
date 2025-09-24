const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeRedundantTable() {
  console.log('🧹 Starting cleanup: Checking for redundant family_budget_income table...');

  try {
    // Try to query the table directly to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('family_budget_income')
      .select('*')
      .limit(1);

    if (testError && testError.code === 'PGRST116') {
      console.log('✅ family_budget_income table does not exist. No cleanup needed.');
      console.log('   This means the table was already removed or never existed.');
    } else if (testError) {
      console.log('⚠️  family_budget_income table might exist but we cannot access it.');
      console.log('   Error:', testError.message);
      console.log('   This is expected if the table exists but has no RLS policies allowing access.');
    } else {
      console.log('📋 family_budget_income table exists and is accessible.');
      if (testData && testData.length > 0) {
        console.log(`   Found ${testData.length} record(s) in the table.`);
        console.log('   ⚠️  Manual cleanup required through Supabase dashboard.');
      }
    }

    console.log('✨ Table check completed!');

    // Verify income_sources table
    console.log('🔍 Verifying income_sources table structure...');
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'income_sources')
      .order('ordinal_position');

    if (colError) {
      console.error('Error checking income_sources:', colError);
    } else {
      console.log('📊 income_sources table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('💥 Error during cleanup:', error);
  }
}

removeRedundantTable().then(() => {
  console.log('🎯 Script completed');
  process.exit(0);
});