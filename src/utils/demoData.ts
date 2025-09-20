import { Transaction, CategoryType, IncomeSource, SavingsGoal } from '../types';
import { v4 as uuidv4 } from 'uuid';

const demoTransactions: Omit<Transaction, 'id'>[] = [
  // Today
  {
    amount: 67.43,
    description: 'Weekly Groceries',
    category: 'groceries',
    date: new Date(),
    merchant: 'Walmart Supercenter',
  },
  {
    amount: 4.85,
    description: 'Morning Coffee',
    category: 'dining',
    date: new Date(),
    merchant: 'Starbucks',
  },

  // Yesterday
  {
    amount: 89.99,
    description: 'Gym Membership',
    category: 'entertainment',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    merchant: 'Planet Fitness',
  },
  {
    amount: 12.50,
    description: 'Lunch',
    category: 'dining',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    merchant: 'Chipotle Mexican Grill',
  },

  // 2 days ago
  {
    amount: 156.78,
    description: 'Electricity Bill',
    category: 'utilities',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    merchant: 'ConEd',
  },
  {
    amount: 23.45,
    description: 'Gas Station',
    category: 'transportation',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    merchant: 'Shell',
  },

  // 3 days ago
  {
    amount: 299.99,
    description: 'Wireless Headphones',
    category: 'shopping',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    merchant: 'Best Buy',
  },
  {
    amount: 8.99,
    description: 'Netflix Subscription',
    category: 'entertainment',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    merchant: 'Netflix',
  },

  // 4 days ago
  {
    amount: 45.67,
    description: 'Grocery Run',
    category: 'groceries',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    merchant: 'Trader Joes',
  },
  {
    amount: 75.00,
    description: 'Internet Bill',
    category: 'utilities',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    merchant: 'Comcast Xfinity',
  },

  // 5 days ago
  {
    amount: 1850.00,
    description: 'Monthly Rent',
    category: 'housing',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    merchant: 'Property Management',
    notes: 'Monthly rent payment',
  },
  {
    amount: 32.18,
    description: 'Dinner Date',
    category: 'dining',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    merchant: 'Olive Garden',
  },

  // 6 days ago
  {
    amount: 15.99,
    description: 'Spotify Premium',
    category: 'entertainment',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    merchant: 'Spotify',
  },
  {
    amount: 124.56,
    description: 'Clothing Shopping',
    category: 'shopping',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    merchant: 'Target',
  },

  // 7 days ago
  {
    amount: 87.23,
    description: 'Weekly Groceries',
    category: 'groceries',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    merchant: 'Whole Foods Market',
  },

  // Big grocery expense to show overspending
  {
    amount: 450.50,
    description: 'Big Grocery Shopping',
    category: 'groceries',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    merchant: 'Walmart',
  },
  {
    amount: 18.75,
    description: 'Fast Food',
    category: 'dining',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    merchant: 'McDonalds',
  },
];

// Demo income sources
const demoIncomeSources: IncomeSource[] = [
  {
    id: uuidv4(),
    source: 'Primary Job',
    amount: 4500,
    frequency: 'monthly',
    startDate: new Date(2024, 0, 1), // January 1, 2024
    isActive: true,
    category: 'salary'
  },
  {
    id: uuidv4(),
    source: 'Freelance Work',
    amount: 800,
    frequency: 'monthly',
    startDate: new Date(2024, 2, 1), // March 1, 2024
    isActive: true,
    category: 'freelance'
  }
];

// Demo savings goals
const demoSavingsGoals: SavingsGoal[] = [
  {
    id: uuidv4(),
    name: 'Emergency Fund',
    targetAmount: 15000,
    currentAmount: 3500,
    targetDate: new Date(2024, 11, 31), // December 31, 2024
    category: 'emergency-fund',
    priority: 1,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Vacation Fund',
    targetAmount: 5000,
    currentAmount: 1200,
    targetDate: new Date(2024, 6, 15), // July 15, 2024
    category: 'vacation',
    priority: 2,
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'Car Down Payment',
    targetAmount: 8000,
    currentAmount: 2500,
    targetDate: new Date(2024, 9, 1), // October 1, 2024
    category: 'major-purchase',
    priority: 3,
    isActive: true
  }
];

export function generateDemoData() {
  // Create transactions with IDs
  const transactions: Transaction[] = demoTransactions.map(t => ({
    ...t,
    id: uuidv4(),
  }));

  // Save to localStorage (global keys for migration)
  localStorage.setItem('centsible_transactions', JSON.stringify(transactions));
  localStorage.setItem('centsible_income', JSON.stringify(demoIncomeSources));
  localStorage.setItem('centsible_savings_goals', JSON.stringify(demoSavingsGoals));

  console.log('✅ Demo data generated successfully!');
  console.log(`📊 Created ${transactions.length} sample transactions`);
  console.log(`💵 Created ${demoIncomeSources.length} income sources`);
  console.log(`🎯 Created ${demoSavingsGoals.length} savings goals`);

  return { transactions, incomeSources: demoIncomeSources, savingsGoals: demoSavingsGoals };
}

export function clearDemoData() {
  localStorage.removeItem('centsible_transactions');
  localStorage.removeItem('centsible_budget');
  console.log('🗑️ Demo data cleared');
}

export function addRandomTransaction() {
  const categories: CategoryType[] = ['groceries', 'dining', 'shopping', 'entertainment', 'transportation'];
  const merchants = [
    'Target', 'Walmart', 'Amazon', 'Starbucks', 'McDonalds',
    'Shell', 'Chipotle', 'Netflix', 'Spotify', 'Uber'
  ];

  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
  const randomAmount = Math.round((Math.random() * 200 + 5) * 100) / 100;

  const newTransaction: Transaction = {
    id: uuidv4(),
    amount: randomAmount,
    description: `Purchase at ${randomMerchant}`,
    category: randomCategory,
    date: new Date(),
    merchant: randomMerchant,
  };

  // Get existing transactions
  const existing = localStorage.getItem('centsible_transactions');
  const transactions = existing ? JSON.parse(existing) : [];

  // Add new transaction
  transactions.unshift(newTransaction);

  // Save back to localStorage
  localStorage.setItem('centsible_transactions', JSON.stringify(transactions));

  console.log('➕ Added random transaction:', newTransaction);
  return newTransaction;
}