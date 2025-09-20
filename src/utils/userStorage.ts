import { Transaction, Budget, IncomeSource, SavingsGoal } from '../types';

export class UserStorage {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private getKey(dataType: string): string {
    return `centsible_${this.userId}_${dataType}`;
  }

  // Get user-specific data
  getTransactions(): Transaction[] | null {
    const data = localStorage.getItem(this.getKey('transactions'));
    if (!data) return null;

    try {
      return JSON.parse(data).map((t: any) => ({
        ...t,
        date: new Date(t.date),
      }));
    } catch (error) {
      console.error('Error parsing transactions:', error);
      return null;
    }
  }

  getBudget(): Budget | null {
    const data = localStorage.getItem(this.getKey('budget'));
    if (!data) return null;

    try {
      const budget = JSON.parse(data);
      return {
        ...budget,
        startDate: new Date(budget.startDate),
      };
    } catch (error) {
      console.error('Error parsing budget:', error);
      return null;
    }
  }

  getIncomeSources(): IncomeSource[] | null {
    const data = localStorage.getItem(this.getKey('income'));
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing income sources:', error);
      return null;
    }
  }

  getSavingsGoals(): SavingsGoal[] | null {
    const data = localStorage.getItem(this.getKey('savings_goals'));
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing savings goals:', error);
      return null;
    }
  }

  // Save user-specific data
  setTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(this.getKey('transactions'), JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  setBudget(budget: Budget): void {
    try {
      localStorage.setItem(this.getKey('budget'), JSON.stringify(budget));
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  }

  setIncomeSources(incomeSources: IncomeSource[]): void {
    try {
      localStorage.setItem(this.getKey('income'), JSON.stringify(incomeSources));
    } catch (error) {
      console.error('Error saving income sources:', error);
    }
  }

  setSavingsGoals(savingsGoals: SavingsGoal[]): void {
    try {
      localStorage.setItem(this.getKey('savings_goals'), JSON.stringify(savingsGoals));
    } catch (error) {
      console.error('Error saving savings goals:', error);
    }
  }

  // Migration: Move global data to user-specific data
  static migrateGlobalData(userId: string): void {
    const userStorage = new UserStorage(userId);

    // Check if user already has data
    if (userStorage.getTransactions() !== null) {
      console.log('User already has data, skipping migration');
      return;
    }

    console.log('Migrating global data to user-specific storage...');

    // Migrate transactions
    const globalTransactions = localStorage.getItem('centsible_transactions');
    if (globalTransactions) {
      try {
        const transactions = JSON.parse(globalTransactions).map((t: any) => ({
          ...t,
          date: new Date(t.date),
        }));
        userStorage.setTransactions(transactions);
        console.log(`Migrated ${transactions.length} transactions`);
      } catch (error) {
        console.error('Error migrating transactions:', error);
      }
    }

    // Migrate budget
    const globalBudget = localStorage.getItem('centsible_budget');
    if (globalBudget) {
      try {
        const budget = JSON.parse(globalBudget);
        budget.startDate = new Date(budget.startDate);
        userStorage.setBudget(budget);
        console.log('Migrated budget data');
      } catch (error) {
        console.error('Error migrating budget:', error);
      }
    }

    // Migrate income sources
    const globalIncome = localStorage.getItem('centsible_income');
    if (globalIncome) {
      try {
        const incomeSources = JSON.parse(globalIncome);
        userStorage.setIncomeSources(incomeSources);
        console.log(`Migrated ${incomeSources.length} income sources`);
      } catch (error) {
        console.error('Error migrating income sources:', error);
      }
    }

    // Migrate savings goals
    const globalGoals = localStorage.getItem('centsible_savings_goals');
    if (globalGoals) {
      try {
        const savingsGoals = JSON.parse(globalGoals);
        userStorage.setSavingsGoals(savingsGoals);
        console.log(`Migrated ${savingsGoals.length} savings goals`);
      } catch (error) {
        console.error('Error migrating savings goals:', error);
      }
    }

    console.log('Migration completed');
  }

  // Clean up global data after migration (optional)
  static cleanupGlobalData(): void {
    localStorage.removeItem('centsible_transactions');
    localStorage.removeItem('centsible_budget');
    localStorage.removeItem('centsible_income');
    localStorage.removeItem('centsible_savings_goals');
    console.log('Cleaned up global data');
  }
}