import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import FinancialHealth from './FinancialHealth';
import CashFlowAnalysis from './CashFlowAnalysis';
import CategoryBreakdown from '../Budget/CategoryBreakdown';
import BudgetPerformance from '../Budget/BudgetPerformance';
import { FinancialSummary, FinancialHealth as FinancialHealthType } from '../../types';

interface FinancialOverviewProps {
  financialSummary: FinancialSummary;
  financialHealth: FinancialHealthType;
}

type ViewMode = 'overview' | 'cash-flow' | 'categories' | 'performance';

const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  financialSummary,
  financialHealth
}) => {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');

  const getViewTitle = (view: ViewMode) => {
    switch (view) {
      case 'cash-flow': return 'Cash Flow Analysis';
      case 'categories': return 'Category Breakdown';
      case 'performance': return 'Budget Performance';
      default: return 'Financial Overview';
    }
  };

  const navigationButtons = [
    {
      id: 'cash-flow' as ViewMode,
      icon: TrendingUp,
      label: 'Cash Flow',
      color: 'bg-green-100 text-green-600 hover:bg-green-200'
    },
    {
      id: 'categories' as ViewMode,
      icon: BarChart3,
      label: 'Categories',
      color: 'bg-orange-100 text-orange-600 hover:bg-orange-200'
    },
    {
      id: 'performance' as ViewMode,
      icon: DollarSign,
      label: 'Performance',
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
    }
  ];

  const handleBackToOverview = () => {
    setCurrentView('overview');
  };

  const handleNavigateToView = (view: ViewMode) => {
    setCurrentView(view);
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentView !== 'overview' && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBackToOverview}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </motion.button>
          )}
          <h2 className="text-2xl font-bold text-gray-800">
            {getViewTitle(currentView)}
          </h2>
        </div>

      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {currentView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Central Financial Health Ring */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <FinancialHealth
                  financialSummary={financialSummary}
                  financialHealth={financialHealth}
                  onRingClick={() => handleNavigateToView('cash-flow')}
                  isClickable={true}
                />
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {navigationButtons.map((button, index) => (
                <motion.div
                  key={button.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleNavigateToView(button.id)}
                  className="cursor-pointer group"
                >
                  <div className={`p-6 rounded-2xl border-2 border-transparent transition-all duration-200 hover:border-gray-200 hover:shadow-md ${button.color.replace('hover:bg-', 'hover:').replace('text-', 'border-').replace('bg-', '')}`}>
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${button.color.split(' ')[0]} group-hover:scale-110 transition-transform`}>
                        <button.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{button.label}</h3>
                      <p className="text-xs text-gray-600">
                        {button.id === 'cash-flow' && 'Income vs expenses'}
                        {button.id === 'categories' && 'Spending breakdown'}
                        {button.id === 'performance' && 'Budget tracking'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentView === 'cash-flow' && (
          <motion.div
            key="cash-flow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CashFlowAnalysis financialSummary={financialSummary} />
          </motion.div>
        )}

        {currentView === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CategoryBreakdown financialSummary={financialSummary} />
          </motion.div>
        )}

        {currentView === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BudgetPerformance financialSummary={financialSummary} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancialOverview;