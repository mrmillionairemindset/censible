import { BudgetPeriodService } from '../services/budgetPeriodService';
import { CoreCategories } from '../types';

/**
 * Utility function to ensure core categories are set up for the user
 * This can be called from the Dashboard or other components
 */
export const ensureCoreCategories = async (): Promise<void> => {
  try {
    console.log('🔧 Ensuring core categories are set up...');
    await BudgetPeriodService.ensureCoreCategories();
    console.log('✅ Core categories setup complete');
  } catch (error) {
    console.error('❌ Failed to ensure core categories:', error);
    throw error;
  }
};

/**
 * Check if core categories need to be set up
 */
export const needsCoreCategories = async (): Promise<boolean> => {
  try {
    const currentData = await BudgetPeriodService.getCurrentPeriod();
    if (!currentData) {
      return true; // No period exists, need setup
    }

    // Check if we have core categories
    const existingCategories = currentData.categories.map(cat => cat.category);
    const missingCore = CoreCategories.filter(core => !existingCategories.includes(core));

    return missingCore.length > 0;
  } catch (error) {
    console.error('Error checking if core categories are needed:', error);
    return true; // Assume they're needed if we can't check
  }
};