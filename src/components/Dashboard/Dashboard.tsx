import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, LogOut, User, Plus } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContextSupabase';
import { useAuth } from '../../contexts/AuthContext';
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
import FinancialOverview from '../Financial/FinancialOverview';
import HouseholdHeader from '../Household/HouseholdHeader';
import HouseholdManager from '../Household/HouseholdManager';
import JoinHousehold from '../Household/JoinHousehold';
import { CategoryType } from '../../types';
import { staggerContainer, staggerItem } from '../../utils/animations';
import { useBillNotifications } from '../../hooks/useBillNotifications';
import { ensureCoreCategories } from '../../utils/ensureCoreCategories';
// Logo will be loaded from public folder

const Dashboard: React.FC = () => {
  const { signOut } = useAuth();
  const {
    budget,
    transactions,
    setCategoryFilter,
    selectedCategory,
    updateCategoryBudgets,
    deleteCategory,
    financialSummary,
    financialHealth,
    user,
    refreshCurrentPeriod,
    isAuthenticated
  } = useBudget();
  const { getUrgentBillsCount } = useBillNotifications();
  const [showReceiptUploader, setShowReceiptUploader] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showBillManager, setShowBillManager] = useState(false);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [isSettingUpCategories, setIsSettingUpCategories] = useState(false);

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

  // Handler for setting up core categories
  const handleSetupCoreCategories = async () => {
    setIsSettingUpCategories(true);
    try {
      await ensureCoreCategories();
      await refreshCurrentPeriod();
    } catch (error) {
      console.error('Failed to set up core categories:', error);
    } finally {
      setIsSettingUpCategories(false);
    }
  };

  // Calculate ALL categories totals for display (not just core)
  const allTotalBudget = budget.categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const allTotalSpent = budget.categories.reduce((sum, cat) => sum + cat.spent, 0);
  const allRemaining = allTotalBudget - allTotalSpent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Household Header */}
      <HouseholdHeader />

      {/* Logo and Stats Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col items-center">
              <img src="/logo.png" alt="Centsible Logo" className="h-16 w-auto" />
              <p className="text-[10px] font-bold text-gray-600 -mt-2 text-right self-end">
                AI-powered budget clarity
              </p>
            </div>

            {/* Quick Stats & Settings */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-mint-600">
                    ${allTotalBudget.toFixed(0)}
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

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-[120px]">{user?.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
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
                ${allTotalBudget.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Total Budget</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-soft">
              <p className="text-2xl font-bold text-gray-800">
                ${allTotalSpent.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Spent</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-soft">
              <p className="text-2xl font-bold text-gold-600">
                ${allRemaining.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
          {/* Categories Grid */}
          <div className="xl:col-span-3">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Budget Categories
                </h2>
                <motion.button
                  onClick={() => setShowBudgetSettings(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Budget Settings"
                >
                  <Settings size={18} className="text-gray-600" />
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Transaction List Header */}
          <div className="xl:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setCategoryFilter(undefined)}
                  className="text-sm text-mint-600 hover:text-mint-700 font-medium"
                >
                  Show All Categories
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Full-width Alignment Reference Line - Invisible */}
        <div className="h-px bg-transparent mb-6"></div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
          {/* Categories Grid Content */}
          <div className="xl:col-span-3">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="flex flex-col"
            >
              {budget.categories.length === 0 ? (
                // Empty state when no categories exist
                <div className="col-span-full flex flex-col items-center justify-center py-12 px-6">
                  <div className="text-center max-w-md">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Settings className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Set Up Your Budget Categories
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Get started by setting up your core budget categories. This will help you track your spending across different areas of your life.
                      </p>
                    </div>
                    <button
                      onClick={handleSetupCoreCategories}
                      disabled={isSettingUpCategories || !isAuthenticated}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-mint-500 text-white rounded-lg hover:bg-mint-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {isSettingUpCategories ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Setting Up Categories...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Set Up Core Categories
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {budget.categories
                    .map((category) => (
                      <motion.div key={category.category} variants={staggerItem} className="h-[350px]">
                        <CategoryCard
                          category={category.category}
                          spent={category.spent}
                          allocated={category.allocated}
                          color={category.color}
                          icon={category.icon}
                          recentTransactions={getRecentTransactionsCount(category.category)}
                          onClick={() => handleCategoryClick(category.category)}
                          isSelected={selectedCategory === category.category}
                        />
                      </motion.div>
                    ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Transaction List Content */}
          <div className="xl:col-span-2">
            <TransactionList />
          </div>
        </div>

        {/* Income & Savings Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Income & Savings</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Income Tracker */}
            <div>
              <IncomeTracker />
            </div>

            {/* Savings Goals */}
            <div>
              <SavingsGoals
                totalMonthlyIncome={financialSummary.totalMonthlyIncome}
                totalMonthlyExpenses={financialSummary.totalMonthlyExpenses}
              />
            </div>
          </div>
        </div>

        {/* Financial Overview Section */}
        <div className="mt-12">
          <FinancialOverview
            financialSummary={financialSummary}
            financialHealth={financialHealth}
          />
        </div>
      </div>

      {/* Mobile Stats Bar */}
      <div className="md:hidden fixed bottom-20 left-4 right-4 bg-white rounded-xl shadow-large p-4 border">
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-lg font-bold text-mint-600">
              ${allTotalBudget.toFixed(0)}
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

      {/* Disclaimer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500">
          For personal budgeting only. Not professional financial advice.
        </p>
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
          onDelete={deleteCategory}
          onClose={() => setShowBudgetSettings(false)}
        />
      )}

      {/* Household Management Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HouseholdManager />
          <JoinHousehold />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;