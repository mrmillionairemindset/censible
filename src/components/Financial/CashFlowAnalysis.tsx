import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight, Info } from 'lucide-react';
import { FinancialSummary } from '../../types';

interface CashFlowAnalysisProps {
  financialSummary: FinancialSummary;
}

const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({ financialSummary }) => {
  const getCashFlowIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (amount < 0) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <DollarSign className="w-5 h-5 text-gray-600" />;
  };

  const getCashFlowColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getCashFlowStatus = (amount: number) => {
    if (amount > 0) return 'Positive';
    if (amount < 0) return 'Negative';
    return 'Break Even';
  };

  const getRecommendation = () => {
    const { expectedCashFlow, actualCashFlow, cashFlowVariance } = financialSummary;

    if (actualCashFlow < 0) {
      return {
        type: 'warning',
        message: 'Negative cash flow detected. Consider reducing expenses or increasing income.',
        action: 'Review your highest spending categories'
      };
    }

    if (cashFlowVariance > 100) {
      return {
        type: 'success',
        message: `Excellent! You're $${cashFlowVariance.toFixed(0)} ahead of your financial plan.`,
        action: 'Consider allocating extra funds to savings or emergency fund'
      };
    }

    if (expectedCashFlow > actualCashFlow && actualCashFlow > 0) {
      return {
        type: 'info',
        message: 'Your actual cash flow is lower than planned but still positive.',
        action: 'Review budget allocations to align with actual spending'
      };
    }

    return {
      type: 'success',
      message: 'Your cash flow is tracking well with your financial plan.',
      action: 'Keep up the good work with your current spending habits'
    };
  };

  const recommendation = getRecommendation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Cash Flow Analysis</h2>
          <p className="text-sm text-gray-600">Money in vs money out</p>
        </div>
      </div>

      {/* Current Cash Flow Status */}
      <div className="mb-6">
        <div className={`p-4 rounded-xl border-2 ${
          financialSummary.actualCashFlow > 0
            ? 'bg-green-50 border-green-200'
            : financialSummary.actualCashFlow < 0
            ? 'bg-red-50 border-red-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getCashFlowIcon(financialSummary.actualCashFlow)}
              <div>
                <p className="text-sm font-medium text-gray-700">Current Cash Flow</p>
                <p className={`text-xs ${getCashFlowColor(financialSummary.actualCashFlow)}`}>
                  {getCashFlowStatus(financialSummary.actualCashFlow)} cash flow
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getCashFlowColor(financialSummary.actualCashFlow)}`}>
                {financialSummary.actualCashFlow >= 0 ? '+' : ''}${financialSummary.actualCashFlow.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600">per month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income vs Expenses Breakdown */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Monthly Breakdown</h3>
        <div className="space-y-3">
          {/* Income */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Income</span>
            </div>
            <span className="text-lg font-bold text-green-800">
              +${financialSummary.totalMonthlyIncome.toFixed(0)}
            </span>
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Total Expenses</span>
            </div>
            <span className="text-lg font-bold text-red-800">
              -${financialSummary.totalMonthlyExpenses.toFixed(0)}
            </span>
          </div>

          {/* Net Result */}
          <div className="flex items-center justify-center py-2">
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>

          <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
            financialSummary.actualCashFlow > 0
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {getCashFlowIcon(financialSummary.actualCashFlow)}
              <span className="text-sm font-medium text-gray-800">Net Cash Flow</span>
            </div>
            <span className={`text-lg font-bold ${getCashFlowColor(financialSummary.actualCashFlow)}`}>
              {financialSummary.actualCashFlow >= 0 ? '+' : ''}${financialSummary.actualCashFlow.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Plan vs Reality */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Plan vs Reality</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-700 mb-1">Expected</p>
            <p className={`text-lg font-bold ${
              financialSummary.expectedCashFlow >= 0 ? 'text-purple-800' : 'text-red-800'
            }`}>
              {financialSummary.expectedCashFlow >= 0 ? '+' : ''}${financialSummary.expectedCashFlow.toFixed(0)}
            </p>
            <p className="text-xs text-purple-600">Based on budget</p>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700 mb-1">Actual</p>
            <p className={`text-lg font-bold ${
              financialSummary.actualCashFlow >= 0 ? 'text-blue-800' : 'text-red-800'
            }`}>
              {financialSummary.actualCashFlow >= 0 ? '+' : ''}${financialSummary.actualCashFlow.toFixed(0)}
            </p>
            <p className="text-xs text-blue-600">Your performance</p>
          </div>
        </div>

        {/* Variance */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Performance vs Plan</span>
            <div className="text-right">
              <span className={`font-medium ${
                financialSummary.cashFlowVariance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {financialSummary.cashFlowVariance >= 0 ? '+' : ''}${financialSummary.cashFlowVariance.toFixed(0)}
              </span>
              <span className="text-xs text-gray-600 ml-1">
                {financialSummary.cashFlowVariance >= 0 ? 'better' : 'worse'} than expected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Health Metrics */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Health Metrics</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Income Coverage Ratio</span>
            <span className="font-medium text-gray-800">
              {financialSummary.totalMonthlyIncome > 0
                ? (financialSummary.totalMonthlyIncome / Math.max(financialSummary.totalMonthlyExpenses, 1)).toFixed(2)
                : '0.00'
              }x
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Cash Flow Rate</span>
            <span className="font-medium text-gray-800">
              {financialSummary.totalMonthlyIncome > 0
                ? ((financialSummary.actualCashFlow / financialSummary.totalMonthlyIncome) * 100).toFixed(1)
                : '0.0'
              }%
            </span>
          </div>
        </div>
      </div>

      {/* Contextual Recommendation */}
      <div className={`p-4 rounded-xl border ${
        recommendation.type === 'success' ? 'bg-green-50 border-green-200' :
        recommendation.type === 'warning' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-3">
          <Info className={`w-5 h-5 mt-0.5 ${
            recommendation.type === 'success' ? 'text-green-600' :
            recommendation.type === 'warning' ? 'text-red-600' :
            'text-blue-600'
          }`} />
          <div>
            <p className={`text-sm font-medium ${
              recommendation.type === 'success' ? 'text-green-800' :
              recommendation.type === 'warning' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {recommendation.message}
            </p>
            <p className={`text-xs mt-1 ${
              recommendation.type === 'success' ? 'text-green-600' :
              recommendation.type === 'warning' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              Next step: {recommendation.action}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CashFlowAnalysis;