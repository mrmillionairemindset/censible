import { IncomeSource, IncomeFrequency, SavingsGoal, FinancialHealth, FinancialSummary, BudgetCategory } from '../types';
import { toDateSafe, monthsBetween } from './dates';

// Convert any income frequency to monthly amount
export const convertToMonthly = (amount: number, frequency: IncomeFrequency): number => {
  switch (frequency) {
    case 'weekly': return amount * 4.33;
    case 'bi-weekly': return amount * 2.17;
    case 'yearly': return amount / 12;
    case 'one-time': return 0; // One-time doesn't count toward monthly
    case 'monthly':
    default: return amount;
  }
};

// Calculate total monthly income from all active sources
export const calculateTotalMonthlyIncome = (incomeSources: IncomeSource[]): number => {
  return incomeSources
    .filter(income => income.isActive)
    .reduce((total, income) => total + convertToMonthly(income.amount, income.frequency), 0);
};

// Calculate total monthly expenses from budget categories
export const calculateTotalMonthlyExpenses = (categories: BudgetCategory[]): number => {
  const total = categories.reduce((sum, category) => {
    console.log(`📊 Category ${category.category}: spent ${category.spent}`);
    return sum + category.spent;
  }, 0);
  console.log(`💸 Total Monthly Expenses: ${total}`);
  return total;
};

// Calculate total budgeted amount from categories
export const calculateTotalBudgeted = (categories: BudgetCategory[]): number => {
  return categories.reduce((sum, category) => sum + category.allocated, 0);
};

// Calculate budget variance for each category
export const calculateBudgetVariances = (categories: BudgetCategory[]): Array<{
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'over' | 'on-target';
}> => {
  return categories.map(cat => {
    const variance = cat.spent - cat.allocated;
    const variancePercent = cat.allocated > 0 ? (variance / cat.allocated) * 100 : 0;

    let status: 'under' | 'over' | 'on-target' = 'on-target';
    if (Math.abs(variancePercent) <= 5) {
      status = 'on-target';
    } else if (variance < 0) {
      status = 'under';
    } else {
      status = 'over';
    }

    return {
      category: cat.category,
      budgeted: cat.allocated,
      actual: cat.spent,
      variance,
      variancePercent,
      status
    };
  }).filter(item => item.budgeted > 0); // Only show categories with budget
};

// Calculate total monthly savings target from active goals
export const calculateTotalMonthlySavingsTarget = (savingsGoals: SavingsGoal[]): number => {
  const today = new Date();
  return savingsGoals
    .filter(goal => goal.isActive)
    .reduce((total, goal) => {
      const targetDate = toDateSafe(goal.targetDate);
      if (!targetDate) return total; // Skip if invalid target date

      const remaining = Math.max(0, (goal.targetAmount ?? 0) - (goal.currentAmount ?? 0));
      const monthsLeft = monthsBetween(today, targetDate);

      return total + (remaining / monthsLeft);
    }, 0);
};

// Calculate current emergency fund coverage in weeks
export const calculateEmergencyFundWeeks = (savingsGoals: SavingsGoal[], weeklyExpenses: number): number => {
  const emergencyFund = savingsGoals.find(goal => goal.category === 'emergency-fund');
  if (!emergencyFund || weeklyExpenses === 0) return 0;
  return emergencyFund.currentAmount / weeklyExpenses;
};

// Generate financial summary
export const generateFinancialSummary = (
  incomeSources: IncomeSource[],
  categories: BudgetCategory[],
  savingsGoals: SavingsGoal[]
): FinancialSummary => {
  const totalMonthlyIncome = calculateTotalMonthlyIncome(incomeSources);
  const totalMonthlyExpenses = calculateTotalMonthlyExpenses(categories);
  const totalMonthlySavings = calculateTotalMonthlySavingsTarget(savingsGoals);
  const netCashFlow = totalMonthlyIncome - totalMonthlyExpenses;
  const disposableIncome = totalMonthlyIncome - totalMonthlyExpenses;

  // Budget performance calculations
  const totalBudgeted = calculateTotalBudgeted(categories);
  const budgetVariance = totalMonthlyExpenses - totalBudgeted;
  const budgetVariancePercent = totalBudgeted > 0 ? (budgetVariance / totalBudgeted) * 100 : 0;

  // Cash flow comparison
  const expectedCashFlow = totalMonthlyIncome - totalBudgeted;
  const actualCashFlow = totalMonthlyIncome - totalMonthlyExpenses;
  const cashFlowVariance = actualCashFlow - expectedCashFlow;

  // Category-level variances
  const categoryVariances = calculateBudgetVariances(categories);

  return {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalMonthlySavings,
    netCashFlow,
    disposableIncome,
    // Budget performance
    totalBudgeted,
    budgetVariance,
    budgetVariancePercent,
    expectedCashFlow,
    actualCashFlow,
    cashFlowVariance,
    categoryVariances
  };
};

