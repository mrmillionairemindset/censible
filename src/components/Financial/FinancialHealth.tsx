import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { FinancialHealth as FinancialHealthType, FinancialSummary } from '../../types';

interface FinancialHealthProps {
  financialSummary: FinancialSummary;
  financialHealth: FinancialHealthType;
}

const FinancialHealth: React.FC<FinancialHealthProps> = ({
  financialSummary,
  financialHealth
}) => {
  console.log('🏥 FinancialHealth Component Rendering:', {
    financialSummary,
    financialHealth,
    expenses: financialSummary.totalMonthlyExpenses,
    income: financialSummary.totalMonthlyIncome,
    score: financialHealth.score
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-purple-600';
    if (score >= 75) return 'text-emerald-600';
    if (score >= 60) return 'text-green-600';
    if (score >= 45) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'from-purple-400 to-purple-600';
    if (score >= 75) return 'from-emerald-400 to-emerald-600';
    if (score >= 60) return 'from-green-400 to-green-600';
    if (score >= 45) return 'from-yellow-400 to-yellow-600';
    if (score >= 30) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-purple-600" />;
    if (score >= 75) return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (score >= 60) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 45) return <Info className="w-5 h-5 text-yellow-600" />;
    if (score >= 30) return <Info className="w-5 h-5 text-orange-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getHealthLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 75) return 'Outstanding';
    if (score >= 60) return 'Excellent';
    if (score >= 45) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Financial Health</h2>
          <p className="text-sm text-gray-600">Your overall financial wellness score</p>
        </div>
      </div>

      {/* Health Score Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="url(#healthGradient)"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 251.2" }}
              animate={{ strokeDasharray: `${Math.min(financialHealth.score / 100, 1.1) * 251.2} 251.2` }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {financialHealth.score >= 90 && (
                  <>
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </>
                )}
                {financialHealth.score >= 75 && financialHealth.score < 90 && (
                  <>
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </>
                )}
                {financialHealth.score >= 60 && financialHealth.score < 75 && (
                  <>
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </>
                )}
                {financialHealth.score >= 45 && financialHealth.score < 60 && (
                  <>
                    <stop offset="0%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </>
                )}
                {financialHealth.score >= 30 && financialHealth.score < 45 && (
                  <>
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </>
                )}
                {financialHealth.score < 30 && (
                  <>
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </>
                )}
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-2xl font-bold ${getScoreColor(financialHealth.score)}`}>
              {financialHealth.score}
            </p>
            <p className="text-xs text-gray-600">/ 100</p>
          </div>
        </div>
      </div>

      {/* Health Status */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getHealthIcon(financialHealth.score)}
          <span className={`font-medium ${getScoreColor(financialHealth.score)}`}>
            {getHealthLabel(financialHealth.score)}
          </span>
        </div>
        <p className="text-sm text-gray-600">Financial Health Status</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
          <p className="text-sm text-green-700 mb-1">Monthly Income</p>
          <p className="text-lg font-bold text-green-800">
            ${financialSummary.totalMonthlyIncome.toFixed(0)}
          </p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-red-700 mb-1">Monthly Expenses</p>
          <p className="text-lg font-bold text-red-800">
            ${financialSummary.totalMonthlyExpenses.toFixed(0)}
          </p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-700 mb-1">Net Cash Flow</p>
          <p className={`text-lg font-bold ${
            financialSummary.netCashFlow >= 0 ? 'text-green-800' : 'text-red-800'
          }`}>
            ${financialSummary.netCashFlow.toFixed(0)}
          </p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm text-purple-700 mb-1">Savings Rate</p>
          <p className="text-lg font-bold text-purple-800">
            {financialHealth.savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Income/Expense Ratio</span>
          </div>
          <span className="font-medium text-gray-800">
            {financialHealth.incomeExpenseRatio.toFixed(2)}x
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Emergency Fund Coverage</span>
          </div>
          <span className="font-medium text-gray-800">
            {financialHealth.emergencyFundWeeks.toFixed(1)} weeks
          </span>
        </div>
      </div>

      {/* Recommendations */}
      {financialHealth.recommendations.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-800 mb-3">Recommendations</h3>
          <div className="space-y-2">
            {financialHealth.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg"
              >
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FinancialHealth;