import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudget } from '../../contexts/BudgetContext';
import TransactionCard from './TransactionCard';
import { Transaction, CategoryType, CategoryLabels } from '../../types';
import { Search, Filter, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { format, startOfDay, isToday, isYesterday, isThisWeek } from 'date-fns';
import { staggerContainer, staggerItem } from '../../utils/animations';

const TransactionList: React.FC = () => {
  const { transactions, selectedCategory, deleteTransaction, updateTransaction } = useBudget();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
  };

  const handleDelete = (id: string) => {
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
      className="bg-white rounded-2xl shadow-soft p-6 w-full h-full"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">
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
        className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
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
    </motion.div>
  );
};

export default TransactionList;