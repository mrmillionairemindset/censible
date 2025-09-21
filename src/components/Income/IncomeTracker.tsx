import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Edit3, Trash2, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import { IncomeSource, IncomeFrequency, IncomeFrequencyLabels } from '../../types';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useBudget } from '../../contexts/BudgetContext';

const IncomeTracker: React.FC = () => {
  const { incomeSources, setIncomeSources } = useBudget();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [highlightedIncomeId, setHighlightedIncomeId] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    frequency: 'monthly' as IncomeFrequency,
    category: 'salary' as IncomeSource['category'],
    description: ''
  });

  // No demo data - users start fresh
  // Income sources will be loaded from context/storage if they exist

  // Convert any income to monthly amount
  const convertToMonthly = (amount: number, frequency: IncomeFrequency): number => {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'bi-weekly': return amount * 2.17;
      case 'yearly': return amount / 12;
      case 'one-time': return 0; // One-time doesn't count toward monthly
      case 'monthly':
      default: return amount;
    }
  };

  const calculateTotalMonthlyIncome = () => {
    return incomeSources
      .filter(income => income.isActive)
      .reduce((total, income) => total + convertToMonthly(income.amount, income.frequency), 0);
  };

  const handleAddIncome = () => {
    console.log('🔧 handleAddIncome called');
    console.log('🔧 newIncome:', newIncome);
    console.log('🔧 setIncomeSources function:', setIncomeSources);

    if (!newIncome.source || !newIncome.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const incomeId = uuidv4();
    const income: IncomeSource = {
      id: incomeId,
      source: newIncome.source,
      amount: parseFloat(newIncome.amount),
      frequency: newIncome.frequency,
      startDate: new Date(),
      isActive: true,
      category: newIncome.category,
      description: newIncome.description || undefined
    };

    console.log('🔧 About to call setIncomeSources with:', [...incomeSources, income]);
    setIncomeSources([...incomeSources, income]);
    console.log('🔧 setIncomeSources called successfully');

    // Reset form
    setNewIncome({
      source: '',
      amount: '',
      frequency: 'monthly',
      category: 'salary',
      description: ''
    });
    setShowAddForm(false);

    // Success feedback
    const monthlyAmount = convertToMonthly(income.amount, income.frequency);
    toast.success(`✅ New income added: ${income.source} ($${monthlyAmount.toFixed(0)}/month)`);

    // Highlight animation
    setHighlightedIncomeId(incomeId);
    setTimeout(() => setHighlightedIncomeId(null), 1500);

    // Auto-scroll to new income
    setTimeout(() => {
      const element = document.getElementById(`income-${incomeId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleEditIncome = (income: IncomeSource) => {
    setEditingIncome(income);
    setNewIncome({
      source: income.source,
      amount: income.amount.toString(),
      frequency: income.frequency,
      category: income.category || 'salary',
      description: income.description || ''
    });
    setShowAddForm(true);
  };

  const handleUpdateIncome = () => {
    if (!editingIncome || !newIncome.source || !newIncome.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedIncome: IncomeSource = {
      ...editingIncome,
      source: newIncome.source,
      amount: parseFloat(newIncome.amount),
      frequency: newIncome.frequency,
      category: newIncome.category,
      description: newIncome.description || undefined
    };

    setIncomeSources(incomeSources.map(income =>
      income.id === editingIncome.id ? updatedIncome : income
    ));

    setEditingIncome(null);
    setNewIncome({
      source: '',
      amount: '',
      frequency: 'monthly',
      category: 'salary',
      description: ''
    });
    setShowAddForm(false);
    toast.success('Income source updated successfully!');
  };

  const handleDeleteIncome = (id: string) => {
    setIncomeSources(incomeSources.filter(income => income.id !== id));
    toast.success('Income source deleted');
  };

  const toggleIncomeActive = (id: string) => {
    setIncomeSources(incomeSources.map(income =>
      income.id === id ? { ...income, isActive: !income.isActive } : income
    ));
  };

  const getCategoryIcon = (category: IncomeSource['category']) => {
    switch (category) {
      case 'salary': return '💼';
      case 'freelance': return '💻';
      case 'investments': return '📈';
      case 'business': return '🏢';
      default: return '💰';
    }
  };

  const filteredIncome = showInactive ? incomeSources : incomeSources.filter(income => income.isActive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Income Tracker</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your income sources</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 h-11 px-6 bg-[#27AE60] text-white rounded-lg hover:bg-[#229954] transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Income
        </button>
      </div>

      {/* Total Monthly Income Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 mb-1">Total Monthly Income</p>
            <p className="text-3xl font-bold text-green-800">
              ${calculateTotalMonthlyIncome().toFixed(0)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>
        <div className="mt-3 text-xs text-green-600">
          From {incomeSources.filter(i => i.isActive).length} active source{incomeSources.filter(i => i.isActive).length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Income Sources List */}
      <div className="space-y-3 mb-6">
        <AnimatePresence>
          {filteredIncome.map((income) => {
            const monthlyAmount = convertToMonthly(income.amount, income.frequency);
            return (
              <motion.div
                id={`income-${income.id}`}
                key={income.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border rounded-lg p-4 transition-all ${
                  highlightedIncomeId === income.id
                    ? 'border-green-400 bg-gradient-to-r from-green-50 to-transparent animate-pulse'
                    : income.isActive
                    ? 'border-gray-200 hover:border-gray-300 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getCategoryIcon(income.category)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-800">{income.source}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {income.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        ${income.amount.toFixed(0)} {IncomeFrequencyLabels[income.frequency].toLowerCase()}
                      </p>
                      {income.frequency !== 'monthly' && (
                        <p className="text-xs text-green-600">
                          ≈ ${monthlyAmount.toFixed(0)}/month
                        </p>
                      )}
                      {income.description && (
                        <p className="text-xs text-gray-500 mt-1">{income.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleIncomeActive(income.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        income.isActive
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={income.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {income.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEditIncome(income)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteIncome(income.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredIncome.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No {showInactive ? '' : 'active '}income sources</p>
            <p className="text-sm">Add your first income source to get started</p>
          </div>
        )}
      </div>

      {/* Show Inactive Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowInactive(!showInactive)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          {showInactive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {showInactive ? 'Hide Inactive Sources' : 'Show Inactive Sources'}
        </button>
      </div>

      {/* Add/Edit Income Modal */}
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
                setEditingIncome(null);
                setNewIncome({
                  source: '',
                  amount: '',
                  frequency: 'monthly',
                  category: 'salary',
                  description: ''
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
                    {editingIncome ? 'Edit Income Source' : 'Add New Income'}
                  </h2>

                  <div className="space-y-4">
                    {/* Income Source Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Income Source *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Software Engineer - TechCorp"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newIncome.source}
                        onChange={(e) => setNewIncome({...newIncome, source: e.target.value})}
                        autoFocus
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newIncome.amount}
                        onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newIncome.frequency}
                        onChange={(e) => setNewIncome({...newIncome, frequency: e.target.value as IncomeFrequency})}
                      >
                        {Object.entries(IncomeFrequencyLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      {newIncome.frequency !== 'monthly' && newIncome.amount && (
                        <p className="text-xs text-green-600 mt-1">
                          ≈ ${convertToMonthly(parseFloat(newIncome.amount), newIncome.frequency).toFixed(0)}/month
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newIncome.category}
                        onChange={(e) => setNewIncome({...newIncome, category: e.target.value as IncomeSource['category']})}
                      >
                        <option value="salary">💼 Salary</option>
                        <option value="freelance">💻 Freelance</option>
                        <option value="investments">📈 Investments</option>
                        <option value="business">🏢 Business</option>
                        <option value="other">💰 Other</option>
                      </select>
                    </div>

                    {/* Description (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Additional details..."
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={newIncome.description}
                        onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={editingIncome ? handleUpdateIncome : handleAddIncome}
                      className="flex-1 py-3 bg-[#27AE60] text-white rounded-lg hover:bg-[#229954] transition-colors font-medium"
                    >
                      {editingIncome ? 'Update Income' : 'Create Income'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingIncome(null);
                        setNewIncome({
                          source: '',
                          amount: '',
                          frequency: 'monthly',
                          category: 'salary',
                          description: ''
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

export default IncomeTracker;