#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details with service role key
const supabaseUrl = 'https://ushfqdljyfucrhhpkxyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaGZxZGxqeWZ1Y3JoaHBreHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODMyODkxNCwiZXhwIjoyMDczOTA0OTE0fQ.jTrw9vESPtBby6HTtrrOvpQvh5ltzYxf5EV6VPIwjOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixHouseholdsRLS() {
  console.log('🔧 Running households table RLS policy fix with admin privileges...');

  try {
    // Check current policies first
    console.log('📋 Checking current policies on households table...');
    const { data: currentPolicies, error: checkError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd')
      .eq('tablename', 'households');

    if (checkError) {
      console.log('⚠️ Could not check current policies:', checkError.message);
    } else {
      console.log('Current policies:', currentPolicies);
    }

    // Execute SQL statements to fix the policies
    const sqlStatements = [
      // Drop existing problematic policies
      "DROP POLICY IF EXISTS \"Users can create households\" ON households;",
      "DROP POLICY IF EXISTS \"Users can view households they belong to\" ON households;",
      "DROP POLICY IF EXISTS \"Household owners can update their household\" ON households;",
      "DROP POLICY IF EXISTS \"Household owners can delete their household\" ON households;",

      // Create new working policies with clear ownership model
      `CREATE POLICY "Allow users to create households" ON households
       FOR INSERT WITH CHECK (auth.uid() = created_by);`,

      `CREATE POLICY "Allow users to view own households" ON households
       FOR SELECT USING (auth.uid() = created_by);`,

      `CREATE POLICY "Allow owners to update own households" ON households
       FOR UPDATE USING (auth.uid() = created_by)
       WITH CHECK (auth.uid() = created_by);`,

      `CREATE POLICY "Allow owners to delete own households" ON households
       FOR DELETE USING (auth.uid() = created_by);`
    ];

    console.log('🛠️ Applying RLS policy fixes...');

    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`[${i + 1}/${sqlStatements.length}] ${sql.substring(0, 50)}...`);

      const { error } = await supabase.rpc('exec_sql', { query: sql });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
        // Don't throw on DROP statements that might not exist
        if (!sql.startsWith('DROP POLICY')) {
          throw error;
        }
      } else {
        console.log('✅ Success');
      }
    }

    // Verify the policies are working
    console.log('🔍 Verifying new policies...');
    const { data: finalPolicies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd')
      .eq('tablename', 'households')
      .order('policyname');

    if (verifyError) {
      console.log('⚠️ Could not verify policies:', verifyError.message);
    } else {
      console.log('✅ Final policies in place:');
      finalPolicies.forEach(p => console.log(`  - ${p.policyname} (${p.cmd})`));
    }

    console.log('🎉 Households RLS policy fix completed successfully!');
    console.log('💡 Users should now be able to create households without RLS errors.');

  } catch (error) {
    console.error('❌ Fatal error running households fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixHouseholdsRLS();