import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo, useCallback } from 'react';
import {
  Transaction,
  Budget,
  CategoryType,
  BudgetCategory,
  CategoryColors,
  CategoryIcons,
  IncomeSource,
  SavingsGoal,
  FinancialHealth,
  FinancialSummary,
  CoreCategories
} from '../types';
import { getCategoryColor } from '../utils/categoryColors';
import type {
  BudgetPeriod,
  BudgetCategory as DBBudgetCategory,
  Transaction as DBTransaction
} from '../types/database';
import {
  generateFinancialSummary,
  calculateFinancialHealth
} from '../utils/financialCalculations';
import { BudgetPeriodService } from '../services/budgetPeriodService';
import { BudgetRepairService } from '../services/budgetRepairService';
import { IncomeSourceService } from '../services/incomeSourceService';
import { supabase } from '../lib/supabase';
import { toDateSafe, toISOStringSafe } from '../utils/dates';

interface BudgetState {
  transactions: Transaction[];
  budget: Budget;
  incomeSources: IncomeSource[];
  savingsGoals: SavingsGoal[];
  selectedCategory?: CategoryType;
  authLoading: boolean;
  dataLoading: boolean;
  error?: string;
  currentPeriod?: BudgetPeriod;
  historicalPeriods: Array<{
    period: BudgetPeriod;
    totalSpent: number;
    categoryCount: number;
  }>;
  isAuthenticated: boolean;
  hasUser: boolean;
  user: any;
}

interface BudgetContextType extends BudgetState {
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (budget: Partial<Budget>) => Promise<void>;
  setCategoryFilter: (category: CategoryType | undefined) => void;
  getTotalSpent: () => number;
  getRemainingBudget: () => number;
  getCategorySpending: (category: CategoryType) => { spent: number; allocated: number; percentage: number };
  updateCategoryBudgets: (categories: BudgetCategory[], totalBudget: number) => Promise<void>;
  deleteCategory: (category: CategoryType) => Promise<void>;
  setIncomeSources: (sources: IncomeSource[]) => void;
  addIncomeSource: (incomeSource: Omit<IncomeSource, 'id'>) => Promise<void>;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;
  setSavingsGoals: (goals: SavingsGoal[]) => void;
  financialSummary: FinancialSummary;
  financialHealth: FinancialHealth;
  // New methods for period management
  refreshCurrentPeriod: () => Promise<void>;
  loadHistoricalPeriod: (periodId: string) => Promise<void>;
  repairBudgetMath: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean; // Computed property
}

// Core Categories: Essential categories that provide 70-80% coverage for most users
const defaultCategories: BudgetCategory[] = [
  { category: 'groceries', allocated: 400, spent: 250, color: CategoryColors.groceries, icon: CategoryIcons.groceries, isCustom: false },
  { category: 'housing', allocated: 1200, spent: 800, color: CategoryColors.housing, icon: CategoryIcons.housing, isCustom: false },
  { category: 'transportation', allocated: 200, spent: 180, color: CategoryColors.transportation, icon: CategoryIcons.transportation, isCustom: false },
  { category: 'shopping', allocated: 150, spent: 75, color: CategoryColors.shopping, icon: CategoryIcons.shopping, isCustom: false },
  { category: 'entertainment', allocated: 200, spent: 120, color: CategoryColors.entertainment, icon: CategoryIcons.entertainment, isCustom: false },
  { category: 'dining', allocated: 200, spent: 150, color: CategoryColors.dining, icon: CategoryIcons.dining, isCustom: false },
  { category: 'utilities', allocated: 150, spent: 120, color: CategoryColors.utilities, icon: CategoryIcons.utilities, isCustom: false },
  { category: 'subscriptions', allocated: 100, spent: 50, color: CategoryColors.subscriptions, icon: CategoryIcons.subscriptions, isCustom: false },
];

