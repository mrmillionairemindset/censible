import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  Target,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  Plane,
  Home,
  Car,
  GraduationCap,
  Heart,
  Shield,
  DollarSign,
  Calendar,
  CheckCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SavingsGoal {
  id: string;
  name: string;
  type: 'emergency' | 'vacation' | 'purchase' | 'education' | 'retirement' | 'other';
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  autoContribute?: number; // Monthly auto-contribution
  contributors: string[];
  notes?: string;
  createdAt: string;
  icon?: string;
}

// Storage utility functions outside component to avoid JSX syntax issues
const getStorageKey = (dataType: string, householdId: string) => {
  return `centsible_${dataType}_${householdId || 'default'}`;
};

const loadFromStorage = (dataType: string, defaultValue: any, householdId: string): any => {
  try {
    const stored = localStorage.getItem(getStorageKey(dataType, householdId));
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to load ${dataType} from storage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (dataType: string, data: any, householdId: string) => {
  try {
    localStorage.setItem(getStorageKey(dataType, householdId), JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${dataType} to storage:`, error);
  }
};

const SavingsPage: React.FC = () => {
  const { household, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'history'>('overview');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const householdId = household?.household_id || 'default';
  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'emergency' as 'emergency' | 'vacation' | 'purchase' | 'education' | 'retirement' | 'other',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    autoContribute: '',
    notes: ''
  });

  // Default mock data for first-time users
  const defaultGoals: SavingsGoal[] = [
    {
      id: '1',
      name: 'Emergency Fund',
      type: 'emergency',
      targetAmount: 10000,
      currentAmount: 6500,
      priority: 'high',
      autoContribute: 500,
      contributors: ['Sarah', 'Mike'],
      notes: '6 months of expenses',
      createdAt: '2024-01-01',
      icon: '🚨'
    },
    {
      id: '2',
      name: 'Summer Europe Trip',
      type: 'vacation',
      targetAmount: 5000,
      currentAmount: 2100,
      deadline: '2025-06-01',
      priority: 'medium',
      autoContribute: 300,
      contributors: ['Sarah', 'Mike'],
      notes: '2 weeks in Italy and France',
      createdAt: '2024-03-01',
      icon: '✈️'
    },
    {
      id: '3',
      name: 'New Car Down Payment',
      type: 'purchase',
      targetAmount: 8000,
      currentAmount: 3200,
      deadline: '2025-12-01',
      priority: 'medium',
      autoContribute: 400,
      contributors: ['Mike'],
      notes: 'Replace the old sedan',
      createdAt: '2024-02-15',
      icon: '🚗'
    },
    {
      id: '4',
      name: "Emma's College Fund",
      type: 'education',
      targetAmount: 50000,
      currentAmount: 12000,
      deadline: '2028-09-01',
      priority: 'high',
      autoContribute: 750,
      contributors: ['Sarah', 'Mike'],
      notes: 'University tuition and expenses',
      createdAt: '2023-01-01',
      icon: '🎓'
    }
  ];

  // Load savings goals from localStorage or use defaults
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() =>
    loadFromStorage('savings_goals', defaultGoals, householdId)
  );

  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const monthlyContributions = savingsGoals.reduce((sum, goal) => sum + (goal.autoContribute || 0), 0);

  // Effect to save data whenever it changes
  useEffect(() => {
    saveToStorage('savings_goals', savingsGoals, householdId);
  }, [savingsGoals, householdId]);

  // Effect to reload data when household changes
  useEffect(() => {
    if (household?.household_id) {
      setSavingsGoals(loadFromStorage('savings_goals', [], householdId));
    }
  }, [household?.household_id, householdId]);

  // Handler to add or update a goal
  const handleSaveGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) return;

    if (editingGoal) {
      // Update existing goal
      setSavingsGoals(prev => prev.map(goal =>
        goal.id === editingGoal
          ? {
              ...goal,
              name: newGoal.name,
              type: newGoal.type,
              targetAmount: parseFloat(newGoal.targetAmount),
              currentAmount: parseFloat(newGoal.currentAmount || '0'),
              deadline: newGoal.deadline || undefined,
              priority: newGoal.priority,
              autoContribute: parseFloat(newGoal.autoContribute) || undefined,
              notes: newGoal.notes || undefined
            }
          : goal
      ));
      setEditingGoal(null);
    } else {
      // Add new goal
      const goal: SavingsGoal = {
        id: Date.now().toString(),
        name: newGoal.name,
        type: newGoal.type,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: parseFloat(newGoal.currentAmount || '0'),
        deadline: newGoal.deadline || undefined,
        priority: newGoal.priority,
        autoContribute: parseFloat(newGoal.autoContribute) || undefined,
        contributors: [profile?.username || 'You'],
        notes: newGoal.notes || undefined,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setSavingsGoals(prev => [...prev, goal]);
    }

    // Reset form
    setNewGoal({
      name: '',
      type: 'emergency',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      priority: 'medium',
      autoContribute: '',
      notes: ''
    });
    setShowAddGoal(false);
  };

  // Handler to edit a goal
  const handleEditGoal = (goalId: string) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal) {
      setNewGoal({
        name: goal.name,
        type: goal.type,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        deadline: goal.deadline || '',
        priority: goal.priority,
        autoContribute: goal.autoContribute?.toString() || '',
        notes: goal.notes || ''
      });
      setEditingGoal(goalId);
      setShowAddGoal(true);
    }
  };

  // Handler to delete a goal
  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      setSavingsGoals(prev => prev.filter(goal => goal.id !== goalId));
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'emergency': return Shield;
      case 'vacation': return Plane;
      case 'purchase': return Home;
      case 'education': return GraduationCap;
      case 'retirement': return Heart;
      default: return PiggyBank;
    }
  };

  const getGoalColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'text-red-600 bg-red-50';
      case 'vacation': return 'text-blue-600 bg-blue-50';
      case 'purchase': return 'text-green-600 bg-green-50';
      case 'education': return 'text-purple-600 bg-purple-50';
      case 'retirement': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getTimeRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const targetDate = new Date(deadline);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Saved</p>
              <p className="text-2xl font-bold text-green-600">${totalSaved.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <PiggyBank className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Goals</p>
              <p className="text-2xl font-bold text-blue-600">${totalTarget.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Savings</p>
              <p className="text-2xl font-bold text-purple-600">${monthlyContributions.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-mint-600">
                {Math.round((totalSaved / totalTarget) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-mint-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-mint-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Goals Grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Savings Goals</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsGoals.map((goal) => {
            const progress = getProgress(goal.currentAmount, goal.targetAmount);
            const IconComponent = getGoalIcon(goal.type);
            const timeLeft = getTimeRemaining(goal.deadline);

            return (
              <div key={goal.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getGoalColor(goal.type).split(' ')[1]}`}>
                      <IconComponent className={`w-5 h-5 ${getGoalColor(goal.type).split(' ')[0]}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(goal.priority)}`}>
                          {goal.priority} priority
                        </span>
                        {timeLeft && (
                          <span className="text-xs text-gray-500">
                            {timeLeft} left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditGoal(goal.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Edit goal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-mint-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% complete</p>
                  </div>

                  {goal.autoContribute && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly contribution</span>
                      <span className="font-medium text-green-600">+${goal.autoContribute}</span>
                    </div>
                  )}

                  {goal.notes && (
                    <p className="text-sm text-gray-600 italic">{goal.notes}</p>
                  )}

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{goal.contributors.join(', ')}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 text-sm bg-mint-50 text-mint-700 px-3 py-1.5 rounded hover:bg-mint-100">
                    Add Funds
                  </button>
                  <button className="flex-1 text-sm bg-gray-50 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Savings Goals</h3>
        <button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Goal</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Type</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Priority</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Target</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Saved</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Progress</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Deadline</th>
              <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {savingsGoals.map((goal) => {
              const progress = getProgress(goal.currentAmount, goal.targetAmount);
              const IconComponent = getGoalIcon(goal.type);

              return (
                <tr key={goal.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`w-4 h-4 ${getGoalColor(goal.type).split(' ')[0]}`} />
                      <span className="font-medium text-gray-900">{goal.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="capitalize text-gray-700">{goal.type}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-gray-900">
                    ${goal.targetAmount.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-green-600">
                    ${goal.currentAmount.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-mint-500 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-gray-600">
                    {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        className="text-mint-600 hover:text-mint-700"
                        title="Add funds"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditGoal(goal.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit goal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
        <p className="text-gray-600">
          Track your {household?.household_name || 'family'}'s savings goals and financial milestones
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'goals', label: 'All Goals', icon: Target }
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
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'goals' && renderGoalsTab()}

      {/* Add Goal Modal/Form */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Emergency Fund, Vacation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                  >
                    <option value="emergency">Emergency Fund</option>
                    <option value="vacation">Vacation/Trip</option>
                    <option value="purchase">Major Purchase</option>
                    <option value="education">Education</option>
                    <option value="retirement">Retirement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newGoal.currentAmount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, currentAmount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date (optional)</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Contribution</label>
                <input
                  type="number"
                  step="0.01"
                  value={newGoal.autoContribute}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, autoContribute: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={newGoal.notes}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes or details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddGoal(false);
                  setEditingGoal(null);
                  setNewGoal({
                    name: '',
                    type: 'emergency',
                    targetAmount: '',
                    currentAmount: '',
                    deadline: '',
                    priority: 'medium',
                    autoContribute: '',
                    notes: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                disabled={!newGoal.name || !newGoal.targetAmount}
                className="px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsPage;