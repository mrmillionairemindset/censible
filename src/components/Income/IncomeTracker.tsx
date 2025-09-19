import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Edit3, Trash2, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import { IncomeSource, IncomeFrequency, IncomeFrequencyLabels } from '../../types';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const IncomeTracker: React.FC = () => {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    frequency: 'monthly' as IncomeFrequency,
    category: 'salary' as IncomeSource['category'],
    description: ''
  });

  // Load income sources from localStorage
  useEffect(() => {
    const savedIncome = localStorage.getItem('centsible_income');
    if (savedIncome) {
      const parsed = JSON.parse(savedIncome).map((income: any) => ({
        ...income,
        startDate: new Date(income.startDate)
      }));
      setIncomeSources(parsed);
    } else {
      // Initialize with demo data
      const demoIncome: IncomeSource[] = [
        {
          id: '1',
          source: 'Software Engineer - TechCorp',
          amount: 5000,
          frequency: 'monthly',
          startDate: new Date(),
          isActive: true,
          category: 'salary'
        },
        {
          id: '2',
          source: 'Freelance Consulting',
          amount: 1200,
          frequency: 'monthly',
          startDate: new Date(),
          isActive: true,
          category: 'freelance'
        }
      ];
      setIncomeSources(demoIncome);
      localStorage.setItem('centsible_income', JSON.stringify(demoIncome));
    }
  }, []);

  // Save to localStorage whenever income sources change
  useEffect(() => {
    if (incomeSources.length > 0) {
      localStorage.setItem('centsible_income', JSON.stringify(incomeSources));
    }
  }, [incomeSources]);

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
    if (!newIncome.source || !newIncome.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const income: IncomeSource = {
      id: uuidv4(),
      source: newIncome.source,
      amount: parseFloat(newIncome.amount),
      frequency: newIncome.frequency,
      startDate: new Date(),
      isActive: true,
      category: newIncome.category,
      description: newIncome.description || undefined
    };

    setIncomeSources([...incomeSources, income]);
    setNewIncome({
      source: '',
      amount: '',
      frequency: 'monthly',
      category: 'salary',
      description: ''
    });
    setShowAddForm(false);
    toast.success('Income source added successfully!');
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Income Tracker</h2>
            <p className="text-sm text-gray-600">Manage your income sources</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Show/Hide Inactive Toggle */}
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showInactive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            Show Inactive
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Income
          </button>
        </div>
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
                key={income.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border rounded-lg p-4 transition-all ${
                  income.isActive
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

      {/* Add/Edit Income Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-6 overflow-hidden"
          >
            <h3 className="font-medium mb-4 text-gray-800">
              {editingIncome ? 'Edit Income Source' : 'Add New Income Source'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Income source name (e.g., Software Engineer - TechCorp)"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  value={newIncome.source}
                  onChange={(e) => setNewIncome({...newIncome, source: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Amount"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                />
              </div>
              <div>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  value={newIncome.frequency}
                  onChange={(e) => setNewIncome({...newIncome, frequency: e.target.value as IncomeFrequency})}
                >
                  {Object.entries(IncomeFrequencyLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
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
              <div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  value={newIncome.description}
                  onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={editingIncome ? handleUpdateIncome : handleAddIncome}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                {editingIncome ? 'Update Income' : 'Add Income'}
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

export default IncomeTracker;