import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import SpendingDonutChart from './SpendingDonutChart';
import CategoryCard from './CategoryCard';
import TransactionList from '../Transactions/TransactionList';
import FloatingActionButton from '../Layout/FloatingActionButton';
import ReceiptUploader from '../Scanner/ReceiptUploader';
import QuickExpenseModal from '../Transactions/QuickExpenseModal';
import BillManager from '../Bills/BillManager';
import BudgetSettings from '../Budget/BudgetSettings';
import IncomeTracker from '../Income/IncomeTracker';
import SavingsGoals from '../Savings/SavingsGoals';
import FinancialHealth from '../Financial/FinancialHealth';
import { CategoryType } from '../../types';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { useBillNotifications } from '../../hooks/useBillNotifications';

const Dashboard: React.FC = () => {
  const {
    budget,
    transactions,
    setCategoryFilter,
    selectedCategory,
    updateCategoryBudgets,
    financialSummary,
    financialHealth
  } = useBudget();
  const { getUrgentBillsCount } = useBillNotifications();
  const [showReceiptUploader, setShowReceiptUploader] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showBillManager, setShowBillManager] = useState(false);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);

  // Get recent transactions count for each category
  const getRecentTransactionsCount = (category: CategoryType) => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return transactions.filter(
      t => t.category === category && new Date(t.date) > lastWeek
    ).length;
  };

  const handleCategoryClick = (category: CategoryType) => {
    setCategoryFilter(selectedCategory === category ? undefined : category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                💰 Centsible
              </h1>
              <p className="text-gray-600 mt-1">
                Smart budget tracking that makes cents!
              </p>
            </div>

            {/* Quick Stats & Settings */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-mint-600">
                    ${budget.totalBudget.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">Monthly Budget</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {transactions.length}
                  </p>
                  <p className="text-xs text-gray-500">Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold-600">
                    {budget.categories.length}
                  </p>
                  <p className="text-xs text-gray-500">Categories</p>
                </div>
              </div>

              {/* Settings Button */}
              <motion.button
                onClick={() => setShowBudgetSettings(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white rounded-xl shadow-soft hover:shadow-md transition-all duration-200 border border-gray-100"
                aria-label="Budget Settings"
              >
                <Settings size={20} className="text-gray-600" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Total Budget Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Centered Donut Chart */}
          <div className="flex justify-center mb-6">
            <div className="w-80">
              <SpendingDonutChart />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center p-4 bg-white rounded-xl shadow-soft">
              <p className="text-2xl font-bold text-mint-600">
                ${budget.totalBudget.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Total Budget</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-soft">
              <p className="text-2xl font-bold text-gray-800">
                ${budget.categories.reduce((sum, cat) => sum + cat.spent, 0).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Spent</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-soft">
              <p className="text-2xl font-bold text-gold-600">
                ${(budget.totalBudget - budget.categories.reduce((sum, cat) => sum + cat.spent, 0)).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Categories Grid */}
          <div className="xl:col-span-3">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Budget Categories
                </h2>
                {selectedCategory && (
                  <button
                    onClick={() => setCategoryFilter(undefined)}
                    className="text-sm text-mint-600 hover:text-mint-700 font-medium"
                  >
                    Show All Categories
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
                {budget.categories.map((category) => (
                  <motion.div key={category.category} variants={staggerItem} className="h-full">
                    <CategoryCard
                      category={category.category}
                      spent={category.spent}
                      allocated={category.allocated}
                      color={category.color}
                      recentTransactions={getRecentTransactionsCount(category.category)}
                      onClick={() => handleCategoryClick(category.category)}
                      isSelected={selectedCategory === category.category}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Transaction List */}
          <div className="xl:col-span-1">
            <TransactionList />
          </div>
        </div>

        {/* Income, Savings & Financial Health Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Financial Overview</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Income Tracker */}
            <div className="lg:col-span-1">
              <IncomeTracker />
            </div>

            {/* Savings Goals */}
            <div className="lg:col-span-1">
              <SavingsGoals
                totalMonthlyIncome={financialSummary.totalMonthlyIncome}
                totalMonthlyExpenses={financialSummary.totalMonthlyExpenses}
              />
            </div>

            {/* Financial Health */}
            <div className="lg:col-span-2 xl:col-span-1">
              <FinancialHealth
                financialSummary={financialSummary}
                financialHealth={financialHealth}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stats Bar */}
      <div className="md:hidden fixed bottom-20 left-4 right-4 bg-white rounded-xl shadow-large p-4 border">
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-lg font-bold text-mint-600">
              ${budget.totalBudget.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">Budget</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">
              {transactions.length}
            </p>
            <p className="text-xs text-gray-500">Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gold-600">
              {budget.categories.filter(c => c.spent > 0).length}
            </p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onQuickScan={() => setShowReceiptUploader(true)}
        onManualEntry={() => setShowManualEntry(true)}
        onBillManager={() => setShowBillManager(true)}
        urgentBillsCount={getUrgentBillsCount()}
      />

      {/* Modals */}
      {showReceiptUploader && (
        <ReceiptUploader
          onClose={() => setShowReceiptUploader(false)}
          onSuccess={() => setShowReceiptUploader(false)}
        />
      )}

      {showManualEntry && (
        <QuickExpenseModal
          onClose={() => setShowManualEntry(false)}
        />
      )}

      {showBillManager && (
        <BillManager
          onClose={() => setShowBillManager(false)}
        />
      )}

      {showBudgetSettings && (
        <BudgetSettings
          categories={budget.categories}
          totalBudget={budget.totalBudget}
          onSave={(updatedCategories, newTotalBudget) => {
            updateCategoryBudgets(updatedCategories, newTotalBudget);
          }}
          onClose={() => setShowBudgetSettings(false)}
        />
      )}

    </div>
  );
};

export default Dashboard;