const initialState: BudgetState = {
  transactions: [],
  budget: {
    totalBudget: 2400, // Updated to match core categories total: 400+1200+200+150+200+200+150+100
    categories: defaultCategories,
    period: 'monthly' as const,
    startDate: new Date()
  },
  incomeSources: [],
  savingsGoals: [],
  authLoading: true,
  dataLoading: false,
  historicalPeriods: [],
  isAuthenticated: false,
  hasUser: false,
  user: null
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

// Conversion utilities
const dbTransactionToTransaction = (dbTransaction: DBTransaction): Transaction => ({
  id: dbTransaction.id,
  amount: Number(dbTransaction.amount),
  description: dbTransaction.description || '',
  category: dbTransaction.category as CategoryType,
  date: new Date(dbTransaction.transaction_date),
  merchant: dbTransaction.merchant || undefined
});

const dbCategoryToBudgetCategory = (dbCategory: DBBudgetCategory): BudgetCategory => ({
  category: dbCategory.category as CategoryType,
  allocated: Number(dbCategory.allocated),
  spent: Number(dbCategory.spent),
  color: dbCategory.color || getCategoryColor(dbCategory.category),
  icon: dbCategory.icon || CategoryIcons[dbCategory.category as keyof typeof CategoryIcons] || '📦',
  isCustom: dbCategory.is_custom !== undefined ? dbCategory.is_custom : !CoreCategories.includes(dbCategory.category as CategoryType)
});

interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [state, setState] = useState<BudgetState>(initialState);
  const listenerSetRef = useRef(false);

  // Separate loading state setters for cleaner code
  const setAuthLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, authLoading: loading }));
  };

  const setDataLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, dataLoading: loading }));
  };

  const setHasUser = (has: boolean) => {
    setState(prev => ({ ...prev, hasUser: has }));
  };

  const setIsAuthenticated = (auth: boolean) => {
    setState(prev => ({ ...prev, isAuthenticated: auth }));
  };

  // Load user data from Supabase
  const loadUserData = useCallback(async (userId: string) => {
    setDataLoading(true);
    try {
      console.log(`[${new Date().toISOString()}] 📊 Loading user data for user:`, userId);
      setState(prev => ({ ...prev, dataLoading: true, error: undefined }));

      // Skip migration for now - directly load from Supabase
      console.log(`[${new Date().toISOString()}] 🔄 Skipping migration, loading directly from Supabase...`);

      // Get current period data from Supabase
      console.log(`[${new Date().toISOString()}] 🔍 Fetching current period...`);
      let currentData: Awaited<ReturnType<typeof BudgetPeriodService.getCurrentPeriod>> = null;
      let historicalData: Awaited<ReturnType<typeof BudgetPeriodService.getHistoricalPeriods>> = [];

      try {
        // Test basic connectivity first
        console.log(`[${new Date().toISOString()}] 🔍 Testing basic Supabase connectivity...`);

        // Test with timeout on a simple query
        const testPromise = (async () => {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          console.log(`[${new Date().toISOString()}] 👤 Auth getUser result:`, {
            hasUser: !!user,
            email: user?.email,
            error: userError?.message
          });

          if (!user) {
            throw new Error('No authenticated user');
          }

          // Try a very simple count query first
          console.log(`[${new Date().toISOString()}] 🔍 Testing budget_periods table access...`);
          const { count, error: countError } = await supabase
            .from('budget_periods')
            .select('*', { count: 'exact', head: true });

          console.log(`[${new Date().toISOString()}] 📊 Table count result:`, { count, error: countError?.message });

          return { user, count, countError };
        })();

        const testTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Basic connectivity test timeout')), 5000)
        );

        const testResult = await Promise.race([testPromise, testTimeout]);
        console.log(`[${new Date().toISOString()}] ✅ Basic connectivity test passed:`, testResult);

        // Now try to get current period with proper error handling
        console.log(`[${new Date().toISOString()}] 🔍 Attempting to fetch current period...`);
        try {
          currentData = await BudgetPeriodService.getCurrentPeriod();
          console.log(`[${new Date().toISOString()}] 📊 Current period result:`, !!currentData);
          if (currentData) {
            console.log(`[${new Date().toISOString()}] 📊 Categories found:`, currentData.categories.map((c: any) => c.category));

            // Ensure core categories exist for current period
            console.log(`[${new Date().toISOString()}] 🔍 Ensuring core categories exist...`);
            try {
              await BudgetPeriodService.ensureCoreCategories();
              // Reload current period data to get any newly added core categories
              currentData = await BudgetPeriodService.getCurrentPeriod();
              console.log(`[${new Date().toISOString()}] ✅ Core categories ensured, updated categories:`, currentData?.categories.map((c: any) => c.category));
            } catch (coreError) {
              console.error(`[${new Date().toISOString()}] ⚠️ Error ensuring core categories:`, coreError);
              // Continue with existing data even if core categories check fails
            }
          }
        } catch (periodError) {
          console.error(`[${new Date().toISOString()}] ⚠️ Error getting current period:`, periodError);
          currentData = null;
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Error fetching current period:`, err);
        // Continue with null currentData - user will see empty budget
      }

      try {
        console.log(`[${new Date().toISOString()}] 🔍 Fetching historical periods...`);
        historicalData = await BudgetPeriodService.getHistoricalPeriods();
        console.log(`[${new Date().toISOString()}] 📊 Historical periods result:`, historicalData?.length || 0);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Error fetching historical periods:`, err);
        // Continue with empty historical data
      }

      // Start fresh with income sources from database (no localStorage fallback)
      let savedIncomeSources: IncomeSource[] = []; // Fixed user reference
      try {
        // Get the authenticated user for income loading
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authUser && !authError) {
          console.log('[DEBUG] Loading income sources for user:', authUser.id);
          console.log('[DEBUG] User email:', authUser.email);
          savedIncomeSources = await IncomeSourceService.getIncomeSources(authUser.id, undefined);
          console.log('[DEBUG] Loaded income sources from database:', savedIncomeSources.length);
        } else {
          console.log('[DEBUG] No authenticated user, skipping income source loading');
          if (authError) console.error('[DEBUG] Auth error:', authError);
        }
      } catch (error) {
        console.error('Failed to load income sources from database:', error);
        // Start with empty array for fresh start
        savedIncomeSources = [];
      }
      const savedSavingsGoalsRaw: SavingsGoal[] = JSON.parse(
        localStorage.getItem('centsible_savings_goals') || '[]'
      );

      // Normalize dates in savings goals
      const savedSavingsGoals = savedSavingsGoalsRaw.map(goal => ({
        ...goal,
        targetDate: toDateSafe(goal.targetDate) || new Date()
      }));

      // Use the fetched currentData if available
      if (currentData) {
        // User has existing budget data
        console.log(`[${new Date().toISOString()}] 📊 Loading existing budget data with ${currentData.categories.length} categories`);
        const data = currentData; // TypeScript helper
        setState(prev => ({
          ...prev,
          budget: {
            totalBudget: Number(data.period.total_budget || 0),
            categories: data.categories.map(dbCategoryToBudgetCategory),
            period: 'monthly' as const,
            startDate: new Date(data.period.year, data.period.month - 1, 1)
          },
          transactions: data.transactions.map(dbTransactionToTransaction),
          currentPeriod: data.period,
          historicalPeriods: historicalData,
          incomeSources: savedIncomeSources,
          savingsGoals: savedSavingsGoals,
          dataLoading: false
        }));

      } else {
        // No current period, user needs to set up budget
        console.log(`[${new Date().toISOString()}] 📊 No existing budget data, showing default setup`);
        setState(prev => ({
          ...prev,
          budget: {
            totalBudget: 0,
            categories: defaultCategories,
            period: 'monthly' as const,
            startDate: new Date()
          },
          transactions: [],
          currentPeriod: undefined,
          historicalPeriods: historicalData,
          incomeSources: savedIncomeSources,
          savingsGoals: savedSavingsGoals,
          dataLoading: false
        }));
      }
      console.log(`[${new Date().toISOString()}] ✅ User data loaded successfully`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Error loading user data:`, error);
      setState(prev => ({
        ...prev,
        dataLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Authentication state management with proper cleanup
  useEffect(() => {
    let cancelled = false;
    console.log(`[${new Date().toISOString()}] 🔧 Setting up auth state listener`);

    // Initial session check
    const initAuth = async () => {
      setAuthLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (cancelled) return;

        console.log(`[${new Date().toISOString()}] 🔍 Initial session check:`, !!session?.user, error ? `Error: ${error.message}` : 'No error');

        if (error) {
          console.error(`[${new Date().toISOString()}] ❌ Session error:`, error);
          setIsAuthenticated(false);
          setHasUser(false);
          setState(prev => ({
            ...prev,
            user: null,
            authLoading: false,
            error: 'Authentication failed'
          }));
          return;
        }

        setHasUser(!!session?.user);
        setIsAuthenticated(!!session?.user);
        setState(prev => ({
          ...prev,
          user: session?.user || null
        }));

        if (session?.user) {
          console.log(`[${new Date().toISOString()}] 👤 Initial user found, loading data for:`, session.user.email);
          await loadUserData(session.user.id);
        }
        setAuthLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.error(`[${new Date().toISOString()}] ❌ Error checking initial session:`, error);
        setIsAuthenticated(false);
        setHasUser(false);
        setState(prev => ({
          ...prev,
          authLoading: false,
          error: 'Failed to check authentication status'
        }));
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    // Set up auth state change listener (prevent duplicates)
    let subscription: any = null;
    if (!listenerSetRef.current) {
      listenerSetRef.current = true;
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (cancelled) return;

        console.log(`[${new Date().toISOString()}] 🔐 Auth state changed:`, event, 'Session:', !!session?.user);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log(`[${new Date().toISOString()}] 👤 User authenticated via ${event}, loading data for:`, session.user.email);
          setHasUser(true);
          setIsAuthenticated(true);
          setState(prev => ({
            ...prev,
            user: session.user
          }));
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT' || !session?.user) {
          console.log(`[${new Date().toISOString()}] 👋 User signed out or no session (${event})`);
          setHasUser(false);
          setIsAuthenticated(false);
          setAuthLoading(false);
          setDataLoading(false);
          setState(prev => ({
            ...initialState,
            authLoading: false,
            dataLoading: false
          }));
        }
      });
      subscription = data.subscription;
    }

    // Initialize authentication
    initAuth();

    return () => {
      cancelled = true;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Remove loadUserData dependency to prevent recreation

  // Real-time subscriptions for current period data
  useEffect(() => {
    if (!state.isAuthenticated || !state.currentPeriod) {
      return;
    }

    // Subscribe to transaction changes for current period
    const transactionSubscription = supabase
      .channel('transaction_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `period_id=eq.${state.currentPeriod.id}`
      }, (payload) => {
        console.log('Transaction change:', payload);

        if (payload.eventType === 'INSERT') {
          const newTransaction = dbTransactionToTransaction(payload.new as DBTransaction);
          setState(prev => ({
            ...prev,
            transactions: [newTransaction, ...prev.transactions]
          }));
        } else if (payload.eventType === 'UPDATE') {
          const updatedTransaction = dbTransactionToTransaction(payload.new as DBTransaction);
          setState(prev => ({
            ...prev,
            transactions: prev.transactions.map(t =>
              t.id === updatedTransaction.id ? updatedTransaction : t
            )
          }));
        } else if (payload.eventType === 'DELETE') {
          setState(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => t.id !== payload.old.id)
          }));
        }
      })
      .subscribe();

    // Subscribe to budget category changes for current period
    const categorySubscription = supabase
      .channel('category_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'budget_categories',
        filter: `period_id=eq.${state.currentPeriod.id}`
      }, (payload) => {
        console.log('Category change:', payload);

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedCategory = dbCategoryToBudgetCategory(payload.new as DBBudgetCategory);
          console.log('🔔 Real-time category update:', {
            event: payload.eventType,
            category: updatedCategory.category,
            allocated: updatedCategory.allocated,
            spent: updatedCategory.spent
          });
          setState(prev => ({
            ...prev,
            budget: {
              ...prev.budget,
              categories: prev.budget.categories.map(c =>
                c.category === updatedCategory.category ? updatedCategory : c
              ).concat(
                // Add new category if it doesn't exist
                prev.budget.categories.find(c => c.category === updatedCategory.category)
                  ? []
                  : [updatedCategory]
              )
            }
          }));
        } else if (payload.eventType === 'DELETE') {
          setState(prev => ({
            ...prev,
            budget: {
              ...prev.budget,
              categories: prev.budget.categories.filter(c => c.category !== payload.old.category)
            }
          }));
        }
      })
      .subscribe();

    // Subscribe to budget period changes
    const periodSubscription = supabase
      .channel('period_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'budget_periods',
        filter: `id=eq.${state.currentPeriod.id}`
      }, (payload) => {
        console.log('Period change:', payload);
        const updatedPeriod = payload.new as BudgetPeriod;
        setState(prev => ({
          ...prev,
          currentPeriod: updatedPeriod,
          budget: {
            ...prev.budget,
            totalBudget: Number(updatedPeriod.total_budget || 0),
            startDate: new Date(updatedPeriod.start_date)
          }
        }));
      })
      .subscribe();

    return () => {
      transactionSubscription.unsubscribe();
      categorySubscription.unsubscribe();
      periodSubscription.unsubscribe();
    };
  }, [state.isAuthenticated, state.currentPeriod?.id]);

  // Refresh current period data
  const refreshCurrentPeriod = async () => {
    if (!state.isAuthenticated || !state.hasUser) {
      console.warn('User not authenticated, skipping period refresh');
      return;
    }

    try {
      const currentData = await BudgetPeriodService.getCurrentPeriod();
      if (currentData) {
        console.log('📊 Refreshed period data - Categories from DB:', currentData.categories);
        console.log('📊 Category names from DB:', currentData.categories.map((c: any) => c.category));
        const mappedCategories = currentData.categories.map(dbCategoryToBudgetCategory);
        console.log('📊 Mapped categories for state:', mappedCategories);
        console.log('📊 Mapped category names:', mappedCategories.map(c => c.category));

        setState(prev => ({
          ...prev,
          currentPeriod: currentData.period,
          transactions: currentData.transactions.map(dbTransactionToTransaction),
          budget: {
            totalBudget: Number(currentData.period.total_budget || 0),
            categories: mappedCategories,
            period: 'monthly' as const,
            startDate: new Date(currentData.period.start_date)
          }
        }));
      }
    } catch (error) {
      console.error('Error refreshing current period:', error);
    }
  };

  // Load historical period data
  const loadHistoricalPeriod = async (periodId: string) => {
    try {
      setState(prev => ({ ...prev, dataLoading: true }));
      const historicalData = await BudgetPeriodService.getHistoricalPeriodData(periodId);

      if (historicalData) {
        // Switch to historical view (you might want to handle this differently)
        setState(prev => ({
          ...prev,
          transactions: historicalData.transactions.map(dbTransactionToTransaction),
          budget: {
            totalBudget: Number(historicalData.period.total_budget || 0),
            categories: historicalData.categories.map(dbCategoryToBudgetCategory),
            period: 'monthly' as const,
            startDate: new Date(historicalData.period.start_date)
          },
          dataLoading: false
        }));
      }
    } catch (error) {
      console.error('Error loading historical period:', error);
      setState(prev => ({ ...prev, dataLoading: false, error: 'Failed to load historical data' }));
    }
  };

  // Transaction management
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!state.isAuthenticated || !state.hasUser) {
      console.warn('User not authenticated, skipping transaction add');
      throw new Error('User not authenticated');
    }

    try {
      // Check if the category exists in the current budget
      const categoryExists = state.budget.categories.some(
        cat => cat.category === transaction.category
      );

      // If category doesn't exist, create it first ONLY when saving the transaction
      if (!categoryExists) {
        console.log(`🆕 Creating new budget category during transaction save: ${transaction.category}`);
        console.log(`📍 Transaction details:`, {
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date
        });

        // Get the category color and icon from the types
        const color = getCategoryColor(transaction.category);
        const icon = CategoryIcons[transaction.category] || '📦';

        // Create the new category with 0 allocated budget
        await BudgetPeriodService.upsertBudgetCategory({
          category: transaction.category,
          allocated: 0,
          spent: 0,
          color: color,
          icon: icon,
          is_custom: !CoreCategories.includes(transaction.category) // Mark as custom if not in Core Categories
        });
      }

      const dbTransaction = await BudgetPeriodService.addTransaction({
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        merchant: transaction.merchant,
        transaction_date: transaction.date.toISOString().split('T')[0]
      });

      // Update local state
      const newTransaction = dbTransactionToTransaction(dbTransaction);
      setState(prev => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions]
      }));

      // Refresh to get updated spent amounts and new category if created
      await refreshCurrentPeriod();
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    if (!state.isAuthenticated || !state.hasUser) {
      console.warn('User not authenticated, skipping transaction update');
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category,
          merchant: transaction.merchant,
          transaction_date: transaction.date.toISOString().split('T')[0]
        })
        .eq('id', transaction.id);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === transaction.id ? transaction : t)
      }));

      // Refresh to get updated spent amounts
      await refreshCurrentPeriod();
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!state.isAuthenticated || !state.hasUser) {
      console.warn('User not authenticated, skipping transaction delete');
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id)
      }));

      // Refresh to get updated spent amounts
      await refreshCurrentPeriod();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // Budget management
  const updateBudget = async (budgetUpdate: Partial<Budget>) => {
    if (!state.isAuthenticated || !state.hasUser) {
      console.warn('User not authenticated, skipping budget update');
      // For budget updates, we can still update local state
      setState(prev => ({
        ...prev,
        budget: { ...prev.budget, ...budgetUpdate }
      }));
      return;
    }

    try {
      if (budgetUpdate.totalBudget !== undefined && state.currentPeriod) {
        const { error } = await supabase
          .from('budget_periods')
          .update({ total_budget: budgetUpdate.totalBudget })
          .eq('id', state.currentPeriod.id);

        if (error) throw error;
      }

      setState(prev => ({
        ...prev,
        budget: { ...prev.budget, ...budgetUpdate }
      }));
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const updateCategoryBudgets = async (categories: BudgetCategory[], totalBudget: number) => {
    if (!state.isAuthenticated || !state.hasUser) {
      console.warn('User not authenticated, skipping category budget update');
      return;
    }

    try {
      // Update categories in database
      for (const category of categories) {
        const isCustom = !CoreCategories.includes(category.category);

        await BudgetPeriodService.upsertBudgetCategory({
          category: category.category,
          allocated: category.allocated,
          spent: category.spent,
          color: category.color,
          icon: category.icon,
          is_custom: isCustom
        });
      }

      // Update total budget
      await updateBudget({ totalBudget });

      // Refresh current period to get updated data
      await refreshCurrentPeriod();
    } catch (error) {
      console.error('Error updating category budgets:', error);
      throw error;
    }
  };

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    console.log('🔑 Sign in function called');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      console.log('✅ Successfully signed in to Supabase');

      // Manually update state as fallback in case auth listener doesn't fire
      if (data.user) {
        console.log('🔄 Manually updating auth state after sign in');
        setHasUser(true);
        setIsAuthenticated(true);
        setState(prev => ({
          ...prev,
          user: data.user
        }));
        await loadUserData(data.user.id);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('📝 Sign up function called');
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }
      console.log('✅ Successfully signed up to Supabase');

      // Manually update state as fallback in case auth listener doesn't fire
      if (data.user) {
        console.log('🔄 Manually updating auth state after sign up');
        setHasUser(true);
        setIsAuthenticated(true);
        setState(prev => ({
          ...prev,
          user: data.user
        }));
        await loadUserData(data.user.id);
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 Sign out function called');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      console.log('✅ Successfully signed out from Supabase');

      // Manually update state as fallback in case auth listener doesn't fire
      console.log('🔄 Manually updating auth state after sign out');
      setHasUser(false);
      setIsAuthenticated(false);
      setAuthLoading(false);
      setDataLoading(false);
      setState(prev => ({
        ...initialState,
        authLoading: false,
        dataLoading: false
      }));
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  // Income sources management - now using database
  const setIncomeSources = (sources: IncomeSource[]) => {
    setState(prev => ({ ...prev, incomeSources: sources }));

    // Keep localStorage as backup for now
    localStorage.setItem('centsible_income_sources', JSON.stringify(sources));
  };

  const addIncomeSource = async (incomeSource: Omit<IncomeSource, 'id'>) => {
    console.log('[DEBUG] addIncomeSource called with:', incomeSource);
    if (!state.user) {
      console.error('[DEBUG] No user authenticated for addIncomeSource');
      throw new Error('User not authenticated');
    }

    try {
      console.log('[DEBUG] Creating income source for user:', state.user.id);
      const newIncomeSource = await IncomeSourceService.createIncomeSource(
        incomeSource,
        state.user.id,
        undefined // Don't use household_id for now
      );

      console.log('[DEBUG] Income source created successfully:', newIncomeSource);
      setState(prev => ({
        ...prev,
        incomeSources: [...prev.incomeSources, newIncomeSource]
      }));

      // Update localStorage backup
      const updatedSources = [...state.incomeSources, newIncomeSource];
      localStorage.setItem('centsible_income_sources', JSON.stringify(updatedSources));
      console.log('[DEBUG] Income source added to state and localStorage');
    } catch (error) {
      console.error('[DEBUG] Failed to add income source:', error);
      throw error;
    }
  };

  const updateIncomeSource = async (id: string, updates: Partial<IncomeSource>) => {
    try {
      const updatedIncomeSource = await IncomeSourceService.updateIncomeSource(id, updates);

      setState(prev => ({
        ...prev,
        incomeSources: prev.incomeSources.map(source =>
          source.id === id ? updatedIncomeSource : source
        )
      }));

      // Update localStorage backup
      const updatedSources = state.incomeSources.map(source =>
        source.id === id ? updatedIncomeSource : source
      );
      localStorage.setItem('centsible_income_sources', JSON.stringify(updatedSources));
    } catch (error) {
      console.error('Failed to update income source:', error);
      throw error;
    }
  };

  const deleteIncomeSource = async (id: string) => {
    try {
      await IncomeSourceService.deleteIncomeSource(id);

      setState(prev => ({
        ...prev,
        incomeSources: prev.incomeSources.filter(source => source.id !== id)
      }));

      // Update localStorage backup
      const updatedSources = state.incomeSources.filter(source => source.id !== id);
      localStorage.setItem('centsible_income_sources', JSON.stringify(updatedSources));
    } catch (error) {
      console.error('Failed to delete income source:', error);
      throw error;
    }
  };

  const setSavingsGoals = (goals: SavingsGoal[]) => {
    // Normalize dates before saving
    const normalizedGoals = goals.map(goal => ({
      ...goal,
      targetDate: toDateSafe(goal.targetDate) || new Date()
    }));

    setState(prev => ({ ...prev, savingsGoals: normalizedGoals }));

    // Convert dates to ISO strings for storage
    const goalsForStorage = normalizedGoals.map(goal => ({
      ...goal,
      targetDate: toISOStringSafe(goal.targetDate)
    }));

    // TODO: Implement Supabase storage for savings goals
    localStorage.setItem('centsible_savings_goals', JSON.stringify(goalsForStorage));
  };

  const setCategoryFilter = (category: CategoryType | undefined) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  };

  // Calculated values
  const getTotalSpent = () => {
    return state.budget.categories
      .filter(cat => CoreCategories.includes(cat.category))
      .reduce((total, cat) => total + cat.spent, 0);
  };

  const getRemainingBudget = () => {
    const coreTotalBudget = state.budget.categories
      .filter(cat => CoreCategories.includes(cat.category))
      .reduce((total, cat) => total + cat.allocated, 0);
    return coreTotalBudget - getTotalSpent();
  };

  const getCategorySpending = (category: CategoryType) => {
    const categoryData = state.budget.categories.find(c => c.category === category);
    if (!categoryData) return { spent: 0, allocated: 0, percentage: 0 };

    const percentage = categoryData.allocated > 0 ? (categoryData.spent / categoryData.allocated) * 100 : 0;
    return {
      spent: categoryData.spent,
      allocated: categoryData.allocated,
      percentage
    };
  };

  // Delete a category
  const deleteCategory = async (category: CategoryType) => {
    if (!state.isAuthenticated || !state.hasUser || !state.currentPeriod) {
      console.warn('User not authenticated or no current period, skipping category deletion');
      return;
    }

    // Check if it's a core category
    if (CoreCategories.includes(category)) {
      throw new Error('Cannot delete core budget categories');
    }

    try {
      // Delete from database
      const { error } = await supabase
        .from('budget_categories')
        .delete()
        .eq('period_id', state.currentPeriod.id)
        .eq('category', category);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          categories: prev.budget.categories.filter(c => c.category !== category)
        }
      }));

      // Refresh to ensure consistency
      await refreshCurrentPeriod();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Repair budget math
  const repairBudgetMath = async () => {
    if (!state.isAuthenticated || !state.hasUser) {
      console.warn('User not authenticated, skipping budget repair');
      return;
    }

    try {
      console.log('🔧 Starting budget math repair...');
      await BudgetRepairService.recalculateSpentAmounts();
      // Refresh data after repair
      await refreshCurrentPeriod();
      console.log('✅ Budget math repair completed!');
    } catch (error) {
      console.error('❌ Budget repair failed:', error);
      throw error;
    }
  };

  // Financial calculations
  const financialSummary = useMemo(() => {
    return generateFinancialSummary(state.incomeSources, state.budget.categories, state.savingsGoals);
  }, [state.incomeSources, state.budget.categories, state.savingsGoals]);

  const financialHealth = useMemo(() => {
    // Calculate total budget allocation from all categories
    const totalBudgetAllocated = state.budget.categories.reduce((sum, cat) => sum + cat.allocated, 0);
    return calculateFinancialHealth(financialSummary, state.savingsGoals, totalBudgetAllocated);
  }, [financialSummary, state.savingsGoals, state.budget.categories]);

  const contextValue: BudgetContextType = {
    ...state,
    isLoading: state.authLoading || state.dataLoading, // Combined loading state
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateBudget,
    setCategoryFilter,
    getTotalSpent,
    getRemainingBudget,
    getCategorySpending,
    updateCategoryBudgets,
    deleteCategory,
    setIncomeSources,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    setSavingsGoals,
    financialSummary,
    financialHealth,
    refreshCurrentPeriod,
    loadHistoricalPeriod,
    repairBudgetMath,
    signIn,
    signUp,
    signOut
  };

  return (
    <BudgetContext.Provider value={contextValue}>
      {children}
    </BudgetContext.Provider>
  );
};

export default BudgetProvider;