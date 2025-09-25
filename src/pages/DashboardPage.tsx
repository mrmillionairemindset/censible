import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, AlertTriangle, Plus, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContextSupabase';
import { CategoryLabels, CoreCategories } from '../types/index';
import { ensureCoreCategories } from '../utils/ensureCoreCategories';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

const DashboardPage: React.FC = () => {
  const { household, profile } = useAuth();
  const { transactions, budget, dataLoading, refreshCurrentPeriod, isAuthenticated } = useBudget();
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [isSettingUpCategories, setIsSettingUpCategories] = useState(false);

  // Load family members from localStorage (matches BudgetPage implementation)
  useEffect(() => {
    const householdId = household?.household_id || 'default';
    const storageKey = `centsible_members_${householdId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setFamilyMembers(JSON.parse(stored));
    }
  }, [household?.household_id]);

  // Helper function to calculate monthly equivalent (commented out as not currently used)
  // const getMonthlyEquivalent = (amount: number, frequency: string) => {
  //   switch (frequency) {
  //     case 'weekly': return amount * 4.33;
  //     case 'bi-weekly': return amount * 2.17;
  //     case 'monthly': return amount;
  //     case 'quarterly': return amount / 3;
  //     case 'yearly': return amount / 12;
  //     default: return amount;
  //   }
  // };

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

  // Calculate live statistics
  const liveStats = useMemo(() => {
    // Calculate total budget amount
    const totalBudget = budget.categories.reduce((sum, cat) => sum + cat.allocated, 0);

    // Note: totalIncome calculation available if needed in future
    // const totalIncome = incomeSources.reduce((sum, source) => {
    //   const monthlyAmount = getMonthlyEquivalent(source.amount, source.frequency);
    //   return sum + monthlyAmount;
    // }, 0);

    // Calculate total spent this month
    const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    // Calculate remaining budget
    const remaining = totalBudget - totalSpent;
    const remainingPercentage = totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      remainingPercentage,
      familyMemberCount: familyMembers.length
    };
  }, [budget.categories, transactions, familyMembers]);

  // Generate stats cards with live data
  const monthlyStats: StatCard[] = [
    {
      title: 'Monthly Budget',
      value: `$${liveStats.totalBudget.toLocaleString()}`,
      change: `${budget.categories.length} categories`,
      changeType: 'neutral',
      icon: DollarSign
    },
    {
      title: 'Total Spent',
      value: `$${liveStats.totalSpent.toLocaleString()}`,
      change: `${transactions.length} transactions`,
      changeType: liveStats.totalSpent > liveStats.totalBudget ? 'negative' : 'positive',
      icon: TrendingDown
    },
    {
      title: 'Remaining',
      value: `$${liveStats.remaining.toLocaleString()}`,
      change: `${liveStats.remainingPercentage}% of budget left`,
      changeType: liveStats.remaining >= 0 ? 'positive' : 'negative',
      icon: TrendingUp
    },
    {
      title: 'Family Members',
      value: liveStats.familyMemberCount.toString(),
      change: `${liveStats.familyMemberCount} active members`,
      changeType: 'neutral',
      icon: Users
    }
  ];

  // Get recent transactions (last 5, sorted by date)
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(transaction => ({
        id: transaction.id,
        member: transaction.merchant || 'Unknown',
        category: CategoryLabels[transaction.category] || transaction.category,
        amount: transaction.amount,
        date: new Date(transaction.date).toLocaleDateString(),
        description: transaction.description || transaction.merchant || 'No description'
      }));
  }, [transactions]);

  // Load upcoming bills from localStorage
  const [upcomingBills, setUpcomingBills] = useState<any[]>([]);

  useEffect(() => {
    const loadBills = () => {
      const savedBills = localStorage.getItem('centsible_bills');
      if (savedBills) {
        const bills = JSON.parse(savedBills);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Convert bills to upcoming bills format and sort by due date
        const upcoming = bills
          .map((bill: any) => {
            const dueDate = new Date(currentYear, currentMonth, bill.dueDay);
            if (dueDate < today) {
              // If due date has passed this month, set for next month
              dueDate.setMonth(dueDate.getMonth() + 1);
            }

            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const status = daysUntilDue < 0 ? 'overdue' : 'pending';

            return {
              id: bill.id,
              name: bill.name,
              amount: bill.amount,
              dueDate: dueDate.toLocaleDateString(),
              status: status,
              daysUntilDue: daysUntilDue
            };
          })
          .sort((a: any, b: any) => a.daysUntilDue - b.daysUntilDue)
          .slice(0, 4); // Show next 4 bills

        setUpcomingBills(upcoming);
      }
    };

    loadBills();
  }, []);

  // Calculate budget progress for each category
  const budgetProgress = useMemo(() => {
    // Show all categories (both core and custom), sorted by allocated amount (highest first)
    // Categories with 0 allocation go to the end
    const sortedCategories = [...budget.categories].sort((a, b) => {
      if (a.allocated === 0 && b.allocated === 0) return 0;
      if (a.allocated === 0) return 1;
      if (b.allocated === 0) return -1;
      return b.allocated - a.allocated;
    });

    return sortedCategories.map(category => {
      // Calculate total spent in this category
      const spent = transactions
        .filter(transaction => transaction.category === category.category)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const percentage = category.allocated > 0 ? Math.round((spent / category.allocated) * 100) : 0;
      const isCore = CoreCategories.includes(category.category as any);

      return {
        category: CategoryLabels[category.category] || category.category,
        spent: spent,
        budget: category.allocated,
        percentage: percentage,
        needsSetup: category.allocated === 0,
        isCore: isCore,
        isCustom: !isCore
      };
    });
  }, [budget.categories, transactions]);

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Show loading state while data is loading
  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loading Dashboard...</h1>
          <p className="text-gray-600">Please wait while we load your financial data.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.display_name || profile?.username}!
        </h1>
        <p className="text-gray-600">
          Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {monthlyStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-3 bg-mint-50 rounded-lg">
                  <IconComponent className="w-6 h-6 text-mint-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-sm ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Budget Progress</h2>
            {budgetProgress.filter(item => item.isCustom).length > 0 && (
              <span className="text-sm text-gray-500">
                {budgetProgress.length} categories ({budgetProgress.filter(item => item.isCustom).length} custom)
              </span>
            )}
          </div>
          <div className="space-y-4">
            {budgetProgress.length > 0 ? (
              budgetProgress.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                      {item.isCustom && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {item.needsSetup ? (
                        <span className="text-amber-600">Needs setup</span>
                      ) : (
                        <>${item.spent.toLocaleString()} / ${item.budget.toLocaleString()}</>
                      )}
                    </span>
                  </div>
                  {!item.needsSetup ? (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(item.percentage)}`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.percentage}% used
                        {item.percentage > 100 && (
                          <span className="text-red-600 font-medium"> (Over budget!)</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-amber-600 mt-1">
                      Set a budget amount in the Budget tab
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Set Up Your Budget Categories
                </h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Get started by setting up your core budget categories to track your spending and see progress here.
                </p>
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
            )}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bills</h2>
          <div className="space-y-3">
            {upcomingBills.length > 0 ? (
              upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    {bill.status === 'overdue' && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{bill.name}</p>
                      <p className="text-sm text-gray-600">Due {bill.dueDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${bill.amount}</p>
                    <p className={`text-xs ${bill.status === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
                      {bill.status === 'overdue' ? 'Overdue' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No upcoming bills found.</p>
                <p className="text-sm">Add bills in the Bills section to see them here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Family Transactions</h2>
          <button className="text-mint-600 hover:text-mint-700 text-sm font-medium">
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Member</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">{transaction.member}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{transaction.description}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{transaction.date}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <TrendingDown className="w-8 h-8 mb-2 text-gray-300" />
                      <p>No transactions found.</p>
                      <p className="text-sm">Add transactions to see them here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;