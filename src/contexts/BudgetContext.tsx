import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useState } from 'react';
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
  FinancialSummary
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  generateFinancialSummary,
  calculateFinancialHealth
} from '../utils/financialCalculations';
import { UserStorage } from '../utils/userStorage';

interface BudgetState {
  transactions: Transaction[];
  budget: Budget;
  incomeSources: IncomeSource[];
  savingsGoals: SavingsGoal[];
  selectedCategory?: CategoryType;
  isLoading: boolean;
  error?: string;
}

type BudgetAction =
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'UPDATE_BUDGET'; payload: Partial<Budget> }
  | { type: 'SET_CATEGORY_FILTER'; payload: CategoryType | undefined }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'UPDATE_CATEGORY_SPENT'; payload: { category: CategoryType; amount: number } }
  | { type: 'UPDATE_CATEGORY_BUDGETS'; payload: { categories: BudgetCategory[]; totalBudget: number } }
  | { type: 'SET_INCOME_SOURCES'; payload: IncomeSource[] }
  | { type: 'SET_SAVINGS_GOALS'; payload: SavingsGoal[] };

const defaultCategories: BudgetCategory[] = [
  { category: 'groceries', allocated: 0, spent: 0, color: CategoryColors.groceries, icon: CategoryIcons.groceries },
  { category: 'housing', allocated: 0, spent: 0, color: CategoryColors.housing, icon: CategoryIcons.housing },
  { category: 'transportation', allocated: 0, spent: 0, color: CategoryColors.transportation, icon: CategoryIcons.transportation },
  { category: 'shopping', allocated: 0, spent: 0, color: CategoryColors.shopping, icon: CategoryIcons.shopping },
  { category: 'entertainment', allocated: 0, spent: 0, color: CategoryColors.entertainment, icon: CategoryIcons.entertainment },
  { category: 'dining', allocated: 0, spent: 0, color: CategoryColors.dining, icon: CategoryIcons.dining },
  { category: 'utilities', allocated: 0, spent: 0, color: CategoryColors.utilities, icon: CategoryIcons.utilities },
  { category: 'debt-payments', allocated: 0, spent: 0, color: CategoryColors['debt-payments'], icon: CategoryIcons['debt-payments'] },
  { category: 'credit-cards', allocated: 0, spent: 0, color: CategoryColors['credit-cards'], icon: CategoryIcons['credit-cards'] },
  { category: 'giving-charity', allocated: 0, spent: 0, color: CategoryColors['giving-charity'], icon: CategoryIcons['giving-charity'] },
  { category: 'savings', allocated: 0, spent: 0, color: CategoryColors.savings, icon: CategoryIcons.savings },
  { category: 'insurance', allocated: 0, spent: 0, color: CategoryColors.insurance, icon: CategoryIcons.insurance },
  { category: 'medical', allocated: 0, spent: 0, color: CategoryColors.medical, icon: CategoryIcons.medical },
  { category: 'education', allocated: 0, spent: 0, color: CategoryColors.education, icon: CategoryIcons.education },
  { category: 'personal-care', allocated: 0, spent: 0, color: CategoryColors['personal-care'], icon: CategoryIcons['personal-care'] },
  { category: 'investments', allocated: 0, spent: 0, color: CategoryColors.investments, icon: CategoryIcons.investments },
  { category: 'subscriptions', allocated: 0, spent: 0, color: CategoryColors.subscriptions, icon: CategoryIcons.subscriptions },
  { category: 'other', allocated: 0, spent: 0, color: CategoryColors.other, icon: CategoryIcons.other },
];

