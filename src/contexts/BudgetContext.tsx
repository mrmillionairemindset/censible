import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Transaction, Budget, CategoryType, BudgetCategory, CategoryColors, CategoryIcons } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface BudgetState {
  transactions: Transaction[];
  budget: Budget;
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
  | { type: 'UPDATE_CATEGORY_SPENT'; payload: { category: CategoryType; amount: number } };

const defaultCategories: BudgetCategory[] = [
  { category: 'groceries', allocated: 500, spent: 0, color: CategoryColors.groceries, icon: CategoryIcons.groceries },
  { category: 'housing', allocated: 1200, spent: 0, color: CategoryColors.housing, icon: CategoryIcons.housing },
  { category: 'transportation', allocated: 200, spent: 0, color: CategoryColors.transportation, icon: CategoryIcons.transportation },
  { category: 'shopping', allocated: 300, spent: 0, color: CategoryColors.shopping, icon: CategoryIcons.shopping },
  { category: 'entertainment', allocated: 150, spent: 0, color: CategoryColors.entertainment, icon: CategoryIcons.entertainment },
  { category: 'dining', allocated: 250, spent: 0, color: CategoryColors.dining, icon: CategoryIcons.dining },
  { category: 'utilities', allocated: 180, spent: 0, color: CategoryColors.utilities, icon: CategoryIcons.utilities },
  { category: 'other', allocated: 220, spent: 0, color: CategoryColors.other, icon: CategoryIcons.other },
];

const initialState: BudgetState = {
  transactions: [],
  budget: {
    totalBudget: 3000,
    categories: defaultCategories,
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  },
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

      const updatedCategories = state.budget.categories.map(cat => {
        if (cat.category === newTransaction.category) {
          return { ...cat, spent: cat.spent + newTransaction.amount };
        }
        return cat;
      });

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
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const savedTransactions = localStorage.getItem('centsible_transactions');
        const savedBudget = localStorage.getItem('centsible_budget');

        // Load budget first
        if (savedBudget) {
          const budget = JSON.parse(savedBudget);
          budget.startDate = new Date(budget.startDate);
          dispatch({ type: 'UPDATE_BUDGET', payload: budget });
        }

        // Load transactions and recalculate spent amounts
        if (savedTransactions) {
          const transactions = JSON.parse(savedTransactions).map((t: any) => ({
            ...t,
            date: new Date(t.date),
          }));

          // First, reset all category spent amounts to 0
          defaultCategories.forEach(cat => {
            dispatch({ type: 'UPDATE_CATEGORY_SPENT', payload: { category: cat.category, amount: 0 } });
          });

          // Then recalculate spent amounts from transactions
          const spentByCategory: Record<string, number> = {};
          transactions.forEach((t: Transaction) => {
            spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
          });

          // Update each category's spent amount
          Object.entries(spentByCategory).forEach(([category, amount]) => {
            dispatch({ type: 'UPDATE_CATEGORY_SPENT', payload: { category: category as CategoryType, amount } });
          });

          // Set transactions last
          dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!state.isLoading) {
      try {
        localStorage.setItem('centsible_transactions', JSON.stringify(state.transactions));
        localStorage.setItem('centsible_budget', JSON.stringify(state.budget));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [state.transactions, state.budget, state.isLoading]);

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
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};