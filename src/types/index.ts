export type CategoryType =
  | 'groceries'
  | 'housing'
  | 'transportation'
  | 'shopping'
  | 'entertainment'
  | 'dining'
  | 'utilities'
  | 'other';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: CategoryType;
  date: Date;
  merchant?: string;
  receiptImage?: string;
  notes?: string;
}

export interface BudgetCategory {
  category: CategoryType;
  allocated: number;
  spent: number;
  color: string;
  icon: string;
}

export interface Budget {
  totalBudget: number;
  categories: BudgetCategory[];
  period: 'monthly' | 'weekly' | 'biweekly';
  startDate: Date;
}

export interface OCRResult {
  text: string;
  amount?: number;
  merchant?: string;
  date?: Date;
  confidence: number;
}

export interface SwipeAction {
  type: 'edit' | 'delete';
  transactionId: string;
}

export interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface ChartSegment {
  category: CategoryType;
  value: number;
  percentage: number;
  color: string;
  label: string;
}

export interface AppState {
  transactions: Transaction[];
  budget: Budget;
  selectedCategory?: CategoryType;
  isLoading: boolean;
  error?: string;
}

export const CategoryColors: Record<CategoryType, string> = {
  groceries: '#10B981',
  housing: '#8B5CF6',
  transportation: '#F59E0B',
  shopping: '#EC4899',
  entertainment: '#3B82F6',
  dining: '#EF4444',
  utilities: '#FACC15',
  other: '#6B7280'
};

export const CategoryIcons: Record<CategoryType, string> = {
  groceries: '🛒',
  housing: '🏠',
  transportation: '🚗',
  shopping: '🛍️',
  entertainment: '🎭',
  dining: '🍽️',
  utilities: '⚡',
  other: '📦'
};

export const CategoryLabels: Record<CategoryType, string> = {
  groceries: 'Groceries',
  housing: 'Housing',
  transportation: 'Transportation',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  dining: 'Dining',
  utilities: 'Utilities',
  other: 'Other'
};

// Income and Savings Types
export type IncomeFrequency = 'weekly' | 'bi-weekly' | 'monthly' | 'yearly' | 'one-time';

export interface IncomeSource {
  id: string;
  source: string;
  amount: number;
  frequency: IncomeFrequency;
  startDate: Date;
  isActive: boolean;
  category?: 'salary' | 'freelance' | 'investments' | 'business' | 'other';
  description?: string;
}

export type SavingsGoalCategory = 'emergency-fund' | 'vacation' | 'major-purchase' | 'retirement' | 'custom';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: SavingsGoalCategory;
  priority: number;
  description?: string;
  isActive: boolean;
}

export interface FinancialHealth {
  score: number; // 0-100
  incomeExpenseRatio: number;
  savingsRate: number; // percentage
  emergencyFundWeeks: number;
  recommendations: string[];
}

export interface FinancialSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMonthlySavings: number;
  netCashFlow: number;
  disposableIncome: number;
}

export const IncomeFrequencyLabels: Record<IncomeFrequency, string> = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  'one-time': 'One-time'
};

export const SavingsGoalCategoryLabels: Record<SavingsGoalCategory, string> = {
  'emergency-fund': 'Emergency Fund',
  vacation: 'Vacation',
  'major-purchase': 'Major Purchase',
  retirement: 'Retirement',
  custom: 'Custom'
};

export const SavingsGoalCategoryIcons: Record<SavingsGoalCategory, string> = {
  'emergency-fund': '🛡️',
  vacation: '✈️',
  'major-purchase': '🏡',
  retirement: '🏖️',
  custom: '🎯'
};