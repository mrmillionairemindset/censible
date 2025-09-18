import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Store, Calendar, Tag } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { CategoryType, CategoryLabels, CategoryIcons } from '../../types';
import { categorizeTransaction } from '../../utils/categorizer';
import { scaleIn, fadeIn } from '../../utils/animations';
import toast from 'react-hot-toast';

interface QuickExpenseModalProps {
  onClose: () => void;
  initialCategory?: CategoryType;
}

const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({ onClose, initialCategory }) => {
  const { addTransaction } = useBudget();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<CategoryType>(initialCategory || 'other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMerchantChange = (value: string) => {
    setMerchant(value);

    // Auto-categorize based on merchant if no category is explicitly selected
    if (!initialCategory && value.length > 2) {
      const suggestedCategory = categorizeTransaction(value, description);
      setCategory(suggestedCategory);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsSubmitting(true);

    try {
      const transaction = {
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        date: new Date(date),
        merchant: merchant.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      addTransaction(transaction);

      toast.success('Expense added successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add Expense</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign size={16} className="inline mr-1" />
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 font-mono text-lg"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag size={16} className="inline mr-1" />
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you buy?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
              required
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Store size={16} className="inline mr-1" />
              Merchant
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => handleMerchantChange(e.target.value)}
              placeholder="Where did you shop?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CategoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as CategoryType)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    category === key
                      ? 'border-mint-500 bg-mint-50 text-mint-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{CategoryIcons[key as CategoryType]}</div>
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default QuickExpenseModal;