const initialState: BudgetState = {
  transactions: [],
  budget: {
    totalBudget: 0,
    categories: defaultCategories,
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  },
  incomeSources: [],
  savingsGoals: [],
  selectedCategory: undefined,
  isLoading: false,
  error: undefined,
};

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const newTransaction: Transaction = {
        ...action.payload,
        id: uuidv4(),
      };

      console.log('🔄 ADD_TRANSACTION:', {
        transaction: newTransaction,
        currentCategories: state.budget.categories,
        currentTotalSpent: state.budget.categories.reduce((sum, cat) => sum + cat.spent, 0)
      });

      const updatedCategories = state.budget.categories.map(cat => {
        console.log(`🔍 Checking category: "${cat.category}" vs transaction category: "${newTransaction.category}"`);
        if (cat.category === newTransaction.category) {
          const newSpent = cat.spent + newTransaction.amount;
          console.log(`💰 MATCH! Updating ${cat.category}: ${cat.spent} → ${newSpent} (+${newTransaction.amount})`);
          return { ...cat, spent: newSpent };
        }
        return cat;
      });

      const newTotalSpent = updatedCategories.reduce((sum, cat) => sum + cat.spent, 0);
      console.log(`📊 Total spent after transaction: ${newTotalSpent}`);

      return {
        ...state,
        transactions: [newTransaction, ...state.transactions],
        budget: { ...state.budget, categories: updatedCategories },
      };
    }

    case 'UPDATE_TRANSACTION': {
      const oldTransaction = state.transactions.find(t => t.id === action.payload.id);
      const updatedTransactions = state.transactions.map(t =>
        t.id === action.payload.id ? action.payload : t
      );

      let updatedCategories = [...state.budget.categories];

      if (oldTransaction) {
        updatedCategories = updatedCategories.map(cat => {
          if (cat.category === oldTransaction.category) {
            return { ...cat, spent: Math.max(0, cat.spent - oldTransaction.amount) };
          }
          return cat;
        });
      }

      updatedCategories = updatedCategories.map(cat => {
        if (cat.category === action.payload.category) {
          return { ...cat, spent: cat.spent + action.payload.amount };
        }
        return cat;
      });

      return {
        ...state,
        transactions: updatedTransactions,
        budget: { ...state.budget, categories: updatedCategories },
      };
    }

    case 'DELETE_TRANSACTION': {
      const transactionToDelete = state.transactions.find(t => t.id === action.payload);
      const filteredTransactions = state.transactions.filter(t => t.id !== action.payload);

      let updatedCategories = [...state.budget.categories];

      if (transactionToDelete) {
        updatedCategories = updatedCategories.map(cat => {
          if (cat.category === transactionToDelete.category) {
            return { ...cat, spent: Math.max(0, cat.spent - transactionToDelete.amount) };
          }
          return cat;
        });
      }

      return {
        ...state,
        transactions: filteredTransactions,
        budget: { ...state.budget, categories: updatedCategories },
      };
    }

    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'UPDATE_BUDGET':
      return { ...state, budget: { ...state.budget, ...action.payload } };

    case 'SET_CATEGORY_FILTER':
      return { ...state, selectedCategory: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'UPDATE_CATEGORY_SPENT':
      const updatedCategories = state.budget.categories.map(cat => {
        if (cat.category === action.payload.category) {
          return { ...cat, spent: action.payload.amount };
        }
        return cat;
      });
      return {
        ...state,
        budget: { ...state.budget, categories: updatedCategories },
      };

    case 'UPDATE_CATEGORY_BUDGETS': {
      const { categories, totalBudget } = action.payload;

      const updatedBudget = {
        ...state.budget,
        categories,
        totalBudget,
      };

      return {
        ...state,
        budget: updatedBudget,
      };
    }

    case 'SET_INCOME_SOURCES':
      return { ...state, incomeSources: action.payload };

    case 'SET_SAVINGS_GOALS':
      return { ...state, savingsGoals: action.payload };

    default:
      return state;
  }
}

