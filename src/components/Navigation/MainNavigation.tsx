import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  PiggyBank,
  Receipt,
  Users,
  Calendar,
  BarChart3,
  LogOut,
  User,
  ChevronDown,
  Settings,
  HelpCircle,
  Menu,
  MoreHorizontal,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBudget } from '../../contexts/BudgetContextSupabase';

// Import page components
import DashboardPage from '../../pages/DashboardPage';
import BudgetPage from '../../pages/BudgetPage';
import TransactionsPage from '../../pages/TransactionsPage';
import SavingsPage from '../../pages/SavingsPage';
import HouseholdPage from '../../pages/HouseholdPage';
import BillsPage from '../../pages/BillsPage';
import ReportsPage from '../../pages/ReportsPage';

const MainNavigation: React.FC = () => {
  const { user, profile, household, signOut } = useAuth();
  const { currentPeriod, historicalPeriods, loadHistoricalPeriod, refreshCurrentPeriod } = useBudget();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const tabs = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, component: DashboardPage },
    { path: '/budget', label: 'Budget', icon: PiggyBank, component: BudgetPage },
    { path: '/savings', label: 'Savings', icon: Target, component: SavingsPage },
    { path: '/transactions', label: 'Transactions', icon: Receipt, component: TransactionsPage },
    { path: '/household', label: 'Household', icon: Users, component: HouseholdPage },
    { path: '/bills', label: 'Bills', icon: Calendar, component: BillsPage },
    { path: '/reports', label: 'Reports', icon: BarChart3, component: ReportsPage },
  ];

  const mainTabs = tabs.slice(0, 3); // Dashboard, Budget, Savings for mobile
  const moreTabs = tabs.slice(3); // Transactions, Household, Bills, Reports for mobile "More" menu

  // Format period for display
  const formatPeriodName = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get current period display name
  const getCurrentPeriodName = () => {
    if (currentPeriod) {
      return formatPeriodName(currentPeriod.year, currentPeriod.month);
    }
    const now = new Date();
    return formatPeriodName(now.getFullYear(), now.getMonth());
  };

  // Get tier limits for historical periods
  const getTierLimits = () => {
    const isPaid = household?.subscription_status === 'active' || household?.subscription_status === 'trialing';
    return {
      isPaid,
      maxHistoricalPeriods: isPaid ? 23 : 1, // 24 total for paid (current + 23), 2 total for free (current + 1)
      tierName: isPaid ? '💎 Premium' : '🆓 Free'
    };
  };

  // Get available periods (current + historical) with tier restrictions
  const getAvailablePeriods = (): Array<{
    id: string;
    name: string;
    isCurrent: boolean;
    year: number;
    month: number;
    totalSpent?: number;
    categoryCount?: number;
  }> => {
    const periods = [];
    const { maxHistoricalPeriods } = getTierLimits();

    // Add current period
    if (currentPeriod) {
      periods.push({
        id: currentPeriod.id,
        name: formatPeriodName(currentPeriod.year, currentPeriod.month),
        isCurrent: true,
        year: currentPeriod.year,
        month: currentPeriod.month
      });
    }

    // Add historical periods (limited by tier)
    const allowedHistorical = historicalPeriods.slice(0, maxHistoricalPeriods);
    allowedHistorical.forEach(historical => {
      periods.push({
        id: historical.period.id,
        name: formatPeriodName(historical.period.year, historical.period.month),
        isCurrent: false,
        year: historical.period.year,
        month: historical.period.month,
        totalSpent: historical.totalSpent,
        categoryCount: historical.categoryCount
      });
    });

    // Sort by date (newest first)
    return periods.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const availablePeriods = getAvailablePeriods();
  const { isPaid, maxHistoricalPeriods, tierName } = getTierLimits();
  const hasMoreHistoricalData = historicalPeriods.length > maxHistoricalPeriods;

  // Handle period selection
  const handlePeriodSelect = async (periodId: string, isCurrent: boolean) => {
    if (isCurrent) {
      // Switch back to current period
      await refreshCurrentPeriod();
    } else {
      // Load historical period
      await loadHistoricalPeriod(periodId);
    }
    setShowMonthDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header with Logo and User Info */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Centsible Logo" className="h-10 w-auto" />
            </div>

            {/* Right Side: Month Selector and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Month/Period Selector */}
              <div className="relative" ref={monthDropdownRef}>
                <button
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">{getCurrentPeriodName()}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Month Dropdown */}
                {showMonthDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {availablePeriods.length > 0 ? (
                        <>
                          {availablePeriods.map((period) => (
                            <button
                              key={period.id}
                              onClick={() => handlePeriodSelect(period.id, period.isCurrent)}
                              className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${
                                period.isCurrent ? 'bg-mint-50 text-mint-700 border-l-4 border-mint-500' : 'text-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">
                                    {period.name}
                                    {period.isCurrent && <span className="ml-2 text-xs text-mint-600">(Current)</span>}
                                  </div>
                                  {!period.isCurrent && period.totalSpent !== undefined && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      ${period.totalSpent.toLocaleString()} • {period.categoryCount} categories
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}

                          {/* Tier Information and Limits */}
                          <div className="border-t border-gray-100">
                            {historicalPeriods.length === 0 ? (
                              <div className="px-4 py-3">
                                <div className="text-xs text-gray-500 text-center">
                                  🎉 Welcome! This is your first month.
                                  <br />
                                  Historical periods will appear here as you use the app.
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Tier Status */}
                                <div className="px-4 py-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">
                                      {tierName} • {availablePeriods.length - 1}/{maxHistoricalPeriods} historical months
                                    </span>
                                  </div>
                                </div>

                                {/* Upgrade Prompt for Free Users */}
                                {!isPaid && hasMoreHistoricalData && (
                                  <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-gray-100">
                                    <div className="text-center">
                                      <div className="text-xs font-medium text-purple-700 mb-1">
                                        💎 Unlock {historicalPeriods.length - maxHistoricalPeriods} More Months
                                      </div>
                                      <div className="text-xs text-purple-600 mb-2">
                                        Premium gives you 24 months of budget history
                                      </div>
                                      <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors">
                                        Upgrade to Premium
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Free User Preview */}
                                {!isPaid && !hasMoreHistoricalData && historicalPeriods.length > 0 && (
                                  <div className="px-4 py-2 bg-blue-50 border-t border-gray-100">
                                    <div className="text-center">
                                      <div className="text-xs text-blue-700">
                                        💎 Premium: Access up to 24 months of history
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="px-4 py-3 text-center">
                          <div className="text-sm text-gray-600 mb-2">Welcome to Centsible!</div>
                          <div className="text-xs text-gray-500">
                            Start by setting up your first budget.
                            <br />
                            Historical periods will appear here over time.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="w-8 h-8 p-1 bg-gray-100 rounded-full text-gray-600" />
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.display_name || profile?.username}
                        </p>
                        <p className="text-xs text-gray-500">@{profile?.username}</p>
                        {household?.household_name && (
                          <p className="text-xs text-mint-600 mt-1">{household.household_name}</p>
                        )}
                      </div>

                      {/* Menu Items */}
                      <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <HelpCircle className="w-4 h-4" />
                        <span>Help & Support</span>
                      </button>

                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={signOut}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Top Tabs Navigation */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-0">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-mint-500 text-mint-600 bg-mint-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <tab.icon className={`w-5 h-5 ${isActive ? 'text-mint-600' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
          <div className="bg-white w-64 h-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-mint-50 text-mint-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <tab.icon className={`w-5 h-5 ${isActive ? 'text-mint-600' : 'text-gray-400'}`} />
                      <span>{tab.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow max-w-7xl mx-auto px-4 py-6 w-full">
        <Routes>
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Page routes */}
          {tabs.map((tab) => (
            <Route
              key={tab.path}
              path={tab.path}
              element={<tab.component />}
            />
          ))}

          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Centsible. All rights reserved.
            </div>

            {/* Links */}
            <div className="flex items-center space-x-6">
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Privacy Policy
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Terms of Service
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Contact Support
              </button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                About
              </button>
            </div>

            {/* Version/Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All systems operational</span>
              <span className="text-gray-400">•</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <nav className="flex">
          {/* Main Tabs */}
          {mainTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
                  isActive ? 'text-mint-600' : 'text-gray-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <tab.icon className={`w-6 h-6 ${isActive ? 'text-mint-600' : 'text-gray-400'}`} />
                  <span className="text-xs mt-1 font-medium">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileTab"
                      className="w-1 h-1 bg-mint-500 rounded-full mt-1"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* More Menu */}
          <div className="flex-1 relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`w-full flex flex-col items-center py-2 px-1 transition-colors ${
                showMoreMenu ? 'text-mint-600' : 'text-gray-500'
              }`}
            >
              <MoreHorizontal className={`w-6 h-6 ${showMoreMenu ? 'text-mint-600' : 'text-gray-400'}`} />
              <span className="text-xs mt-1 font-medium">More</span>
            </button>

            {/* More Menu Dropdown */}
            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {moreTabs.map((tab) => (
                    <NavLink
                      key={tab.path}
                      to={tab.path}
                      onClick={() => setShowMoreMenu(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                          isActive
                            ? 'bg-mint-50 text-mint-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <tab.icon className={`w-5 h-5 ${isActive ? 'text-mint-600' : 'text-gray-400'}`} />
                          <span>{tab.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MainNavigation;