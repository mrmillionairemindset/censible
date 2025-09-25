// Simple debugging script to test household loading functions directly
// Run this in the browser console to debug the exact issue

// This simulates what the HouseholdPage is doing

async function debugHouseholdLoading() {
  console.log('🔍 Starting household loading debug...');

  try {
    // Import the functions (you might need to adjust this based on your setup)
    const { getUserHousehold, getHouseholdMembers } = window;

    console.log('📋 Step 1: Getting user household info...');
    const householdInfo = await getUserHousehold();
    console.log('Household info:', householdInfo);

    if (!householdInfo.household_id) {
      console.error('❌ No household_id found!');
      return;
    }

    console.log('📋 Step 2: Getting household members...');
    const members = await getHouseholdMembers();
    console.log('Household members:', members);

    console.log('✅ Debug completed successfully!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details
    });
  }
}

// Instructions for use:
console.log(`
🔧 DEBUGGING INSTRUCTIONS:
1. Open browser dev tools (F12)
2. Go to the Household page in your app
3. In the console, run: debugHouseholdLoading()
4. Check the output for detailed error information
`);

// Auto-run if this is being executed in browser
if (typeof window !== 'undefined') {
  // Make the function globally available
  window.debugHouseholdLoading = debugHouseholdLoading;
  console.log('✅ Debug function loaded. Run debugHouseholdLoading() in console.');
}