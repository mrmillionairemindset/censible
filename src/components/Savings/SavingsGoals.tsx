import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Edit3, Trash2, DollarSign, Calendar, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { SavingsGoal, SavingsGoalCategory, SavingsGoalCategoryLabels, SavingsGoalCategoryIcons } from '../../types';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface SavingsGoalsProps {
  totalMonthlyIncome?: number;
  totalMonthlyExpenses?: number;
}

const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  totalMonthlyIncome = 0,
  totalMonthlyExpenses = 0
}) => {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [showAddFundsId, setShowAddFundsId] = useState<string | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    category: 'custom' as SavingsGoalCategory,
    description: '',
    priority: 1
  });

  // Load savings goals from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('centsible_savings_goals');
    if (savedGoals) {
      const parsed = JSON.parse(savedGoals).map((goal: any) => ({
        ...goal,
        targetDate: new Date(goal.targetDate)
      }));
      setSavingsGoals(parsed);
    } else {
      // Initialize with demo data
      const demoGoals: SavingsGoal[] = [
        {
          id: '1',
          name: 'Emergency Fund',
          targetAmount: 15000,
          currentAmount: 3500,
          targetDate: new Date(2024, 11, 31),
          category: 'emergency-fund',
          priority: 1,
          isActive: true
        },
        {
          id: '2',
          name: 'Europe Vacation',
          targetAmount: 5000,
          currentAmount: 1200,
          targetDate: new Date(2024, 5, 15),
          category: 'vacation',
          priority: 2,
          isActive: true
        },
        {
          id: '3',
          name: 'New Car Down Payment',
          targetAmount: 8000,
          currentAmount: 2500,
          targetDate: new Date(2024, 8, 1),
          category: 'major-purchase',
          priority: 3,
          isActive: true
        }
      ];
      setSavingsGoals(demoGoals);
      localStorage.setItem('centsible_savings_goals', JSON.stringify(demoGoals));
    }
  }, []);

  // Save to localStorage whenever goals change
  useEffect(() => {
    if (savingsGoals.length > 0) {
      localStorage.setItem('centsible_savings_goals', JSON.stringify(savingsGoals));
    }
  }, [savingsGoals]);

  const calculateMonthsToGoal = (goal: SavingsGoal): number => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const availableForSavings = totalMonthlyIncome - totalMonthlyExpenses;

    if (availableForSavings <= 0) return Infinity;

    // Assume equal distribution among active goals for simplicity
    const activeGoals = savingsGoals.filter(g => g.isActive).length;
    const perGoalSavings = availableForSavings / Math.max(activeGoals, 1);

    return remaining / perGoalSavings;
  };

  const calculateRequiredMonthlySavings = (goal: SavingsGoal): number => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsLeft = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (monthsLeft <= 0) return remaining; // Need to save all remaining immediately
    return remaining / monthsLeft;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'from-green-400 to-green-600';
    if (percentage >= 75) return 'from-blue-400 to-green-500';
    if (percentage >= 50) return 'from-yellow-400 to-blue-500';
    if (percentage >= 25) return 'from-orange-400 to-yellow-500';
    return 'from-red-400 to-orange-500';
  };

  const sortedGoals = [...savingsGoals]
    .filter(goal => goal.isActive)
    .sort((a, b) => a.priority - b.priority);

  const totalTargetAmount = sortedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = sortedGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const goal: SavingsGoal = {
      id: uuidv4(),
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      targetDate: new Date(newGoal.targetDate),
      category: newGoal.category,
      priority: newGoal.priority,
      description: newGoal.description || undefined,
      isActive: true
    };

    setSavingsGoals([...savingsGoals, goal]);
    setNewGoal({
      name: '',
      targetAmount: '',
      targetDate: '',
      category: 'custom',
      description: '',
      priority: 1
    });
    setShowAddForm(false);
    toast.success('Savings goal added successfully!');
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate.toISOString().split('T')[0],
      category: goal.category,
      description: goal.description || '',
      priority: goal.priority
    });
    setShowAddForm(true);
  };

  const handleUpdateGoal = () => {
    if (!editingGoal || !newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedGoal: SavingsGoal = {
      ...editingGoal,
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      targetDate: new Date(newGoal.targetDate),
      category: newGoal.category,
      description: newGoal.description || undefined,
      priority: newGoal.priority
    };

    setSavingsGoals(savingsGoals.map(goal =>
      goal.id === editingGoal.id ? updatedGoal : goal
    ));

    setEditingGoal(null);
    setNewGoal({
      name: '',
      targetAmount: '',
      targetDate: '',
      category: 'custom',
      description: '',
      priority: 1
    });
    setShowAddForm(false);
    toast.success('Savings goal updated successfully!');
  };

  const handleDeleteGoal = (id: string) => {
    setSavingsGoals(savingsGoals.filter(goal => goal.id !== id));
    toast.success('Savings goal deleted');
  };

  const handleAddFunds = (goalId: string) => {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSavingsGoals(savingsGoals.map(goal =>
      goal.id === goalId
        ? { ...goal, currentAmount: goal.currentAmount + amount }
        : goal
    ));

    setShowAddFundsId(null);
    setAddFundsAmount('');
    toast.success(`$${amount} added to savings goal!`);
  };

  const movePriority = (goalId: string, direction: 'up' | 'down') => {
    const goalIndex = savingsGoals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;

    const newGoals = [...savingsGoals];
    const currentGoal = newGoals[goalIndex];

    if (direction === 'up' && currentGoal.priority > 1) {
      // Find goal with priority one higher and swap
      const higherPriorityGoal = newGoals.find(g => g.priority === currentGoal.priority - 1);
      if (higherPriorityGoal) {
        higherPriorityGoal.priority += 1;
        currentGoal.priority -= 1;
      }
    } else if (direction === 'down') {
      // Find goal with priority one lower and swap
      const lowerPriorityGoal = newGoals.find(g => g.priority === currentGoal.priority + 1);
      if (lowerPriorityGoal) {
        lowerPriorityGoal.priority -= 1;
        currentGoal.priority += 1;
      }
    }

    setSavingsGoals(newGoals);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Savings Goals</h2>
            <p className="text-sm text-gray-600">Track your savings progress</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {/* Total Progress Card */}
      {sortedGoals.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-blue-700 mb-1">Total Savings Progress</p>
              <p className="text-2xl font-bold text-blue-800">
                ${totalCurrentAmount.toFixed(0)} / ${totalTargetAmount.toFixed(0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{totalProgress.toFixed(1)}%</p>
              <p className="text-xs text-blue-600">{sortedGoals.length} active goals</p>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(totalProgress, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Savings Goals List */}
      <div className="space-y-4 mb-6">
        <AnimatePresence>
          {sortedGoals.map((goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const requiredMonthlySavings = calculateRequiredMonthlySavings(goal);
            const monthsToGoal = calculateMonthsToGoal(goal);
            const daysUntilTarget = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{SavingsGoalCategoryIcons[goal.category]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-800 truncate">{goal.name}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                          Priority #{goal.priority}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full whitespace-nowrap">
                          {SavingsGoalCategoryLabels[goal.category]}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{goal.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="whitespace-nowrap">${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {daysUntilTarget > 0 ? `${daysUntilTarget} days left` : 'Overdue'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Priority Controls */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => movePriority(goal.id, 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={goal.priority === 1}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => movePriority(goal.id, 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowAddFundsId(goal.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors whitespace-nowrap"
                      >
                        Add Funds
                      </button>
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Goal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-800">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${getProgressColor(progress)} rounded-full`}
                    />
                  </div>
                </div>

                {/* Goal Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className="font-medium text-gray-800">${remaining.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Required/Month</p>
                    <p className="font-medium text-gray-800">${requiredMonthlySavings.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">At Current Rate</p>
                    <p className="font-medium text-gray-800">
                      {monthsToGoal === Infinity ? '∞' : `${monthsToGoal.toFixed(0)}mo`}
                    </p>
                  </div>
                </div>

                {/* Add Funds Modal */}
                <AnimatePresence>
                  {showAddFundsId === goal.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="flex gap-3">
                        <input
                          type="number"
                          placeholder="Amount to add"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                          value={addFundsAmount}
                          onChange={(e) => setAddFundsAmount(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddFunds(goal.id)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddFunds(goal.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddFundsId(null);
                            setAddFundsAmount('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sortedGoals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No savings goals yet</p>
            <p className="text-sm">Add your first savings goal to get started</p>
          </div>
        )}
      </div>

      {/* Add/Edit Goal Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-6 overflow-hidden"
          >
            <h3 className="font-medium mb-4 text-gray-800">
              {editingGoal ? 'Edit Savings Goal' : 'Add New Savings Goal'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <input
                  type="text"
                  placeholder="Goal name (e.g., Emergency Fund)"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Target amount"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                />
              </div>
              <div>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value as SavingsGoalCategory})}
                >
                  {Object.entries(SavingsGoalCategoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {SavingsGoalCategoryIcons[key as SavingsGoalCategory]} {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Priority (1 = highest)"
                  min="1"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: parseInt(e.target.value) || 1})}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {editingGoal ? 'Update Goal' : 'Add Goal'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingGoal(null);
                  setNewGoal({
                    name: '',
                    targetAmount: '',
                    targetDate: '',
                    category: 'custom',
                    description: '',
                    priority: 1
                  });
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SavingsGoals;