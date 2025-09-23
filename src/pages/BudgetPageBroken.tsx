import React, { useState } from 'react';
import { Plus, Edit3, Users, TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, Wallet, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContextSupabase';
import { IncomeSource } from '../types';

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  memberLimits?: { [memberId: string]: number };
  type: 'shared' | 'individual';
  color: string;
}

interface FamilyMember {
  id: string;
  name: string;
  type: 'adult' | 'child' | 'teen';
  monthlyAllowance: number;
  allowanceBalance: number;
  canEditBudget: boolean;
}

// IncomeSource interface imported from types

const BudgetPage: React.FC = () => {
  const { household, profile } = useAuth();
  const { incomeSources, setIncomeSources } = useBudget();
  const [activeTab, setActiveTab] = useState<'income' | 'overview' | 'categories' | 'members'>('income');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showAddIncome, setShowAddIncome] = useState(false);

  // Form state for adding income
  const [newIncome, setNewIncome] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as const,
    type: 'salary' as const
  });

  // Handler to add new income source
  const handleAddIncome = () => {
    if (!newIncome.name || !newIncome.amount) return;

    const incomeSource: IncomeSource = {
      id: Date.now().toString(),
      source: newIncome.name,
      amount: parseFloat(newIncome.amount),
      frequency: newIncome.frequency as any, // Convert to IncomeFrequency
      startDate: new Date(),
      isActive: true,
      category: newIncome.type as any,
      description: `Added by ${profile?.display_name || 'User'}`
    };

    setIncomeSources([...incomeSources, incomeSource]);
    setNewIncome({ name: '', amount: '', frequency: 'monthly', type: 'salary' });
    setShowAddIncome(false);
  };

  // Mock data - will be replaced with real data from database
  const familyMembers: FamilyMember[] = [
    { id: '1', name: 'Sarah (You)', type: 'adult', monthlyAllowance: 0, allowanceBalance: 0, canEditBudget: true },
    { id: '2', name: 'Mike', type: 'adult', monthlyAllowance: 0, allowanceBalance: 0, canEditBudget: true },
    { id: '3', name: 'Emma', type: 'teen', monthlyAllowance: 50, allowanceBalance: 23.50, canEditBudget: false },
    { id: '4', name: 'Jake', type: 'child', monthlyAllowance: 25, allowanceBalance: 18.75, canEditBudget: false }
  ];

  // Income sources now come from the budget context

  const budgetCategories: BudgetCategory[] = [
    {
      id: '1',
      name: 'Groceries',
      budgeted: 600,
      spent: 420,
      remaining: 180,
      type: 'shared',
      color: 'bg-green-500',
      memberLimits: {}
    },
    {
      id: '2',
      name: 'Transportation',
      budgeted: 250,
      spent: 180,
      remaining: 70,
      type: 'shared',
      color: 'bg-blue-500',
      memberLimits: {}
    },
    {
      id: '3',
      name: 'Entertainment',
      budgeted: 200,
      spent: 95,
      remaining: 105,
      type: 'individual',
      color: 'bg-purple-500',
      memberLimits: { '1': 80, '2': 80, '3': 25, '4': 15 }
    },
    {
      id: '4',
      name: 'Dining Out',
      budgeted: 150,
      spent: 156,
      remaining: -6,
      type: 'shared',
      color: 'bg-orange-500',
      memberLimits: {}
    },
    {
      id: '5',
      name: 'Personal Care',
      budgeted: 120,
      spent: 67,
      remaining: 53,
      type: 'individual',
      color: 'bg-pink-500',
      memberLimits: { '1': 40, '2': 30, '3': 30, '4': 20 }
    },
    {
      id: '6',
      name: 'Utilities',
      budgeted: 300,
      spent: 245,
      remaining: 55,
      type: 'shared',
      color: 'bg-yellow-500',
      memberLimits: {}
    }
  ];

  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  // Calculate monthly income
  const calculateMonthlyIncome = () => {
    return incomeSources.reduce((total, source) => {
      switch (source.frequency) {
        case 'weekly':
          return total + (source.amount * 52) / 12;
        case 'bi-weekly':
          return total + (source.amount * 26) / 12;
        case 'monthly':
          return total + source.amount;
        case 'one-time':
          return total; // Don't count one-time in regular monthly
        default:
          return total;
      }
    }, 0);
  };

  const totalMonthlyIncome = calculateMonthlyIncome();
  const netIncome = totalMonthlyIncome - totalBudgeted;

  const getProgressPercentage = (spent: number, budgeted: number) => {
    return Math.min((spent / budgeted) * 100, 100);
  };

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'one-time': return 'One-time';
      default: return frequency;
    }
  };

  const getIncomeTypeIcon = (type: string) => {
    switch (type) {
      case 'salary': return '💼';
      case 'freelance': return '💻';
      case 'investment': return '📈';
      case 'other': return '💰';
      default: return '💵';
    }
  };

  const renderIncomeTab = () => (
    <div className="space-y-6">
      {/* Income Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">${totalMonthlyIncome.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budgeted</p>
              <p className="text-2xl font-bold text-gray-900">${totalBudgeted.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              {((totalBudgeted / totalMonthlyIncome) * 100).toFixed(1)}% of income
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Income</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(netIncome).toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <DollarSign className={`w-6 h-6 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="mt-2">
            <p className={`text-sm ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netIncome >= 0 ? 'Available to save' : 'Budget deficit'}
            </p>
          </div>
        </div>
      </div>

      {/* Add Income Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Income Sources</h3>
        <button
          onClick={() => setShowAddIncome(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income</span>
        </button>
      </div>

      {/* Income Sources List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Source</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Member</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Amount</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Frequency</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Monthly Value</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Next Date</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {incomeSources.map((source) => {
              let monthlyValue = source.amount;
              if (source.frequency === 'weekly') monthlyValue = (source.amount * 52) / 12;
              if (source.frequency === 'bi-weekly') monthlyValue = (source.amount * 26) / 12;
              if (source.frequency === 'one-time') monthlyValue = 0;

              return (
                <tr key={source.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getIncomeTypeIcon(source.category || 'other')}</span>
                      <span className="font-medium text-gray-900">{source.source}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-700">{source.description || 'You'}</td>
                  <td className="py-4 px-6 text-right font-medium text-gray-900">
                    ${source.amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      source.frequency === 'monthly'
                        ? 'bg-blue-100 text-blue-800'
                        : source.frequency === 'one-time'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getFrequencyText(source.frequency)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-green-600">
                    ${monthlyValue.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-gray-600">
                    {source.startDate ? new Date(source.startDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={4} className="py-3 px-6 text-sm font-medium text-gray-600">
                Total Monthly Income
              </td>
              <td className="py-3 px-6 text-right text-lg font-bold text-green-600">
                ${totalMonthlyIncome.toLocaleString()}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Quick Add Income Form (shown when button clicked) */}
      {showAddIncome && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Add New Income Source</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Income Name</label>
              <input
                type="text"
                value={newIncome.name}
                onChange={(e) => setNewIncome(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monthly Salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={newIncome.amount}
                onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={newIncome.frequency}
                onChange={(e) => setNewIncome(prev => ({ ...prev, frequency: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
              >
                <option value="monthly">Monthly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newIncome.type}
                onChange={(e) => setNewIncome(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
              >
                <option value="salary">Salary</option>
                <option value="freelance">Freelance</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddIncome(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddIncome}
              disabled={!newIncome.name || !newIncome.amount}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Income
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budgeted</p>
              <p className="text-2xl font-bold text-gray-900">${totalBudgeted.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {((totalSpent / totalBudgeted) * 100).toFixed(1)}% of budget used
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalRemaining).toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${totalRemaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <TrendingUp className={`w-6 h-6 ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="mt-4">
            <p className={`text-sm ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Category Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetCategories.map((category) => (
            <div key={category.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                  {category.type === 'individual' && (
                    <Users className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  ${category.spent} / ${category.budgeted}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(category.spent, category.budgeted)}`}
                  style={{ width: `${getProgressPercentage(category.spent, category.budgeted)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{getProgressPercentage(category.spent, category.budgeted).toFixed(1)}% used</span>
                <span className={category.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${Math.abs(category.remaining)} {category.remaining >= 0 ? 'left' : 'over'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Budget Categories</h3>
        <button className="flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Category</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Type</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Budgeted</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Spent</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Remaining</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Progress</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgetCategories.map((category) => (
              <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      category.type === 'shared'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {category.type === 'shared' ? 'Shared' : 'Individual'}
                    </span>
                    {category.type === 'individual' && (
                      <Users className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-right font-medium text-gray-900">
                  ${category.budgeted}
                </td>
                <td className="py-4 px-6 text-right text-gray-900">
                  ${category.spent}
                </td>
                <td className={`py-4 px-6 text-right font-medium ${
                  category.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {category.remaining >= 0 ? '+' : '-'}${Math.abs(category.remaining)}
                </td>
                <td className="py-4 px-6">
                  <div className="w-20 mx-auto">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(category.spent, category.budgeted)}`}
                        style={{ width: `${getProgressPercentage(category.spent, category.budgeted)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-center text-gray-500 mt-1">
                      {getProgressPercentage(category.spent, category.budgeted).toFixed(0)}%
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <button
                    onClick={() => setEditingCategory(category.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Family Member Limits & Allowances</h3>
        <button className="flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700">
          <Users className="w-4 h-4" />
          <span>Manage Members</span>
        </button>
      </div>

      {/* Allowance Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Allowance Balances</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {familyMembers.filter(member => member.monthlyAllowance > 0).map((member) => (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{member.name}</span>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly:</span>
                  <span className="font-medium">${member.monthlyAllowance}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance:</span>
                  <span className={`font-medium ${member.allowanceBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${member.allowanceBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Category Limits */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Individual Category Limits</h4>
        <div className="space-y-4">
          {budgetCategories.filter(cat => cat.type === 'individual').map((category) => (
            <div key={category.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                <span className="font-medium text-gray-900">{category.name}</span>
                <span className="text-sm text-gray-600">
                  (Total: ${category.budgeted})
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {familyMembers.map((member) => {
                  const limit = category.memberLimits?.[member.id] || 0;
                  return (
                    <div key={member.id} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-lg font-bold text-mint-600">${limit}</div>
                      <button className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Family Budget</h1>
        <p className="text-gray-600">
          Manage your {household?.household_name || 'family'} budget categories and member spending limits
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'income', label: 'Income', icon: Wallet },
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'categories', label: 'Categories', icon: Target },
            { id: 'members', label: 'Member Limits', icon: Users }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-mint-500 text-mint-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'income' && renderIncomeTab()}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'categories' && renderCategoriesTab()}
      {activeTab === 'members' && renderMembersTab()}
    </div>
  );
};

export default BudgetPage;