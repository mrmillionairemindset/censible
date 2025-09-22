import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Target, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { FinancialSummary, CategoryLabels } from '../../types';

interface CategoryBreakdownProps {
  financialSummary: FinancialSummary;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ financialSummary }) => {
  const [showOnlyVariances, setShowOnlyVariances] = useState(false);

  const formatCategoryName = (category: string) => {
    return CategoryLabels[category as keyof typeof CategoryLabels] ||
           category.split('-').map(word =>
             word.charAt(0).toUpperCase() + word.slice(1)
           ).join(' ');
  };

  const getVarianceIcon = (status: 'under' | 'over' | 'on-target') => {
    switch (status) {
      case 'under':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'over':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'on-target':
        return <Target className="w-4 h-4 text-blue-600" />;
    }
  };

  const getProgressBarColor = (status: 'under' | 'over' | 'on-target', spentPercent: number) => {
    if (status === 'over') return 'bg-red-500';
    if (status === 'on-target') return 'bg-blue-500';
    if (spentPercent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSpentPercentage = (spent: number, budgeted: number) => {
    if (budgeted === 0) return 0;
    return Math.min((spent / budgeted) * 100, 100);
  };

  const displayCategories = showOnlyVariances
    ? financialSummary.categoryVariances.filter(cat => cat.status !== 'on-target')
    : financialSummary.categoryVariances;

  const sortedCategories = displayCategories.sort((a, b) => {
    if (a.status === 'over' && b.status !== 'over') return -1;
    if (b.status === 'over' && a.status !== 'over') return 1;
    return Math.abs(b.variance) - Math.abs(a.variance);
  });

  const overBudgetCount = financialSummary.categoryVariances.filter(cat => cat.status === 'over').length;
  const underBudgetCount = financialSummary.categoryVariances.filter(cat => cat.status === 'under').length;
  const onTargetCount = financialSummary.categoryVariances.filter(cat => cat.status === 'on-target').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">Category Breakdown</h2>
          <p className="text-sm text-gray-600">Detailed spending analysis by category</p>
        </div>
        <button
          onClick={() => setShowOnlyVariances(!showOnlyVariances)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {showOnlyVariances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showOnlyVariances ? 'Show All' : 'Variances Only'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-lg font-bold text-red-800">{overBudgetCount}</p>
          <p className="text-xs text-red-600">Over Budget</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-lg font-bold text-blue-800">{onTargetCount}</p>
          <p className="text-xs text-blue-600">On Target</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
          <p className="text-lg font-bold text-green-800">{underBudgetCount}</p>
          <p className="text-xs text-green-600">Under Budget</p>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {sortedCategories.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No category data available</p>
            <p className="text-sm text-gray-400">Add budget allocations to see breakdown</p>
          </div>
        ) : (
          sortedCategories.map((variance, index) => {
            const spentPercent = getSpentPercentage(variance.actual, variance.budgeted);
            const isOverBudget = variance.status === 'over';

            return (
              <motion.div
                key={variance.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-sm ${
                  isOverBudget
                    ? 'bg-red-50 border-red-200'
                    : variance.status === 'on-target'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getVarianceIcon(variance.status)}
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {formatCategoryName(variance.category)}
                      </h3>
                      <p className="text-xs text-gray-600">
                        ${variance.actual.toFixed(0)} of ${variance.budgeted.toFixed(0)} budgeted
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {isOverBudget && <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span className={`text-sm font-medium ${
                        variance.variance > 0 ? 'text-red-600' :
                        variance.variance < 0 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {variance.variance > 0 ? '+' : ''}${variance.variance.toFixed(0)}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      variance.variance > 0 ? 'text-red-600' :
                      variance.variance < 0 ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      ({variance.variancePercent > 0 ? '+' : ''}{variance.variancePercent.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(spentPercent, 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-2 rounded-full ${getProgressBarColor(variance.status, spentPercent)}`}
                    />
                    {/* Over-budget extension */}
                    {spentPercent > 100 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((spentPercent - 100), 50)}%` }}
                        transition={{ duration: 1, delay: (index * 0.1) + 0.5 }}
                        className="h-2 bg-red-600 rounded-full relative -top-2"
                        style={{ marginLeft: '100%' }}
                      />
                    )}
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {spentPercent.toFixed(1)}% used
                    </span>
                    <span className={`font-medium ${
                      variance.status === 'over' ? 'text-red-600' :
                      variance.status === 'under' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {variance.status === 'over' ? 'Over Budget' :
                       variance.status === 'under' ? 'Under Budget' :
                       'On Target'}
                    </span>
                  </div>
                </div>

                {/* Additional Insights */}
                {(variance.status === 'over' || Math.abs(variance.variancePercent) > 25) && (
                  <div className="mt-3 p-3 bg-white/70 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        {variance.status === 'over' ? (
                          <p className="text-orange-800">
                            <span className="font-medium">Action needed:</span> This category is over budget.
                            Consider reducing spending or adjusting your budget allocation.
                          </p>
                        ) : variance.variancePercent < -25 ? (
                          <p className="text-green-800">
                            <span className="font-medium">Opportunity:</span> You're significantly under budget.
                            Consider reallocating funds to other categories or increasing savings.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bottom Summary */}
      {sortedCategories.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {overBudgetCount > 0 ? (
                  `${overBudgetCount} ${overBudgetCount === 1 ? 'category is' : 'categories are'} over budget. `
                ) : (
                  'All categories are within budget. '
                )}
                {underBudgetCount > 0 && (
                  `${underBudgetCount} ${underBudgetCount === 1 ? 'category has' : 'categories have'} remaining funds.`
                )}
              </p>
              {overBudgetCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Focus on high-variance categories to improve budget performance.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CategoryBreakdown;