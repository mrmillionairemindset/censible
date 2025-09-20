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
  const total = categories.reduce((sum, category) => {
    console.log(`📊 Category ${category.category}: spent ${category.spent}`);
    return sum + category.spent;
  }, 0);
  console.log(`💸 Total Monthly Expenses: ${total}`);
  return total;
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

  // Generate recommendations
  const recommendations: string[] = [];

  // High performer recommendations (80%+ score)
  if (score >= 85) {
    if (savingsRate > 50) {
      recommendations.push('Outstanding financial discipline! Consider diversifying investments or exploring tax-advantaged accounts.');
    }
    if (emergencyFundWeeks < 26) {
      recommendations.push('Consider building your emergency fund to 6+ months for ultimate security.');
    }
    if (activeGoals < 2) {
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