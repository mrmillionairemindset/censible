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