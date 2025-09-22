import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Edit3, Trash2, Calendar, ArrowUp, ArrowDown, Info, AlertTriangle } from 'lucide-react';
import { SavingsGoal, SavingsGoalCategory, SavingsGoalCategoryInput, SavingsGoalCategoryLabels, SavingsGoalCategoryIcons } from '../../types';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useBudget } from '../../contexts/BudgetContextSupabase';
import { toDateSafe, monthsBetween } from '../../utils/dates';

interface SavingsGoalsProps {
  totalMonthlyIncome?: number;
  totalMonthlyExpenses?: number;
}

const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  totalMonthlyIncome = 0,
  totalMonthlyExpenses = 0
}) => {
  const { savingsGoals, setSavingsGoals, budget } = useBudget();

  // Calculate total budget allocations
  const totalBudgetAllocated = budget.categories.reduce((sum, category) => sum + category.allocated, 0);

  // Use budget allocations if available, otherwise fall back to tracked expenses
  const monthlyExpenseReference = totalBudgetAllocated > 0 ? totalBudgetAllocated : totalMonthlyExpenses;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [mode, setMode] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [highlightedGoalId, setHighlightedGoalId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    category: undefined as SavingsGoalCategoryInput,
    description: '',
    priority: 1
  });

  // Normalize priorities to ensure they are sequential (1, 2, 3, ...)
  const normalizePriorities = (goals: SavingsGoal[]): SavingsGoal[] => {
    const sortedGoals = [...goals].sort((a, b) => a.priority - b.priority);
    return sortedGoals.map((goal, index) => ({
      ...goal,
      priority: index + 1
    }));
  };

  // No demo data - users start fresh with context data

  // Context handles saving to storage

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
    const targetDate = toDateSafe(goal.targetDate);
    if (!targetDate) return 0;

    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsLeft = monthsBetween(new Date(), targetDate);

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
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.category) {
      toast.error('Please fill in all required fields including category');
      return;
    }

    const goalId = uuidv4();

    const goal: SavingsGoal = {
      id: goalId,
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      category: newGoal.category as SavingsGoalCategory,
      priority: newGoal.priority || (savingsGoals.length + 1),
      description: newGoal.description || undefined,
      isActive: true
    };

    // Add the new goal and normalize all priorities
    const updatedGoals = [...savingsGoals, goal];
    const normalizedGoals = normalizePriorities(updatedGoals);
    setSavingsGoals(normalizedGoals);

    // Reset form
    setNewGoal({
      name: '',
      targetAmount: '',
      targetDate: '',
      category: undefined,
      description: '',
      priority: 1
    });
    setShowAddForm(false);

    // Success feedback
    toast.success(`✅ New goal added: ${goal.name} (Target $${goal.targetAmount.toFixed(0)})`);

    // Highlight animation
    setHighlightedGoalId(goalId);
    setTimeout(() => setHighlightedGoalId(null), 1500);

    // Auto-scroll to new goal
    setTimeout(() => {
      const element = document.getElementById(`goal-${goalId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      targetDate: toDateSafe(goal.targetDate) ? toDateSafe(goal.targetDate)!.toISOString().split('T')[0] : '',
      category: goal.category,
      description: goal.description || '',
      priority: goal.priority
    });
    setShowAddForm(true);
  };

  const handleUpdateGoal = () => {
    if (!editingGoal || !newGoal.name || !newGoal.targetAmount || !newGoal.targetDate || !newGoal.category) {
      toast.error('Please fill in all required fields including category');
      return;
    }

    const updatedGoal: SavingsGoal = {
      ...editingGoal,
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      targetDate: new Date(newGoal.targetDate),
      category: newGoal.category as SavingsGoalCategory,
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
    const filteredGoals = savingsGoals.filter(goal => goal.id !== id);
    const normalizedGoals = normalizePriorities(filteredGoals);
    setSavingsGoals(normalizedGoals);
    toast.success('Savings goal deleted');
  };

  const handleSubmit = (goalId: string) => {
    const amountValue = parseFloat(amount);
    const goal = savingsGoals.find(g => g.id === goalId);

    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!goal) {
      toast.error('Goal not found');
      return;
    }

    if (mode === 'withdraw' && amountValue > goal.currentAmount) {
      toast.error(`Cannot withdraw more than current balance ($${goal.currentAmount.toFixed(2)})`);
      return;
    }

    setSavingsGoals(savingsGoals.map(g =>
      g.id === goalId
        ? {
            ...g,
            currentAmount: mode === 'add'
              ? g.currentAmount + amountValue
              : Math.max(0, g.currentAmount - amountValue)
          }
        : g
    ));

    setActiveGoalId(null);
    setAmount('');
    setMode('add');
    toast.success(`$${amountValue} ${mode === 'add' ? 'added to' : 'withdrawn from'} savings goal!`);
  };

  const handleQuickAmount = (goalId: string, quickValue: string | number) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal) return;

    if (mode === 'add') {
      setAmount(quickValue.toString());
    } else {
      // Handle percentage-based withdrawals
      let withdrawalAmount: number;
      if (quickValue === 'All') {
        withdrawalAmount = goal.currentAmount;
      } else {
        const percentage = parseInt(quickValue.toString().replace('%', '')) / 100;
        withdrawalAmount = Math.round(goal.currentAmount * percentage * 100) / 100;
      }
      setAmount(withdrawalAmount.toString());
    }
  };

  const movePriority = (goalId: string, direction: 'up' | 'down') => {
    const sortedGoals = [...savingsGoals].sort((a, b) => a.priority - b.priority);
    const currentIndex = sortedGoals.findIndex(g => g.id === goalId);

    if (currentIndex === -1) return;

    // Check bounds
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sortedGoals.length - 1) return;

    // Swap positions in the array
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reorderedGoals = [...sortedGoals];
    [reorderedGoals[currentIndex], reorderedGoals[newIndex]] = [reorderedGoals[newIndex], reorderedGoals[currentIndex]];

    // Normalize priorities to match the new order
    const normalizedGoals = reorderedGoals.map((goal, index) => ({
      ...goal,
      priority: index + 1
    }));

    setSavingsGoals(normalizedGoals);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Savings Goals</h1>
          <p className="text-sm text-gray-600 mt-1">Track your savings progress</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 h-11 px-6 bg-[#27AE60] text-white rounded-lg hover:bg-[#229954] transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Goal
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
          {sortedGoals.map((goal, index) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const requiredMonthlySavings = calculateRequiredMonthlySavings(goal);
            const monthsToGoal = calculateMonthsToGoal(goal);
            const targetDate = toDateSafe(goal.targetDate);
            const daysUntilTarget = targetDate ? Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
            const isFirst = index === 0;
            const isLast = index === sortedGoals.length - 1;

            return (
              <motion.div
                id={`goal-${goal.id}`}
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border rounded-lg p-4 transition-all overflow-hidden space-y-4 ${
                  highlightedGoalId === goal.id
                    ? 'border-green-400 bg-gradient-to-r from-green-50 to-transparent animate-pulse'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{SavingsGoalCategoryIcons[goal.category]}</span>
                    <div>
                      <h3 className="font-medium text-gray-800">{goal.name}</h3>
                      <span className="text-xs text-gray-500">Priority #{goal.priority}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => movePriority(goal.id, 'up')}
                      className={`p-1 rounded transition-colors ${
                        isFirst
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-gray-100'
                      }`}
                      title="Move up"
                      disabled={isFirst}
                    >
                      <ArrowUp className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => movePriority(goal.id, 'down')}
                      className={`p-1 rounded transition-colors ${
                        isLast
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-gray-100'
                      }`}
                      title="Move down"
                      disabled={isLast}
                    >
                      <ArrowDown className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Amount and Progress */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-lg font-bold text-gray-800">
                      ${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
                    </span>
                    <span className="text-sm font-medium text-gray-600">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-blue-400 to-green-500 h-full rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-600">
                    <span>${remaining.toFixed(0)} remaining</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {daysUntilTarget > 0 ? `${daysUntilTarget} days left` : 'Overdue'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setActiveGoalId(goal.id);
                    setMode('add');
                  }}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                >
                  Manage Funds
                </button>

                {/* Expanded Management Section */}
                <AnimatePresence>
                  {activeGoalId === goal.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 border-t border-gray-200 pt-4"
                    >
                      {/* Segmented Control */}
                      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                        <button
                          className={`flex-1 py-2 px-4 font-medium transition-colors ${
                            mode === 'add'
                              ? 'bg-green-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => setMode('add')}
                        >
                          Add
                        </button>
                        <button
                          className={`flex-1 py-2 px-4 font-medium transition-colors ${
                            mode === 'withdraw'
                              ? 'bg-orange-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          } ${goal.currentAmount <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => setMode('withdraw')}
                          disabled={goal.currentAmount <= 0}
                        >
                          Withdraw
                        </button>
                      </div>

                      {/* Input Section */}
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500">$</span>
                          <input
                            type="number"
                            placeholder={mode === 'add' ? 'Amount to add' : 'Amount to withdraw'}
                            className="w-full pl-8 pr-3 py-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(goal.id)}
                            max={mode === 'withdraw' ? goal.currentAmount : undefined}
                          />
                        </div>

                        {/* Quick Amount Chips */}
                        <div className="flex gap-2 flex-wrap">
                          {mode === 'add'
                            ? [25, 50, 100, 250].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleQuickAmount(goal.id, val)}
                                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                                >
                                  ${val}
                                </button>
                              ))
                            : ['25%', '50%', '75%', 'All'].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleQuickAmount(goal.id, val)}
                                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                                  disabled={goal.currentAmount <= 0}
                                >
                                  {val}
                                </button>
                              ))
                          }
                        </div>

                        {/* Helper Text */}
                        <p className="text-xs text-gray-600">
                          {mode === 'withdraw'
                            ? `Available balance: $${goal.currentAmount.toFixed(2)}`
                            : `Suggested monthly: $${requiredMonthlySavings.toFixed(0)}`
                          }
                        </p>

                        {/* Submit Button */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSubmit(goal.id)}
                            disabled={!amount || (mode === 'withdraw' && parseFloat(amount) > goal.currentAmount)}
                            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                              mode === 'add'
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                          >
                            {mode === 'add' ? 'Add Funds' : 'Withdraw Funds'}
                          </button>
                          <button
                            onClick={() => {
                              setActiveGoalId(null);
                              setAmount('');
                              setMode('add');
                            }}
                            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
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

      {/* Add/Edit Goal Modal */}
      <AnimatePresence>
        {showAddForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {editingGoal ? 'Edit Savings Goal' : 'Create New Goal'}
                  </h2>

                  <div className="space-y-4">
                    {/* Goal Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goal Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Emergency Fund"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                        autoFocus
                      />
                    </div>

                    {/* Target Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Amount *
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newGoal.targetAmount}
                        onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newGoal.priority}
                        onChange={(e) => setNewGoal({...newGoal, priority: parseInt(e.target.value) || 1})}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>Priority {num}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Lower numbers have higher priority</p>
                    </div>

                    {/* Target Date (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Date (Optional)
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newGoal.targetDate}
                        onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newGoal.category || ''}
                        onChange={(e) => setNewGoal({...newGoal, category: e.target.value ? e.target.value as SavingsGoalCategory : undefined})}
                      >
                        <option value="">Select a category...</option>
                        {Object.entries(SavingsGoalCategoryLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {SavingsGoalCategoryIcons[key as SavingsGoalCategory]} {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Emergency Fund Calculator - Shows when emergency fund category is selected */}
                    {newGoal.category === 'emergency-fund' && (
                      <div className={`border rounded-lg p-4 ${
                        monthlyExpenseReference === 0
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          {monthlyExpenseReference === 0 ? (
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h4 className={`font-medium mb-2 ${
                              monthlyExpenseReference === 0 ? 'text-amber-900' : 'text-blue-900'
                            }`}>
                              Emergency Fund Recommendations
                            </h4>

                            {monthlyExpenseReference === 0 ? (
                              <>
                                <p className="text-sm text-amber-800 mb-3">
                                  <strong>No budget set yet!</strong> To get accurate emergency fund recommendations:
                                </p>
                                <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside mb-3">
                                  <li>Set up your budget allocations for each category</li>
                                  <li>Include all regular expenses (rent, utilities, groceries, etc.)</li>
                                  <li>Your total budget will be used to calculate your emergency fund needs</li>
                                  <li>Then come back to set your emergency fund target</li>
                                </ol>
                                <div className="bg-amber-100 border border-amber-300 rounded p-3">
                                  <p className="text-sm text-amber-800">
                                    <strong>Temporary guidance:</strong> Most financial experts recommend 3-6 months of expenses.
                                    A typical household might need $3,000-$6,000 per month, suggesting an emergency fund of $9,000-$36,000.
                                  </p>
                                  <p className="text-xs text-amber-700 mt-2">
                                    You can set a placeholder amount now and adjust it later once your budget is configured.
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-blue-800 mb-3">
                                  Based on your {totalBudgetAllocated > 0 ? 'budget allocations' : 'tracked expenses'} of <span className="font-bold">${monthlyExpenseReference.toFixed(0)}</span>:
                                </p>
                                {totalBudgetAllocated > 0 && totalMonthlyExpenses > 0 && Math.abs(totalBudgetAllocated - totalMonthlyExpenses) > totalBudgetAllocated * 0.2 && (
                                  <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-3">
                                    <p className="text-xs text-yellow-800">
                                      <strong>Note:</strong> Your budget (${totalBudgetAllocated.toFixed(0)}) differs significantly from your tracked expenses (${totalMonthlyExpenses.toFixed(0)}). Consider updating your budget.
                                    </p>
                                  </div>
                                )}
                                {monthlyExpenseReference < 1000 && (
                                  <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-3">
                                    <p className="text-xs text-yellow-800">
                                      <strong>Note:</strong> Your {totalBudgetAllocated > 0 ? 'budget allocations' : 'tracked expenses'} seem low. Make sure you've included all regular expenses for accurate recommendations.
                                    </p>
                                  </div>
                                )}
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => setNewGoal({...newGoal, targetAmount: (monthlyExpenseReference * 3).toFixed(0)})}
                                className="w-full text-left p-2 bg-white rounded border border-blue-300 hover:bg-blue-100 transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-blue-900">3 months (Minimum)</span>
                                  <span className="text-sm font-bold text-blue-700">${(monthlyExpenseReference * 3).toFixed(0)}</span>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewGoal({...newGoal, targetAmount: (monthlyExpenseReference * 6).toFixed(0)})}
                                className="w-full text-left p-2 bg-white rounded border border-green-300 hover:bg-green-100 transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-green-900">6 months (Recommended)</span>
                                  <span className="text-sm font-bold text-green-700">${(monthlyExpenseReference * 6).toFixed(0)}</span>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewGoal({...newGoal, targetAmount: (monthlyExpenseReference * 9).toFixed(0)})}
                                className="w-full text-left p-2 bg-white rounded border border-purple-300 hover:bg-purple-100 transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-purple-900">9 months (Excellent)</span>
                                  <span className="text-sm font-bold text-purple-700">${(monthlyExpenseReference * 9).toFixed(0)}</span>
                                </div>
                              </button>
                            </div>
                            <p className="text-xs text-blue-700 mt-3">
                              Click any option above to set as your target amount
                            </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show warning if emergency fund target is less than 3 months */}
                    {newGoal.category === 'emergency-fund' &&
                     newGoal.targetAmount &&
                     parseFloat(newGoal.targetAmount) < monthlyExpenseReference * 3 &&
                     monthlyExpenseReference > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800">
                              Your target of <span className="font-bold">${parseFloat(newGoal.targetAmount).toFixed(0)}</span> is less than the recommended minimum of 3 months {totalBudgetAllocated > 0 ? 'budget' : 'expenses'} (<span className="font-bold">${(monthlyExpenseReference * 3).toFixed(0)}</span>).
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Consider increasing your target for better financial security.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
                      className="flex-1 py-3 bg-[#27AE60] text-white rounded-lg hover:bg-[#229954] transition-colors font-medium"
                    >
                      {editingGoal ? 'Update Goal' : 'Create Goal'}
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
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SavingsGoals;