export type CategoryType =
  | 'groceries'
  | 'housing'
  | 'transportation'
  | 'shopping'
  | 'entertainment'
  | 'dining'
  | 'utilities'
  | 'debt-payments'
  | 'credit-cards'
  | 'giving-charity'
  | 'savings'
  | 'insurance'
  | 'medical'
  | 'education'
  | 'personal-care'
  | 'investments'
  | 'subscriptions'
  | 'miscellaneous'
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
  isCustom?: boolean;
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
  'debt-payments': '#DC2626',
  'credit-cards': '#7C2D12',
  'giving-charity': '#059669',
  savings: '#0D9488',
  insurance: '#1E40AF',
  medical: '#BE185D',
  education: '#7C3AED',
  'personal-care': '#EA580C',
  investments: '#065F46',
  subscriptions: '#4338CA',
  miscellaneous: '#9333EA',
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
  'debt-payments': '💳',
  'credit-cards': '💰',
  'giving-charity': '❤️',
  savings: '🏦',
  insurance: '🛡️',
  medical: '🏥',
  education: '📚',
  'personal-care': '✨',
  investments: '📈',
  subscriptions: '📱',
  miscellaneous: '📦',
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
  'debt-payments': 'Debt Payments',
  'credit-cards': 'Credit Cards',
  'giving-charity': 'Giving/Charity',
  savings: 'Savings',
  insurance: 'Insurance',
  medical: 'Medical',
  education: 'Education',
  'personal-care': 'Personal Care',
  investments: 'Investments',
  subscriptions: 'Subscriptions',
  miscellaneous: 'Miscellaneous',
  other: 'Other'
};

// Core Categories: Essential categories that auto-start for all users
export const CoreCategories: CategoryType[] = [
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

// Quick Add Suggestions: Lifestyle-dependent categories users can add as needed
export const QuickAddCategories: CategoryType[] = [
  'entertainment',
  'giving-charity',
  'savings',
  'education',
  'personal-care',
  'medical',
  'investments',
  'credit-cards',
  'other'
];

// Quick Add category descriptions for UI
export const QuickAddDescriptions: Partial<Record<CategoryType, string>> = {
  entertainment: 'Some users roll this into Dining/Shopping, others keep it separate.',
  'giving-charity': 'Important but optional — add when you want to track tithing/donations.',
  savings: 'Only relevant if user actively budgets toward goals.',
  education: 'Tuition/lessons aren\'t universal — quick add makes sense.',
  'personal-care': 'Haircuts, nails, gym — lifestyle-based.',
  medical: 'Some users prefer a dedicated bucket, others treat it as "Other."',
  investments: 'Only relevant for users actively funding brokerage/retirement accounts.',
  'credit-cards': 'Track credit card payments separate from debt payments.',
  miscellaneous: 'For expenses that don\'t fit other categories.',
  other: 'Keep this as a catch-all fallback.',
  // Core categories don't need descriptions as they're always available
  groceries: '',
  housing: '',
  transportation: '',
  utilities: '',
  dining: '',
  shopping: '',
  'debt-payments': '',
  insurance: ''
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
export type SavingsGoalCategoryInput = SavingsGoalCategory | undefined;

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

export interface BudgetVariance {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'over' | 'on-target';
}

export interface FinancialSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMonthlySavings: number;
  netCashFlow: number;
  disposableIncome: number;
  // Budget performance tracking
  totalBudgeted: number;
  budgetVariance: number;
  budgetVariancePercent: number;
  expectedCashFlow: number;
  actualCashFlow: number;
  cashFlowVariance: number;
  categoryVariances: BudgetVariance[];
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