// Debug script to check and ensure core categories are set up
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Core categories from the types file
const CoreCategories = [
  'groceries',
  'housing',
  'transportation',
  'utilities',
  'dining',
  'shopping',
  'subscriptions',
  'debt-payments',
  'insurance'
];

const CategoryColors = {
  groceries: '#10B981',
  housing: '#8B5CF6',
  transportation: '#F59E0B',
  shopping: '#EC4899',
  dining: '#EF4444',
  utilities: '#FACC15',
  'debt-payments': '#DC2626',
  insurance: '#1E40AF',
  subscriptions: '#4338CA'
};

const CategoryIcons = {
  groceries: '🛒',
  housing: '🏠',
  transportation: '🚗',
  shopping: '🛍️',
  dining: '🍽️',
  utilities: '⚡',
  'debt-payments': '💳',
  insurance: '🛡️',
  subscriptions: '📱'
};

async function checkAndFixCategories() {
  try {
    console.log('🔍 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Not authenticated. Please sign in first.');
      return;
    }

    console.log(`✅ Authenticated as: ${user.email}`);

    // Get current active period
    console.log('🔍 Finding current active period...');
    const { data: period, error: periodError } = await supabase
      .from('budget_periods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (periodError) {
      console.error('❌ Error getting period:', periodError);
      return;
    }

    if (!period) {
      console.log('❌ No active period found. Need to create one first.');
      return;
    }

    console.log(`✅ Found active period: ${period.year}/${period.month} (ID: ${period.id})`);

    // Get existing categories
    console.log('🔍 Checking existing categories...');
    const { data: existingCategories, error: catError } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('period_id', period.id);

    if (catError) {
      console.error('❌ Error getting categories:', catError);
      return;
    }

    console.log(`📊 Found ${existingCategories?.length || 0} existing categories:`);
    existingCategories?.forEach(cat => {
      console.log(`  - ${cat.category} ($${cat.allocated} allocated, $${cat.spent} spent)`);
    });

    const existingCategoryNames = existingCategories?.map(cat => cat.category) || [];
    const missingCategories = CoreCategories.filter(core => !existingCategoryNames.includes(core));

    if (missingCategories.length > 0) {
      console.log(`🆕 Missing core categories: ${missingCategories.join(', ')}`);

      // Create missing categories
      const newCategories = missingCategories.map(category => ({
        period_id: period.id,
        category: category,
        allocated: 0,
        spent: 0,
        color: CategoryColors[category],
        icon: CategoryIcons[category],
        is_custom: false
      }));

      console.log('💾 Creating missing categories...');
      const { error: insertError } = await supabase
        .from('budget_categories')
        .insert(newCategories);

      if (insertError) {
        console.error('❌ Error creating categories:', insertError);
        return;
      }

      console.log(`✅ Created ${missingCategories.length} missing core categories!`);
    } else {
      console.log('✅ All core categories already exist!');
    }

    // Final verification
    console.log('🔍 Final verification...');
    const { data: finalCategories } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('period_id', period.id)
      .order('category');

    console.log(`📊 Total categories now: ${finalCategories?.length || 0}`);
    finalCategories?.forEach(cat => {
      const coreStatus = CoreCategories.includes(cat.category) ? '[CORE]' : '[CUSTOM]';
      console.log(`  - ${coreStatus} ${cat.category} ($${cat.allocated} allocated, $${cat.spent} spent)`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndFixCategories();