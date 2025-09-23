import { supabase } from '../lib/supabase';
import { IncomeSource } from '../types';

export interface DBIncomeSource {
  id: string;
  user_id: string;
  household_id?: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  category?: 'salary' | 'freelance' | 'investments' | 'business' | 'other';
  description?: string;
  is_active: boolean;
  start_date: string;
  created_at: string;
  updated_at: string;
}

// Check if table exists
export const checkIncomeSourcesTable = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('income_sources')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    return false;
  }
};

// Convert database record to app format
const dbToIncomeSource = (dbRecord: DBIncomeSource): IncomeSource => ({
  id: dbRecord.id,
  source: dbRecord.name,
  amount: Number(dbRecord.amount),
  frequency: dbRecord.frequency as any,
  startDate: new Date(dbRecord.start_date),
  isActive: dbRecord.is_active,
  category: dbRecord.category,
  description: dbRecord.description
});

// Convert app format to database format
const incomeSourceToDb = (incomeSource: Partial<IncomeSource>, userId: string, householdId?: string): Partial<DBIncomeSource> => ({
  user_id: userId,
  household_id: householdId,
  name: incomeSource.source,
  amount: incomeSource.amount,
  frequency: incomeSource.frequency,
  category: incomeSource.category,
  description: incomeSource.description,
  is_active: incomeSource.isActive ?? true,
  start_date: incomeSource.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
});

export class IncomeSourceService {
  // Initialize the service by checking if table exists
  static async initialize() {
    try {
      const tableExists = await checkIncomeSourcesTable();
      if (!tableExists) {
        console.warn('Income sources table does not exist. Please run database migrations.');
      }
      return tableExists;
    } catch (error) {
      console.error('Failed to initialize IncomeSourceService:', error);
      return false;
    }
  }

  // Get all income sources for a user
  static async getIncomeSources(userId?: string, householdId?: string): Promise<IncomeSource[]> {
    try {
      const tableExists = await this.initialize(); // Check if table exists
      if (!tableExists) {
        console.warn('Income sources table not available, falling back to localStorage');
        return [];
      }

      let query = supabase
        .from('income_sources')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (householdId) {
        query = query.eq('household_id', householdId);
      } else if (userId) {
        query = query.eq('user_id', userId).is('household_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(dbToIncomeSource);
    } catch (error) {
      console.error('Error fetching income sources:', error);
      return [];
    }
  }

  // Create a new income source
  static async createIncomeSource(incomeSource: Omit<IncomeSource, 'id'>, userId: string, householdId?: string): Promise<IncomeSource> {
    const tableExists = await this.initialize(); // Check if table exists
    if (!tableExists) {
      throw new Error('Income sources table not available');
    }

    const dbData = incomeSourceToDb(incomeSource, userId, householdId);

    const { data, error } = await supabase
      .from('income_sources')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    return dbToIncomeSource(data);
  }

  // Update an income source
  static async updateIncomeSource(id: string, updates: Partial<IncomeSource>): Promise<IncomeSource> {
    const dbUpdates: Partial<DBIncomeSource> = {};

    if (updates.source !== undefined) dbUpdates.name = updates.source;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('income_sources')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return dbToIncomeSource(data);
  }

  // Delete an income source
  static async deleteIncomeSource(id: string): Promise<void> {
    const { error } = await supabase
      .from('income_sources')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Get monthly equivalent for different frequencies
  static getMonthlyEquivalent(amount: number, frequency: string): number {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'bi-weekly': return amount * 2.17;
      case 'monthly': return amount;
      case 'quarterly': return amount / 3;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  }

  // Migrate from localStorage to database
  static async migrateFromLocalStorage(userId: string, householdId?: string): Promise<void> {
    try {
      // Get data from localStorage
      const storageKey = householdId ? `centsible_income_${householdId}` : 'centsible_income_sources';
      const localData = localStorage.getItem(storageKey);

      if (!localData) return;

      const incomeSources: IncomeSource[] = JSON.parse(localData);

      // Check if we already have data in the database
      const existingData = await this.getIncomeSources(userId, householdId);
      if (existingData.length > 0) {
        console.log('Income sources already exist in database, skipping migration');
        return;
      }

      // Migrate each income source
      for (const incomeSource of incomeSources) {
        await this.createIncomeSource(incomeSource, userId, householdId);
      }

      console.log(`Migrated ${incomeSources.length} income sources to database`);
    } catch (error) {
      console.error('Error migrating income sources from localStorage:', error);
    }
  }
}