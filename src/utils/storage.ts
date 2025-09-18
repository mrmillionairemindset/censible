import { Transaction, Budget } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'centsible_transactions',
  BUDGET: 'centsible_budget',
  PREFERENCES: 'centsible_preferences',
  LAST_SYNC: 'centsible_last_sync',
};

export interface StoragePreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  notifications: boolean;
  hapticFeedback: boolean;
}

const DEFAULT_PREFERENCES: StoragePreferences = {
  theme: 'system',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  notifications: true,
  hapticFeedback: true,
};

class StorageManager {
  private isSupported(): boolean {
    try {
      const test = '__centsible_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private serializeData<T>(data: T): string {
    return JSON.stringify(data, (_, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
  }

  private deserializeData<T>(json: string): T {
    return JSON.parse(json, (_, value) => {
      if (value && value.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    });
  }

  saveTransactions(transactions: Transaction[]): boolean {
    if (!this.isSupported()) return false;

    try {
      const serialized = this.serializeData(transactions);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, serialized);
      this.updateLastSync();
      return true;
    } catch (error) {
      console.error('Failed to save transactions:', error);
      return false;
    }
  }

  loadTransactions(): Transaction[] {
    if (!this.isSupported()) return [];

    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return [];
      return this.deserializeData<Transaction[]>(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    }
  }

  saveBudget(budget: Budget): boolean {
    if (!this.isSupported()) return false;

    try {
      const serialized = this.serializeData(budget);
      localStorage.setItem(STORAGE_KEYS.BUDGET, serialized);
      this.updateLastSync();
      return true;
    } catch (error) {
      console.error('Failed to save budget:', error);
      return false;
    }
  }

  loadBudget(): Budget | null {
    if (!this.isSupported()) return null;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (!data) return null;
      return this.deserializeData<Budget>(data);
    } catch (error) {
      console.error('Failed to load budget:', error);
      return null;
    }
  }

  savePreferences(preferences: Partial<StoragePreferences>): boolean {
    if (!this.isSupported()) return false;

    try {
      const current = this.loadPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    }
  }

  loadPreferences(): StoragePreferences {
    if (!this.isSupported()) return DEFAULT_PREFERENCES;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!data) return DEFAULT_PREFERENCES;
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(data) };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  private updateLastSync(): void {
    if (this.isSupported()) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    }
  }

  getLastSync(): Date | null {
    if (!this.isSupported()) return null;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? new Date(data) : null;
    } catch {
      return null;
    }
  }

  exportData(): string | null {
    if (!this.isSupported()) return null;

    try {
      const transactions = this.loadTransactions();
      const budget = this.loadBudget();
      const preferences = this.loadPreferences();

      return this.serializeData({
        version: '1.0.0',
        exportDate: new Date(),
        data: {
          transactions,
          budget,
          preferences,
        },
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  importData(jsonData: string): boolean {
    if (!this.isSupported()) return false;

    try {
      const imported = this.deserializeData<any>(jsonData);

      if (imported.version !== '1.0.0') {
        console.error('Incompatible data version');
        return false;
      }

      if (imported.data.transactions) {
        this.saveTransactions(imported.data.transactions);
      }

      if (imported.data.budget) {
        this.saveBudget(imported.data.budget);
      }

      if (imported.data.preferences) {
        this.savePreferences(imported.data.preferences);
      }

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  clearAll(): boolean {
    if (!this.isSupported()) return false;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  getStorageSize(): number {
    if (!this.isSupported()) return 0;

    let size = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        size += item.length;
      }
    });

    return size;
  }
}

export const storage = new StorageManager();