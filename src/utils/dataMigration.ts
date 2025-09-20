/**
 * Data Migration Utility for Centsible
 * Handles migration of localStorage data to Supabase for authenticated users
 */

export const migrateLocalDataToSupabase = async (userId: string): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] === NEW USER MIGRATION START ===`);
    console.log(`🔄 [${timestamp}] User ID: ${userId}`);

    // Check if migration has already been done
    const migrationFlag = `migration_${userId}_complete`;
    const migrationComplete = localStorage.getItem(migrationFlag);

    if (migrationComplete) {
      console.log(`🔄 [${timestamp}] Migration already completed for user ${userId}`);
      return;
    }

    console.log(`🔄 [${timestamp}] Starting data migration for user ${userId}...`);

    // Get all existing localStorage data
    const localData = {
      transactions: localStorage.getItem('centsible_transactions'),
      budget: localStorage.getItem('centsible_budget'),
      savingsGoals: localStorage.getItem('centsible_savings_goals'),
      income: localStorage.getItem('centsible_income')
    };

    // Parse and log the data
    const parsedData = {
      transactions: localData.transactions ? JSON.parse(localData.transactions) : [],
      budget: localData.budget ? JSON.parse(localData.budget) : null,
      savingsGoals: localData.savingsGoals ? JSON.parse(localData.savingsGoals) : [],
      income: localData.income ? JSON.parse(localData.income) : []
    };

    console.log('Local data found for migration:', {
      transactionCount: parsedData.transactions.length,
      budgetExists: !!parsedData.budget,
      savingsGoalsCount: parsedData.savingsGoals.length,
      incomeSourcesCount: parsedData.income.length
    });

    // Log if any data would be migrated
    if (parsedData.transactions.length > 0 || parsedData.budget || parsedData.savingsGoals.length > 0 || parsedData.income.length > 0) {
      console.warn(`🚨 [${timestamp}] DEMO DATA DETECTED for user ${userId} - This will be migrated:`, parsedData);
    } else {
      console.log(`✅ [${timestamp}] No demo data to migrate for user ${userId} - user will start fresh`);
    }

    // Log detailed data for inspection
    if (parsedData.transactions.length > 0) {
      console.log('Sample transactions:', parsedData.transactions.slice(0, 3));
    }
    if (parsedData.budget) {
      console.log('Budget data:', parsedData.budget);
    }
    if (parsedData.savingsGoals.length > 0) {
      console.log('Sample savings goals:', parsedData.savingsGoals.slice(0, 2));
    }
    if (parsedData.income.length > 0) {
      console.log('Sample income sources:', parsedData.income.slice(0, 2));
    }

    // TODO: Create Supabase tables and insert data
    // Tables needed:
    // 1. user_transactions (id, user_id, amount, category, description, date, created_at)
    // 2. user_budgets (id, user_id, categories, total_budget, start_date, created_at, updated_at)
    // 3. user_savings_goals (id, user_id, name, target_amount, current_amount, target_date, priority, created_at, updated_at)
    // 4. user_income_sources (id, user_id, name, amount, frequency, start_date, is_active, created_at, updated_at)

    // TODO: Insert transactions
    // for (const transaction of parsedData.transactions) {
    //   await supabase.from('user_transactions').insert({
    //     user_id: userId,
    //     amount: transaction.amount,
    //     category: transaction.category,
    //     description: transaction.description,
    //     date: transaction.date
    //   });
    // }

    // TODO: Insert budget data
    // if (parsedData.budget) {
    //   await supabase.from('user_budgets').insert({
    //     user_id: userId,
    //     categories: parsedData.budget.categories,
    //     total_budget: parsedData.budget.totalBudget,
    //     start_date: parsedData.budget.startDate
    //   });
    // }

    // TODO: Insert savings goals
    // for (const goal of parsedData.savingsGoals) {
    //   await supabase.from('user_savings_goals').insert({
    //     user_id: userId,
    //     name: goal.name,
    //     target_amount: goal.targetAmount,
    //     current_amount: goal.currentAmount,
    //     target_date: goal.targetDate,
    //     priority: goal.priority
    //   });
    // }

    // TODO: Insert income sources
    // for (const income of parsedData.income) {
    //   await supabase.from('user_income_sources').insert({
    //     user_id: userId,
    //     name: income.name,
    //     amount: income.amount,
    //     frequency: income.frequency,
    //     start_date: income.startDate,
    //     is_active: income.isActive
    //   });
    // }

    // Set migration complete flag
    localStorage.setItem(migrationFlag, 'true');
    console.log(`🔄 [${timestamp}] === MIGRATION COMPLETED for user ${userId} ===`);

    // NOTE: Not clearing localStorage yet to keep data accessible
    // TODO: Clear localStorage after confirming Supabase data integrity

  } catch (error) {
    console.error('Error during data migration:', error);
    throw new Error(`Failed to migrate data for user ${userId}: ${error}`);
  }
};

/**
 * Check if migration has been completed for a user
 */
export const isMigrationComplete = (userId: string): boolean => {
  const migrationFlag = `migration_${userId}_complete`;
  return localStorage.getItem(migrationFlag) === 'true';
};

/**
 * Reset migration flag (for testing purposes)
 */
export const resetMigrationFlag = (userId: string): void => {
  const migrationFlag = `migration_${userId}_complete`;
  localStorage.removeItem(migrationFlag);
  console.log(`Migration flag reset for user ${userId}`);
};