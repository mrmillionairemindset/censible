#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection details
const supabaseUrl = 'https://ushfqdljyfucrhhpkxyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaGZxZGxqeWZ1Y3JoaHBreHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjg5MTQsImV4cCI6MjA3MzkwNDkxNH0.WPK4iXSEG4TofbpRfhaeB7hWzaws52zQb_cHVJxvJls';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runHouseholdsFix() {
  console.log('🔧 Running households table RLS policy fix...');

  try {
    // Check current policies first
    console.log('📋 Checking current policies on households table...');
    const { data: currentPolicies, error: checkError } = await supabase.rpc('sql', {
      query: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
               FROM pg_policies
               WHERE tablename = 'households';`
    });

    if (checkError) {
      console.log('⚠️ Could not check current policies (this is normal with anon key):', checkError.message);
    } else {
      console.log('Current policies:', currentPolicies);
    }

    // The SQL statements to fix the policies
    const sqlStatements = [
      // Drop existing policies
      "DROP POLICY IF EXISTS \"Users can create households\" ON households;",
      "DROP POLICY IF EXISTS \"Users can view households they belong to\" ON households;",
      "DROP POLICY IF EXISTS \"Household owners can update their household\" ON households;",
      "DROP POLICY IF EXISTS \"Household owners can delete their household\" ON households;",

      // Create new working policies
      "CREATE POLICY \"Allow users to create households\" ON households FOR INSERT WITH CHECK (auth.uid() = created_by);",
      "CREATE POLICY \"Allow users to view own households\" ON households FOR SELECT USING (auth.uid() = created_by);",
      "CREATE POLICY \"Allow owners to update own households\" ON households FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);",
      "CREATE POLICY \"Allow owners to delete own households\" ON households FOR DELETE USING (auth.uid() = created_by);"
    ];

    console.log('🛠️ Applying RLS policy fixes...');

    for (const sql of sqlStatements) {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('sql', { query: sql });

      if (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
        if (error.code !== '42P01') { // Ignore "relation does not exist" for DROP statements
          throw error;
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    // Verify the policies are in place
    console.log('🔍 Verifying new policies...');
    const { data: newPolicies, error: verifyError } = await supabase.rpc('sql', {
      query: `SELECT schemaname, tablename, policyname, permissive, roles, cmd
               FROM pg_policies
               WHERE tablename = 'households'
               ORDER BY policyname;`
    });

    if (verifyError) {
      console.log('⚠️ Could not verify policies (this is normal with anon key):', verifyError.message);
    } else {
      console.log('✅ New policies in place:', newPolicies);
    }

    console.log('🎉 Households RLS policy fix completed successfully!');
    console.log('💡 You should now be able to create households without RLS errors.');

  } catch (error) {
    console.error('❌ Error running households fix:', error);
    process.exit(1);
  }
}

// Run the fix
runHouseholdsFix();