// Calculate financial health score and generate recommendations
export const calculateFinancialHealth = (
  financialSummary: FinancialSummary,
  savingsGoals: SavingsGoal[],
  totalBudgetAllocated?: number
): FinancialHealth => {
  const { totalMonthlyIncome, totalMonthlyExpenses, disposableIncome } = financialSummary;

  // If no financial data at all, return 0 score
  if (totalMonthlyIncome === 0 && totalMonthlyExpenses === 0) {
    return {
      score: 0,
      incomeExpenseRatio: 0,
      savingsRate: 0,
      emergencyFundWeeks: 0,
      recommendations: ['Add income sources and set budget allocations to start tracking your financial health.']
    };
  }

  // Calculate metrics
  const incomeExpenseRatio = totalMonthlyIncome > 0 ? totalMonthlyIncome / totalMonthlyExpenses : 0;
  const savingsRate = totalMonthlyIncome > 0 ? (disposableIncome / totalMonthlyIncome) * 100 : 0;
  const emergencyFundWeeks = calculateEmergencyFundWeeks(savingsGoals, totalMonthlyExpenses / 4.33);

  // Calculate emergency fund requirement based on total budget allocation
  const monthlyBudgetForEmergency = totalBudgetAllocated || totalMonthlyExpenses;
  const sixMonthEmergencyFund = monthlyBudgetForEmergency * 6;
  const emergencyFund = savingsGoals.find(goal => goal.category === 'emergency-fund');
  const currentEmergencyFund = emergencyFund?.currentAmount || 0;
  const emergencyFundProgress = sixMonthEmergencyFund > 0 ? (currentEmergencyFund / sixMonthEmergencyFund) : 0;

  // Calculate health score (0-100)
  let score = 0;

  // Income/Expense ratio (30 points max)
  if (incomeExpenseRatio >= 2.0) score += 30;
  else if (incomeExpenseRatio >= 1.5) score += 25;
  else if (incomeExpenseRatio >= 1.2) score += 20;
  else if (incomeExpenseRatio >= 1.1) score += 15;
  else if (incomeExpenseRatio >= 1.0) score += 10;

  // Savings rate (30 points max - realistic for normal families)
  if (savingsRate >= 20) score += 30; // Exceptional: 20%+ savings rate (rare!)
  else if (savingsRate >= 15) score += 26; // Excellent: 15%+ savings rate
  else if (savingsRate >= 12) score += 22; // Very good: 12%+ savings rate
  else if (savingsRate >= 10) score += 18; // Good: 10%+ savings rate
  else if (savingsRate >= 7) score += 14; // Fair: 7%+ savings rate
  else if (savingsRate >= 5) score += 10; // Getting by: 5%+ savings rate
  else if (savingsRate >= 3) score += 6; // Struggling: 3%+ savings rate
  else if (savingsRate > 0) score += 3; // Minimal: Any savings

  // Bonus points for extraordinarily rare performance (beyond normal families)
  if (savingsRate >= 30) score += 5; // Extra rare bonus
  if (savingsRate >= 50) score += 5; // Extremely rare bonus

  // Emergency fund coverage (25 points max - 6 months is gold standard)
  if (emergencyFundWeeks >= 26) score += 25; // 6+ months (gold standard)
  else if (emergencyFundWeeks >= 13) score += 15; // 3-6 months (good but not ideal)
  else if (emergencyFundWeeks >= 8) score += 10; // 2-3 months
  else if (emergencyFundWeeks >= 4) score += 6; // 1-2 months
  else if (emergencyFundWeeks > 0) score += 3; // Any amount

  // Having savings goals (10 points max)
  const activeGoals = savingsGoals.filter(goal => goal.isActive).length;
  if (activeGoals >= 3) score += 10;
  else if (activeGoals >= 2) score += 8;
  else if (activeGoals >= 1) score += 5;

  // Bonus for having an emergency fund goal (5 points max)
  const hasEmergencyFund = savingsGoals.some(goal => goal.category === 'emergency-fund' && goal.isActive);
  if (hasEmergencyFund) {
    score += 5; // Reward the planning behavior itself
  }

  // Net positive cash flow (15 points max - realistic for normal families)
  if (financialSummary.netCashFlow >= totalMonthlyIncome * 0.25) score += 15; // 25%+ positive (exceptional)
  else if (financialSummary.netCashFlow >= totalMonthlyIncome * 0.20) score += 13; // 20%+ positive (excellent)
  else if (financialSummary.netCashFlow >= totalMonthlyIncome * 0.15) score += 11; // 15%+ positive (very good)
  else if (financialSummary.netCashFlow >= totalMonthlyIncome * 0.10) score += 9; // 10%+ positive (good)
  else if (financialSummary.netCashFlow >= totalMonthlyIncome * 0.05) score += 6; // 5%+ positive (fair)
  else if (financialSummary.netCashFlow > 0) score += 3; // Any positive (getting by)
  else if (financialSummary.netCashFlow >= totalMonthlyIncome * -0.05) score += 1; // Small negative

  // Bonus for extraordinarily rare performance
  if (financialSummary.netCashFlow >= totalMonthlyIncome * 0.50) score += 5; // Extremely rare bonus

  // CRITICAL: Cap score at 90 if emergency fund is not met (6 months of budget allocation)
  // 100% financial health requires a fully funded 6-month emergency fund
  if (emergencyFundProgress < 1.0) {
    // If emergency fund is less than 6 months of budget, max score is 90
    score = Math.min(score, 90);
  }

  // Generate recommendations
  const recommendations: string[] = [];

  // PRIORITY: Emergency fund recommendation (required for 100% health)
  if (emergencyFundProgress < 1.0) {
    const remaining = sixMonthEmergencyFund - currentEmergencyFund;
    if (currentEmergencyFund === 0) {
      recommendations.push(`Start building your emergency fund. Goal: $${sixMonthEmergencyFund.toFixed(0)} (6 months of your $${monthlyBudgetForEmergency.toFixed(0)} monthly budget).`);
    } else {
      const percentComplete = Math.round(emergencyFundProgress * 100);
      recommendations.push(`Emergency fund ${percentComplete}% complete. Need $${remaining.toFixed(0)} more to reach 100% financial health (6 months of expenses).`);
    }
  }

  // High performer recommendations (80%+ score)
  if (score >= 85) {
    if (emergencyFundProgress >= 1.0) {
      recommendations.push('Excellent! Your 6-month emergency fund is fully funded. Consider increasing to 9-12 months for extra security.');
    }
    if (savingsRate > 50) {
      recommendations.push('Outstanding financial discipline! Consider diversifying investments or exploring tax-advantaged accounts.');
    }
    if (activeGoals < 2 && emergencyFundProgress >= 1.0) {
      recommendations.push('With your excellent savings rate, consider setting ambitious long-term financial goals.');
    }
  }
  // Standard recommendations for those needing improvement
  else {
    if (incomeExpenseRatio < 1.2) {
      recommendations.push('Consider reducing expenses or increasing income to improve your financial stability.');
    }

    if (savingsRate < 10) {
      recommendations.push('Try to save at least 10% of your income for long-term financial health.');
    }

    if (emergencyFundWeeks < 13) {
      recommendations.push('Build an emergency fund covering 3-6 months of expenses for financial security.');
    }

    if (activeGoals === 0) {
      recommendations.push('Set specific savings goals to stay motivated and track your progress.');
    }

    if (financialSummary.netCashFlow < 0) {
      recommendations.push('Your expenses exceed your income. Focus on budgeting and expense reduction.');
    }

    if (totalMonthlyExpenses > totalMonthlyIncome * 0.8) {
      recommendations.push('Your expenses are quite high relative to income. Look for areas to optimize spending.');
    }
  }

  // If no recommendations were added, they're doing great
  if (recommendations.length === 0) {
    recommendations.push('Excellent financial management! Keep up the great work.');
  }

  // Requirement for 100% score: Must have at least 3 months emergency fund
  const hasMinimumEmergencyFund = emergencyFundWeeks >= 13; // 3 months = ~13 weeks
  const finalScore = hasMinimumEmergencyFund ? Math.min(score, 100) : Math.min(score, 95);

  return {
    score: Math.max(finalScore, 0), // Cap at 100 only if 3+ months emergency fund, otherwise max 95
    incomeExpenseRatio,
    savingsRate,
    emergencyFundWeeks,
    recommendations
  };
};