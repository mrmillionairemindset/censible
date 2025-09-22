import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Store, Calendar, Tag } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContextSupabase';
import { CategoryType, CategoryLabels, CategoryIcons, CoreCategories, QuickAddCategories, QuickAddDescriptions } from '../../types';
import { categorizeTransaction } from '../../utils/categorizer';
import { scaleIn, fadeIn } from '../../utils/animations';
import toast from 'react-hot-toast';

interface QuickExpenseModalProps {
  onClose: () => void;
  initialCategory?: CategoryType;
}

const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({ onClose, initialCategory }) => {
  const { addTransaction, budget, updateCategoryBudgets } = useBudget();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<CategoryType>(initialCategory || 'groceries');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showBudgetPrompt, setShowBudgetPrompt] = useState(false);
  const [newCategoryForBudget, setNewCategoryForBudget] = useState<CategoryType | null>(null);
  const [suggestedBudget, setSuggestedBudget] = useState('');

  const handleMerchantChange = (value: string) => {
    setMerchant(value);

    // Auto-categorize based on merchant if no category is explicitly selected
    if (!initialCategory && value.length > 2) {
      const suggestedCategory = categorizeTransaction(value, description);
      setCategory(suggestedCategory);
    }
  };

  const handleBudgetAllocation = async () => {
    if (!newCategoryForBudget || !suggestedBudget || parseFloat(suggestedBudget) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    try {
      // Update the category budget
      const updatedCategories = budget.categories.map(cat =>
        cat.category === newCategoryForBudget
          ? { ...cat, allocated: parseFloat(suggestedBudget) }
          : cat
      );

      // Calculate new total budget
      const newTotalBudget = updatedCategories.reduce((sum, cat) => sum + cat.allocated, 0);

      await updateCategoryBudgets(updatedCategories, newTotalBudget);

      toast.success(`Budget of $${suggestedBudget} set for ${CategoryLabels[newCategoryForBudget] || newCategoryForBudget}`);
      setShowBudgetPrompt(false);
      onClose();
    } catch (error) {
      toast.error('Failed to set budget');
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

      await addTransaction(transaction);

      // Check if this is a new category that needs budget allocation
      const existingCategory = budget.categories.find(c => c.category === category);
      if (existingCategory && existingCategory.allocated === 0 && !CoreCategories.includes(category)) {
        // New category with no budget - prompt for allocation
        setNewCategoryForBudget(category);
        setSuggestedBudget('200'); // Default suggestion
        setShowBudgetPrompt(true);
        toast.success('Expense added! Would you like to set a budget for this category?');
      } else {
        toast.success('Expense added successfully!');
        onClose();
      }
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Category
            </label>

            {/* Core Categories */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">✅ Core Categories</h4>
              <div className="grid grid-cols-4 gap-2">
                {CoreCategories.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      category === key
                        ? 'border-mint-500 bg-mint-50 text-mint-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{CategoryIcons[key]}</div>
                    <div className="text-xs font-medium">{CategoryLabels[key]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Add Toggle */}
            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="w-full text-left text-sm text-mint-600 hover:text-mint-700 font-medium mb-2"
            >
              💡 {showQuickAdd ? 'Hide' : 'Show'} Quick Add Suggestions
            </button>

            {/* Quick Add Categories */}
            <AnimatePresence>
              {showQuickAdd && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {QuickAddCategories.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCategory(key);
                          setShowQuickAdd(false);
                        }}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          category === key
                            ? 'border-mint-500 bg-mint-50 text-mint-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        title={QuickAddDescriptions[key]}
                      >
                        <div className="text-lg mb-1">{CategoryIcons[key]}</div>
                        <div className="text-xs font-medium">{CategoryLabels[key]}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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

      {/* Budget Allocation Prompt */}
      {showBudgetPrompt && newCategoryForBudget && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl"
        >
          <motion.div
            className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Set Budget for {CategoryLabels[newCategoryForBudget] || newCategoryForBudget}?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This category currently has no budget allocated. Would you like to set a monthly budget?
            </p>
            <input
              type="number"
              value={suggestedBudget}
              onChange={(e) => setSuggestedBudget(e.target.value)}
              placeholder="Enter monthly budget amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBudgetPrompt(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleBudgetAllocation}
                className="flex-1 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 transition-colors"
              >
                Set Budget
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuickExpenseModal;