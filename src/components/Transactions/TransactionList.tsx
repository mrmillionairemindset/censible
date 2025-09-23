import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudget } from '../../contexts/BudgetContextSupabase';
import TransactionCard from './TransactionCard';
import { Transaction, CategoryType, CategoryLabels } from '../../types';
import { Search, Filter, Download, TrendingDown, TrendingUp, X } from 'lucide-react';
import { format, startOfDay, isToday, isYesterday, isThisWeek } from 'date-fns';
import { staggerContainer, staggerItem } from '../../utils/animations';
import toast from 'react-hot-toast';

const TransactionList: React.FC = () => {
  const { transactions, selectedCategory, deleteTransaction, updateTransaction } = useBudget();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    description: '',
    category: 'other' as CategoryType,
    merchant: '',
    notes: '',
    date: ''
  });

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(search) ||
        t.merchant?.toLowerCase().includes(search) ||
        t.notes?.toLowerCase().includes(search) ||
        CategoryLabels[t.category].toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.amount - a.amount;
      }
    });

    return filtered;
  }, [transactions, selectedCategory, searchTerm, sortBy]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let groupKey: string;

      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else if (isThisWeek(date)) {
        groupKey = 'This Week';
      } else {
        groupKey = format(date, 'MMMM yyyy');
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(transaction);
    });

    return groups;
  }, [filteredTransactions]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      merchant: transaction.merchant || '',
      notes: transaction.notes || '',
      date: format(new Date(transaction.date), 'yyyy-MM-dd')
    });
  };

  const handleUpdateTransaction = () => {
    if (!editingTransaction) return;

    const updatedTransaction: Transaction = {
      ...editingTransaction,
      amount: parseFloat(editForm.amount) || 0,
      description: editForm.description,
      category: editForm.category,
      merchant: editForm.merchant || undefined,
      notes: editForm.notes || undefined,
      date: new Date(editForm.date)
    };

    updateTransaction(updatedTransaction);
    setEditingTransaction(null);
    setEditForm({
      amount: '',
      description: '',
      category: 'other',
      merchant: '',
      notes: '',
      date: ''
    });
    toast.success('Transaction updated successfully!');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    deleteTransaction(id);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Merchant', 'Notes'];
    const rows = filteredTransactions.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      t.description,
      CategoryLabels[t.category],
      t.amount.toFixed(2),
      t.merchant || '',
      t.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `centsible-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const averageAmount = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-soft p-6 w-full h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-500">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            {selectedCategory && ` in ${CategoryLabels[selectedCategory]}`}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          title="Export to CSV"
        >
          <Download size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${
              showFilters ? 'bg-mint-100 text-mint-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Filter size={16} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'date'
                    ? 'bg-mint-100 text-mint-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Latest First
              </button>
              <button
                onClick={() => setSortBy('amount')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'amount'
                    ? 'bg-mint-100 text-mint-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Highest First
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Bar */}
      {filteredTransactions.length > 0 && (
        <div className="flex gap-4 p-3 bg-gray-50 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="text-red-500" size={16} />
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-semibold">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-mint-500" size={16} />
            <div>
              <p className="text-xs text-gray-500">Average</p>
              <p className="text-sm font-semibold">${averageAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Groups */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar"
      >
        {Object.entries(groupedTransactions).map(([group, transactions]) => (
          <motion.div key={group} variants={staggerItem}>
            <h3 className="text-sm font-medium text-gray-500 mb-2 sticky top-0 bg-white py-1">
              {group}
            </h3>
            <div className="space-y-2">
              {transactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </motion.div>
        ))}

        {filteredTransactions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-gray-500">No transactions found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-mint-600 hover:text-mint-700"
              >
                Clear search
              </button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingTransaction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Transaction
                </h3>
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editForm.amount === '0' ? '' : editForm.amount}
                      placeholder="0"
                      onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                      className="w-full pl-8 pr-3 py-3 border border-gray-200 rounded-lg focus:border-mint-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-mint-500 focus:outline-none"
                    placeholder="What was this expense for?"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value as CategoryType})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-mint-500 focus:outline-none"
                  >
                    {Object.entries(CategoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Merchant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.merchant}
                    onChange={(e) => setEditForm({...editForm, merchant: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-mint-500 focus:outline-none"
                    placeholder="Store or business name"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-mint-500 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-mint-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateTransaction}
                  className="flex-1 py-3 bg-mint-500 text-white rounded-lg hover:bg-mint-600 transition-colors font-medium"
                >
                  Update Transaction
                </button>
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TransactionList;