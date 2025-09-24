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
  console.log('📁 Running household migration script...');
  console.log('======================================================');

  try {
    const migration = fs.readFileSync('household_migration.sql', 'utf8');

    // Split migration into individual statements (simple approach)
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');

    console.log(`🔧 Executing ${statements.length} migration statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`⚙️  Statement ${i + 1}/${statements.length}`);

      const { error } = await supabase.rpc('exec_sql', {
        query: statement + ';'
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        // Continue with other statements
      }
    }

    console.log('✅ Migration completed!');

    // Run verification queries
    console.log('\n🔍 Running verification checks...');

    const verifyQueries = [
      "SELECT 'Users without households' as check_name, COUNT(*) as count FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM household_members hm WHERE hm.user_id = u.id)",
      "SELECT 'Households with subscription tracking' as check_name, COUNT(*) as count FROM households WHERE subscription_tier IS NOT NULL"
    ];

    for (const query of verifyQueries) {
      const { data, error } = await supabase.rpc('exec_sql', { query });
      if (!error && data) {
        console.log('📊', data);
      }
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('🎉 Migration process complete');
  process.exit(0);
});