interface BudgetContextType extends BudgetState {
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (budget: Partial<Budget>) => void;
  setCategoryFilter: (category: CategoryType | undefined) => void;
  getTotalSpent: () => number;
  getRemainingBudget: () => number;
  getCategorySpending: (category: CategoryType) => { spent: number; allocated: number; percentage: number };
  updateCategoryBudgets: (categories: BudgetCategory[], totalBudget: number) => void;
  setIncomeSources: (sources: IncomeSource[]) => void;
  setSavingsGoals: (goals: SavingsGoal[]) => void;
  financialSummary: FinancialSummary;
  financialHealth: FinancialHealth;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

interface BudgetProviderProps {
  children: ReactNode;
  userId: string;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children, userId }) => {
  const timestamp = new Date().toISOString();
  console.log(`🏠 [${timestamp}] === BUDGET PROVIDER START for user ${userId} ===`);
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const userStorage = useMemo(() => new UserStorage(userId), [userId]);

  // Component lifecycle logging
  useEffect(() => {
    console.log('🔧 BudgetProvider mounted for userId:', userId);
    return () => {
      console.log('🔧 BudgetProvider unmounting for userId:', userId);
    };
  }, [userId]);

  // Load data from user-specific storage on mount and perform migration
  useEffect(() => {
    console.log('🔧 useEffect triggered with userId:', userId);
    console.log('🔧 Current state:', state);
    console.log('🔧 hasLoadedData:', hasLoadedData);
    const loadData = () => {
      console.log('🔄 Loading data for userId:', userId);
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Perform migration from global to user-specific data
        UserStorage.migrateGlobalData(userId);

        // Load saved budget (but we'll recalculate spent amounts from transactions)
        const savedBudget = userStorage.getBudget();
        console.log('💰 Loading saved budget:', savedBudget);

        // Load transactions first to calculate accurate spent amounts
        const savedTransactions = userStorage.getTransactions();
        console.log('💳 Loaded transactions:', savedTransactions);

        // Calculate spent amounts from transactions
        const spentByCategory: Record<string, number> = {};
        if (savedTransactions) {
          savedTransactions.forEach((t: Transaction) => {
            spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
          });
        }

        // Color palette for custom categories (same as BudgetSettings)
        const colorPalette = [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1',
          '#06B6D4', '#A855F7', '#D946EF', '#F43F5E', '#22C55E',
          '#FACC15', '#FB923C', '#8B5CF6', '#6B7280', '#4B5563'
        ];

        // Function to assign unique colors to categories without proper colors
        const ensureCategoryColors = (categories: BudgetCategory[]): BudgetCategory[] => {
          const usedColors = new Set<string>();

          return categories.map(cat => {
            // If category already has a valid color (not gray), keep it
            if (cat.color && cat.color !== '#6B7280' && !usedColors.has(cat.color)) {
              usedColors.add(cat.color);
              return cat;
            }

            // Find a unique color for this category
            let hash = 0;
            const categoryName = cat.category;
            for (let i = 0; i < categoryName.length; i++) {
              const char = categoryName.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
            }

            const index = Math.abs(hash) % colorPalette.length;
            let color = colorPalette[index];
            let colorIndex = index;

            // Find next available color if this one is taken
            while (usedColors.has(color) && colorIndex < colorPalette.length * 2) {
              colorIndex = (colorIndex + 1) % colorPalette.length;
              color = colorPalette[colorIndex];
            }

            usedColors.add(color);
            return { ...cat, color };
          });
        };

        // Update budget with correct spent amounts
        if (savedBudget) {
          // Reset spent amounts to calculated values from transactions and ensure colors
          const categoriesWithCorrectSpent = savedBudget.categories.map(cat => ({
            ...cat,
            spent: spentByCategory[cat.category] || 0
          }));

          const categoriesWithColors = ensureCategoryColors(categoriesWithCorrectSpent);

          dispatch({ type: 'UPDATE_BUDGET', payload: {
            ...savedBudget,
            categories: categoriesWithColors
          }});
        } else {
          // No saved budget, just update spent amounts for default categories
          defaultCategories.forEach(cat => {
            dispatch({ type: 'UPDATE_CATEGORY_SPENT', payload: {
              category: cat.category,
              amount: spentByCategory[cat.category] || 0
            }});
          });
        }

        // Set transactions
        if (savedTransactions) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: savedTransactions });
        }

        // Load income sources
        const savedIncome = userStorage.getIncomeSources();
        console.log('💵 Loaded income sources:', savedIncome);
        console.log('💵 Raw localStorage income data:', localStorage.getItem(`centsible_${userId}_income`));
        if (savedIncome) {
          // Map to ensure dates are Date objects
          const income = savedIncome.map((source: any) => ({
            ...source,
            startDate: new Date(source.startDate)
          }));
          console.log('💵 Processed income for dispatch:', income);
          dispatch({ type: 'SET_INCOME_SOURCES', payload: income });
        } else {
          console.log('💵 No saved income found, starting with empty array');
        }

        // Load savings goals
        const savedGoals = userStorage.getSavingsGoals();
        console.log('🎯 Loaded savings goals:', savedGoals);
        if (savedGoals) {
          // Map to ensure dates are Date objects
          const goals = savedGoals.map((goal: any) => ({
            ...goal,
            targetDate: new Date(goal.targetDate)
          }));
          dispatch({ type: 'SET_SAVINGS_GOALS', payload: goals });
        }

      } catch (error) {
        console.error('Error loading user data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        setHasLoadedData(true);
      }
    };

    console.log('🔧 About to call loadData()');
    loadData();
    console.log('🔧 loadData() completed');
  }, [userId, userStorage]);

  // Save to user-specific storage whenever state changes
  useEffect(() => {
    if (!state.isLoading && userId && hasLoadedData) {
      try {
        userStorage.setTransactions(state.transactions);
        userStorage.setBudget(state.budget);
        userStorage.setIncomeSources(state.incomeSources);
        userStorage.setSavingsGoals(state.savingsGoals);
        console.log('💾 Saved user data to storage');
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    }
  }, [state.transactions, state.budget, state.incomeSources, state.savingsGoals, state.isLoading, userId, userStorage, hasLoadedData]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  };

  const updateTransaction = (transaction: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
  };

  const deleteTransaction = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  };

  const updateBudget = (budget: Partial<Budget>) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: budget });
  };

  const setCategoryFilter = (category: CategoryType | undefined) => {
    dispatch({ type: 'SET_CATEGORY_FILTER', payload: category });
  };

  const getTotalSpent = () => {
    return state.budget.categories.reduce((total, cat) => total + cat.spent, 0);
  };

  const getRemainingBudget = () => {
    return state.budget.totalBudget - getTotalSpent();
  };

  const getCategorySpending = (category: CategoryType) => {
    const cat = state.budget.categories.find(c => c.category === category);
    if (!cat) return { spent: 0, allocated: 0, percentage: 0 };

    const percentage = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
    return { spent: cat.spent, allocated: cat.allocated, percentage };
  };

  const updateCategoryBudgets = (categories: BudgetCategory[], totalBudget: number) => {
    dispatch({ type: 'UPDATE_CATEGORY_BUDGETS', payload: { categories, totalBudget } });
  };

  const setIncomeSources = (sources: IncomeSource[]) => {
    console.log('🔧 setIncomeSources called with:', sources);
    console.log('🔧 userId:', userId);
    dispatch({ type: 'SET_INCOME_SOURCES', payload: sources });
    // Save to user-specific storage
    if (userId) {
      console.log('🔧 Saving income sources to storage...');
      userStorage.setIncomeSources(sources);
      console.log('🔧 Income sources saved successfully');
    } else {
      console.warn('⚠️ No userId available, cannot save income sources');
    }
  };

  const setSavingsGoals = (goals: SavingsGoal[]) => {
    dispatch({ type: 'SET_SAVINGS_GOALS', payload: goals });
    // Save to user-specific storage
    if (userId) {
      userStorage.setSavingsGoals(goals);
    }
  };

  // Calculate financial summary and health
  const financialSummary = useMemo(() => {
    console.log('🔍 Financial Summary Calculation:', {
      userId,
      incomeSources: state.incomeSources,
      budgetCategories: state.budget.categories,
      savingsGoals: state.savingsGoals,
      transactions: state.transactions
    });

    const summary = generateFinancialSummary(state.incomeSources, state.budget.categories, state.savingsGoals);
    console.log('📊 Calculated Summary:', summary);
    return summary;
  }, [state.incomeSources, state.budget.categories, state.savingsGoals, state.transactions, userId]);

  const financialHealth = useMemo(() => {
    const health = calculateFinancialHealth(financialSummary, state.savingsGoals);
    console.log('💚 Financial Health Score:', health);
    return health;
  }, [financialSummary, state.savingsGoals]);

  const value: BudgetContextType = {
    ...state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateBudget,
    setCategoryFilter,
    getTotalSpent,
    getRemainingBudget,
    getCategorySpending,
    updateCategoryBudgets,
    setIncomeSources,
    setSavingsGoals,
    financialSummary,
    financialHealth,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};