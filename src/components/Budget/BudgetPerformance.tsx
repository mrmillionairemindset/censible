import React from 'react';
import { motion } from 'framer-motion';
import { Target, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FinancialSummary, CategoryLabels } from '../../types';

interface BudgetPerformanceProps {
  financialSummary: FinancialSummary;
}

const BudgetPerformance: React.FC<BudgetPerformanceProps> = ({ financialSummary }) => {
  const getVarianceIcon = (status: 'under' | 'over' | 'on-target') => {
    switch (status) {
      case 'under':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'over':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'on-target':
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getVarianceText = (status: 'under' | 'over' | 'on-target') => {
    switch (status) {
      case 'under':
        return 'Under Budget';
      case 'over':
        return 'Over Budget';
      case 'on-target':
        return 'On Target';
    }
  };

  const formatCategoryName = (category: string) => {
    return CategoryLabels[category as keyof typeof CategoryLabels] ||
           category.split('-').map(word =>
             word.charAt(0).toUpperCase() + word.slice(1)
           ).join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Budget Performance</h2>
          <p className="text-sm text-gray-600">How you're tracking against your plan</p>
        </div>
      </div>

      {/* Budget vs Actual Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700 mb-2">Monthly Budget</p>
          <p className="text-2xl font-bold text-blue-800">
            ${financialSummary.totalBudgeted.toFixed(0)}
          </p>
          <p className="text-xs text-blue-600 mt-1">Planned expenses</p>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-700 mb-2">Actual Spent</p>
          <p className="text-2xl font-bold text-gray-800">
            ${financialSummary.totalMonthlyExpenses.toFixed(0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Current expenses</p>
        </div>
      </div>

      {/* Budget Variance Summary */}
      <div className="mb-6">
        <div className={`p-4 rounded-xl border-2 ${
          financialSummary.budgetVariance <= 0
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className={`w-5 h-5 ${
                financialSummary.budgetVariance <= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-700">Budget Variance</p>
                <p className={`text-xs ${
                  financialSummary.budgetVariance <= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {financialSummary.budgetVariance <= 0 ? 'Staying within budget' : 'Over budget'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${
                financialSummary.budgetVariance <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {financialSummary.budgetVariance > 0 ? '+' : ''}${financialSummary.budgetVariance.toFixed(0)}
              </p>
              <p className={`text-sm ${
                financialSummary.budgetVariance <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ({financialSummary.budgetVariancePercent > 0 ? '+' : ''}{financialSummary.budgetVariancePercent.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Comparison */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Cash Flow Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-sm text-purple-700 mb-1">Expected Cash Flow</p>
            <p className={`text-xl font-bold ${
              financialSummary.expectedCashFlow >= 0 ? 'text-purple-800' : 'text-red-800'
            }`}>
              {financialSummary.expectedCashFlow >= 0 ? '+' : ''}${financialSummary.expectedCashFlow.toFixed(0)}
            </p>
            <p className="text-xs text-purple-600 mt-1">Based on budget plan</p>
          </div>

          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-sm text-green-700 mb-1">Actual Cash Flow</p>
            <p className={`text-xl font-bold ${
              financialSummary.actualCashFlow >= 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              {financialSummary.actualCashFlow >= 0 ? '+' : ''}${financialSummary.actualCashFlow.toFixed(0)}
            </p>
            <p className="text-xs text-green-600 mt-1">Your real performance</p>
          </div>
        </div>

        {/* Cash Flow Difference */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Cash Flow Difference</span>
            <div className="text-right">
              <span className={`font-medium ${
                financialSummary.cashFlowVariance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {financialSummary.cashFlowVariance >= 0 ? '+' : ''}${financialSummary.cashFlowVariance.toFixed(0)}
              </span>
              <span className="text-xs text-gray-600 ml-1">
                {financialSummary.cashFlowVariance >= 0 ? 'better than planned' : 'worse than planned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      {financialSummary.categoryVariances.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Category Breakdown</h3>
          <div className="space-y-3">
            {financialSummary.categoryVariances
              .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
              .slice(0, 5) // Show top 5 categories
              .map((variance, index) => (
                <motion.div
                  key={variance.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getVarianceIcon(variance.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {formatCategoryName(variance.category)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Budget: ${variance.budgeted.toFixed(0)} •
                          Spent: ${variance.actual.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        variance.status === 'under' ? 'bg-green-100 text-green-700' :
                        variance.status === 'over' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getVarianceText(variance.status)}
                      </span>
                      <p className={`text-sm font-medium mt-1 ${
                        variance.variance <= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {variance.variance > 0 ? '+' : ''}${variance.variance.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              {financialSummary.budgetVariance <= 0
                ? `Great job! You're ${Math.abs(financialSummary.budgetVariancePercent).toFixed(1)}% under budget this month.`
                : `You're ${financialSummary.budgetVariancePercent.toFixed(1)}% over budget. Consider adjusting spending in your highest variance categories.`
              }
            </p>
            {financialSummary.cashFlowVariance > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                Bonus: Your actual cash flow is ${financialSummary.cashFlowVariance.toFixed(0)} better than expected!
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BudgetPerformance;