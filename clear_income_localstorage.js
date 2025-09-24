// Clear localStorage income data to start fresh with database
// Run this in the browser console on your Centsible app

console.log('🧹 Clearing localStorage income data to start fresh...');

// Clear main income sources
const oldIncomeData = localStorage.getItem('centsible_income_sources');
if (oldIncomeData) {
    console.log('📊 Found existing income data:', JSON.parse(oldIncomeData));
    localStorage.removeItem('centsible_income_sources');
    console.log('✅ Cleared centsible_income_sources');
} else {
    console.log('ℹ️ No existing income data found');
}

// Clear any household-specific income data
const keys = Object.keys(localStorage);
const incomeKeys = keys.filter(key => key.includes('income'));
incomeKeys.forEach(key => {
    console.log(`🗑️ Removing ${key}`);
    localStorage.removeItem(key);
});

console.log('✨ localStorage income data cleared! Ready to start fresh with database.');
console.log('💡 Refresh the page and add your income sources through the UI.');