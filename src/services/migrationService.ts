import { supabase } from '../lib/supabase';
import { CategoryType, Transaction, BudgetCategory, CategoryColors, CategoryIcons } from '../types';

interface LocalStorageData {
  budget?: {
    totalBudget: number;
    categories: BudgetCategory[];
    period: string;
    startDate: string;
  };
  transactions?: Transaction[];
  currentMonth?: string;
}

export class MigrationService {
  static async migrateLocalStorageToSupabase(): Promise<boolean> {
    try {
      console.log('[Migration] Starting local storage to Supabase migration...');

      // Check if user is authenticated
      console.log('[Migration] Checking authentication...');

      // Add timeout to prevent hanging
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      );

      const { data: { user }, error: userError } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (userError) {
        console.error('[Migration] Error getting user:', userError);
        return false;
      }
      if (!user) {
        console.log('[Migration] No authenticated user, skipping migration');
        return false;
      }
      console.log('[Migration] User authenticated:', user.email);

      // Check if we've already migrated (look for existing periods)
      console.log('[Migration] Checking for existing data...');
      const { data: existingPeriods, error: checkError } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) {
        console.error('[Migration] Error checking existing periods:', checkError);
        // Continue anyway - might be first time
      }

      if (existingPeriods && existingPeriods.length > 0) {
        console.log('[Migration] User already has data in Supabase, skipping migration');
        return false;
      }
      console.log('[Migration] No existing data found, proceeding with migration');

      // Check if there's local storage data to migrate
      // Try both with and without user ID prefix
      let budgetData = localStorage.getItem('centsible_budget');
      let transactionsData = localStorage.getItem('centsible_transactions');
      let currentMonthData = localStorage.getItem('centsible_current_month');

      // If not found, look for data with user ID prefix
      if (!budgetData || !transactionsData) {
        const keys = Object.keys(localStorage);
        const budgetKey = keys.find(k => k.endsWith('_budget') && k.startsWith('centsible_'));
        const transKey = keys.find(k => k.endsWith('_transactions') && k.startsWith('centsible_'));

        if (budgetKey) budgetData = localStorage.getItem(budgetKey);
        if (transKey) transactionsData = localStorage.getItem(transKey);
      }

      if (!budgetData && !transactionsData) {
        console.log('[Migration] No local storage data found to migrate');
        return false;
      }

      // Parse local storage data
      const budget = budgetData ? JSON.parse(budgetData) : null;
      const transactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];
      const currentMonth = currentMonthData ? JSON.parse(currentMonthData) : new Date().toISOString().slice(0, 7);

      console.log('[Migration] Found local data:', {
        hasBudget: !!budget,
        transactionCount: transactions.length,
        currentMonth
      });

      // Create budget period
      const periodStartDate = budget?.startDate ? new Date(budget.startDate) : new Date(currentMonth + '-01');
      const periodEndDate = new Date(periodStartDate);
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);
      periodEndDate.setDate(periodEndDate.getDate() - 1);

      const { data: period, error: periodError } = await supabase
        .from('budget_periods')
        .insert({
          user_id: user.id,
          start_date: periodStartDate.toISOString(),
          end_date: periodEndDate.toISOString(),
          total_budget: budget?.totalBudget || 0,
          is_current: true
        })
        .select()
        .single();

      if (periodError || !period) {
        console.error('[Migration] Error creating budget period:', periodError);
        return false;
      }

      console.log('[Migration] Created budget period:', period.id);

      // Create budget categories if we have budget data
      if (budget?.categories && budget.categories.length > 0) {
        const categoriesData = budget.categories.map((cat: BudgetCategory) => ({
          period_id: period.id,
          category: cat.category,
          allocated: cat.allocated,
          spent: cat.spent || 0,
          color: cat.color || CategoryColors[cat.category as keyof typeof CategoryColors] || '#6B7280',
          icon: cat.icon || CategoryIcons[cat.category as keyof typeof CategoryIcons] || '📌'
        }));

        const { error: catError } = await supabase
          .from('budget_categories')
          .insert(categoriesData);

        if (catError) {
          console.error('[Migration] Error creating categories:', catError);
          // Continue anyway - transactions are more important
        } else {
          console.log('[Migration] Created', categoriesData.length, 'categories');
        }
      }

      // Migrate transactions
      if (transactions.length > 0) {
        // Filter transactions for the current period
        const periodTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= periodStartDate && tDate <= periodEndDate;
        });

        if (periodTransactions.length > 0) {
          const transactionsData = periodTransactions.map(t => ({
            period_id: period.id,
            amount: t.amount,
            description: t.description,
            category: t.category,
            transaction_date: new Date(t.date).toISOString(),
            merchant: t.merchant || null
          }));

          const { error: txError } = await supabase
            .from('transactions')
            .insert(transactionsData);

          if (txError) {
            console.error('[Migration] Error creating transactions:', txError);
          } else {
            console.log('[Migration] Created', transactionsData.length, 'transactions');
          }
        }

        // Store older transactions in separate periods if needed
        const olderTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate < periodStartDate;
        });

        if (olderTransactions.length > 0) {
          console.log('[Migration] Found', olderTransactions.length, 'older transactions to migrate');

          // Group by month
          const monthGroups = olderTransactions.reduce((groups, t) => {
            const month = new Date(t.date).toISOString().slice(0, 7);
            if (!groups[month]) groups[month] = [];
            groups[month].push(t);
            return groups;
          }, {} as Record<string, Transaction[]>);

          for (const [month, monthTxs] of Object.entries(monthGroups) as [string, Transaction[]][]) {
            const monthStart = new Date(month + '-01');
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(monthEnd.getDate() - 1);

            // Create historical period
            const { data: histPeriod, error: histError } = await supabase
              .from('budget_periods')
              .insert({
                user_id: user.id,
                start_date: monthStart.toISOString(),
                end_date: monthEnd.toISOString(),
                total_budget: budget?.totalBudget || 0,
                is_current: false
              })
              .select()
              .single();

            if (!histError && histPeriod) {
              // Add transactions to historical period
              const histTxData = monthTxs.map(t => ({
                period_id: histPeriod.id,
                amount: t.amount,
                description: t.description,
                category: t.category,
                transaction_date: new Date(t.date).toISOString(),
                merchant: t.merchant || null
              }));

              await supabase.from('transactions').insert(histTxData);
              console.log('[Migration] Created historical period for', month, 'with', monthTxs.length, 'transactions');
            }
          }
        }
      }

      // Mark migration as complete by adding a flag to localStorage
      localStorage.setItem('centsible_migrated_to_supabase', 'true');
      console.log('[Migration] ✅ Migration completed successfully');

      return true;
    } catch (error) {
      console.error('[Migration] Error during migration:', error);
      return false;
    }
  }

  static async checkAndMigrate(): Promise<boolean> {
    // Check if already migrated
    const migrated = localStorage.getItem('centsible_migrated_to_supabase');
    if (migrated === 'true') {
      console.log('[Migration] Already migrated, skipping');
      return false;
    }

    // Also check for old migration flags with user ID
    const keys = Object.keys(localStorage);
    const hasMigrationFlag = keys.some(k => k.includes('migration_') && k.endsWith('_complete'));
    if (hasMigrationFlag) {
      console.log('[Migration] Found previous migration flag, marking as migrated');
      localStorage.setItem('centsible_migrated_to_supabase', 'true');
      return false;
    }

    return await this.migrateLocalStorageToSupabase();
  }
}