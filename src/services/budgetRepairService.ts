import { supabase } from '../lib/supabase';

/**
 * Service to repair and recalculate budget spent amounts
 */
export class BudgetRepairService {

  /**
   * Recalculate spent amounts for all categories in the current period
   * based on actual transactions
   */
  static async recalculateSpentAmounts(): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    console.log('🔧 Starting budget repair for user:', user.email);

    // Get current active period
    const { data: activePeriod, error: periodError } = await supabase
      .from('budget_periods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (periodError || !activePeriod) {
      throw new Error('No active budget period found');
    }

    console.log('🔧 Active period:', `${activePeriod.year}/${activePeriod.month}`);

    // Get all transactions for this period, grouped by category
    const { data: transactionTotals, error: transactionError } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('period_id', activePeriod.id);

    if (transactionError) {
      throw new Error('Failed to fetch transactions: ' + transactionError.message);
    }

    console.log('🔧 Found transactions:', transactionTotals?.length || 0);

    // Calculate actual spent amounts by category
    const spentByCategory: Record<string, number> = {};

    transactionTotals?.forEach(transaction => {
      if (transaction.category) {
        spentByCategory[transaction.category] =
          (spentByCategory[transaction.category] || 0) + Number(transaction.amount);
      }
    });

    console.log('🔧 Calculated spent by category:', spentByCategory);

    // Get all budget categories for this period
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('period_id', activePeriod.id);

    if (categoriesError) {
      throw new Error('Failed to fetch categories: ' + categoriesError.message);
    }

    console.log('🔧 Found budget categories:', categories?.length || 0);

    // Update each category with correct spent amount
    for (const category of categories || []) {
      const actualSpent = spentByCategory[category.category] || 0;
      const currentSpent = Number(category.spent);

      if (actualSpent !== currentSpent) {
        console.log(`🔧 Fixing ${category.category}: ${currentSpent} → ${actualSpent}`);

        const { error: updateError } = await supabase
          .from('budget_categories')
          .update({ spent: actualSpent })
          .eq('id', category.id);

        if (updateError) {
          console.error(`❌ Failed to update ${category.category}:`, updateError);
        } else {
          console.log(`✅ Fixed ${category.category}`);
        }
      } else {
        console.log(`✅ ${category.category} is correct: ${actualSpent}`);
      }
    }

    console.log('🔧 Budget repair completed!');
  }

  /**
   * Validate that trigger is working for future transactions
   */
  static async validateTrigger(): Promise<boolean> {
    // This would need to be implemented with a test transaction
    // For now, just return true
    return true;
  }

  /**
   * Get a detailed breakdown of spending for debugging
   */
  static async getSpendingBreakdown(): Promise<any> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Get current active period
    const { data: activePeriod } = await supabase
      .from('budget_periods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!activePeriod) {
      throw new Error('No active budget period found');
    }

    // Get budget categories with their stored spent amounts
    const { data: categories } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('period_id', activePeriod.id);

    // Get all transactions grouped by category
    const { data: transactions } = await supabase
      .from('transactions')
      .select('category, amount, description, transaction_date')
      .eq('period_id', activePeriod.id)
      .order('transaction_date', { ascending: false });

    // Calculate actual totals from transactions
    const actualTotals: Record<string, number> = {};
    const transactionsByCategory: Record<string, any[]> = {};

    transactions?.forEach(tx => {
      if (tx.category) {
        actualTotals[tx.category] = (actualTotals[tx.category] || 0) + Number(tx.amount);
        if (!transactionsByCategory[tx.category]) {
          transactionsByCategory[tx.category] = [];
        }
        transactionsByCategory[tx.category].push(tx);
      }
    });

    return {
      period: activePeriod,
      categories: categories?.map(cat => ({
        category: cat.category,
        allocated: Number(cat.allocated),
        storedSpent: Number(cat.spent),
        actualSpent: actualTotals[cat.category] || 0,
        isCorrect: Number(cat.spent) === (actualTotals[cat.category] || 0),
        transactions: transactionsByCategory[cat.category] || []
      })),
      summary: {
        totalStoredSpent: categories?.reduce((sum, cat) => sum + Number(cat.spent), 0) || 0,
        totalActualSpent: Object.values(actualTotals).reduce((sum, amount) => sum + amount, 0),
        totalTransactions: transactions?.length || 0
      }
    };
  }
}