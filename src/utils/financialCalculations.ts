import { IncomeSource, IncomeFrequency, SavingsGoal, FinancialHealth, FinancialSummary, BudgetCategory } from '../types';

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
  return categories.reduce((total, category) => total + category.spent, 0);
};

// Calculate total monthly savings target from active goals
export const calculateTotalMonthlySavingsTarget = (savingsGoals: SavingsGoal[]): number => {
  return savingsGoals
    .filter(goal => goal.isActive)
    .reduce((total, goal) => {
      const remaining = goal.targetAmount - goal.currentAmount;
      const monthsLeft = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (monthsLeft <= 0) return total + remaining; // Need to save all remaining immediately
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

  return {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalMonthlySavings,
    netCashFlow,
    disposableIncome
  };
};

// Calculate financial health score and generate recommendations
export const calculateFinancialHealth = (
  financialSummary: FinancialSummary,
  savingsGoals: SavingsGoal[]
): FinancialHealth => {
  const { totalMonthlyIncome, totalMonthlyExpenses, disposableIncome } = financialSummary;

  // Calculate metrics
  const incomeExpenseRatio = totalMonthlyIncome > 0 ? totalMonthlyIncome / totalMonthlyExpenses : 0;
  const savingsRate = totalMonthlyIncome > 0 ? (disposableIncome / totalMonthlyIncome) * 100 : 0;
  const emergencyFundWeeks = calculateEmergencyFundWeeks(savingsGoals, totalMonthlyExpenses / 4.33);

  // Calculate health score (0-100)
  let score = 0;

  // Income/Expense ratio (30 points max)
  if (incomeExpenseRatio >= 2.0) score += 30;
  else if (incomeExpenseRatio >= 1.5) score += 25;
  else if (incomeExpenseRatio >= 1.2) score += 20;
  else if (incomeExpenseRatio >= 1.1) score += 15;
  else if (incomeExpenseRatio >= 1.0) score += 10;

  // Savings rate (25 points max)
  if (savingsRate >= 20) score += 25;
  else if (savingsRate >= 15) score += 20;
  else if (savingsRate >= 10) score += 15;
  else if (savingsRate >= 5) score += 10;
  else if (savingsRate > 0) score += 5;

  // Emergency fund coverage (25 points max)
  if (emergencyFundWeeks >= 26) score += 25; // 6+ months
  else if (emergencyFundWeeks >= 13) score += 20; // 3-6 months
  else if (emergencyFundWeeks >= 8) score += 15; // 2-3 months
  else if (emergencyFundWeeks >= 4) score += 10; // 1-2 months
  else if (emergencyFundWeeks > 0) score += 5;

  // Having savings goals (10 points max)
  const activeGoals = savingsGoals.filter(goal => goal.isActive).length;
  if (activeGoals >= 3) score += 10;
  else if (activeGoals >= 2) score += 8;
  else if (activeGoals >= 1) score += 5;

  // Net positive cash flow (10 points max)
  if (financialSummary.netCashFlow >= totalMonthlyIncome * 0.1) score += 10; // 10%+ positive
  else if (financialSummary.netCashFlow >= totalMonthlyIncome * 0.05) score += 8; // 5%+ positive
  else if (financialSummary.netCashFlow > 0) score += 5; // Any positive
  else if (financialSummary.netCashFlow >= totalMonthlyIncome * -0.05) score += 2; // Small negative

  // Generate recommendations
  const recommendations: string[] = [];

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

  return {
    score: Math.min(Math.max(score, 0), 100), // Clamp between 0-100
    incomeExpenseRatio,
    savingsRate,
    emergencyFundWeeks,
    recommendations
  };
};