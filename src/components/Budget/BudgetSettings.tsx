import React, { useState } from 'react';
import { X, DollarSign, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BudgetCategory, CategoryType, CategoryLabels, CategoryIcons } from '../../types';
import toast from 'react-hot-toast';

interface BudgetSettingsProps {
  categories: BudgetCategory[];
  totalBudget: number;
  onSave: (updatedCategories: BudgetCategory[], newTotalBudget: number) => void;
  onClose: () => void;
}

interface SuggestedCategory {
  name: string;
  icon: string;
  budget: number;
}

interface CustomCategory extends BudgetCategory {
  isCustom?: boolean;
}

const BudgetSettings: React.FC<BudgetSettingsProps> = ({
  categories,
  totalBudget,
  onSave,
  onClose
}) => {
  // Format category names for display
  const formatCategoryName = (name: string) => {
    // Handle special cases
    const specialCases: Record<string, string> = {
      'creditcards': 'Credit Cards',
      'debtpayments': 'Debt Payments',
      'givingcharity': 'Giving/Charity',
      'personalcare': 'Personal Care'
    };

    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (specialCases[normalizedName]) {
      return specialCases[normalizedName];
    }

    // Otherwise, capitalize each word
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  const [budgetCategories, setBudgetCategories] = useState<CustomCategory[]>(
    categories.map(cat => ({ ...cat }))
  );
  const [calculatedTotal, setCalculatedTotal] = useState(
    categories.reduce((sum, cat) => sum + cat.allocated, 0)
  );
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    allocated: 0,
    icon: '📌'
  });

  // Predefined category suggestions
  const suggestedCategories: SuggestedCategory[] = [
    { name: 'Debt Payments', icon: '💳', budget: 500 },
    { name: 'Credit Cards', icon: '💰', budget: 200 },
    { name: 'Giving/Charity', icon: '❤️', budget: 100 },
    { name: 'Savings', icon: '🏦', budget: 500 },
    { name: 'Insurance', icon: '🛡️', budget: 200 },
    { name: 'Medical', icon: '🏥', budget: 150 },
    { name: 'Education', icon: '📚', budget: 100 },
    { name: 'Personal Care', icon: '✨', budget: 75 },
    { name: 'Investments', icon: '📈', budget: 300 },
    { name: 'Subscriptions', icon: '📱', budget: 50 }
  ];

  const handleBudgetChange = (category: CategoryType, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedCategories = budgetCategories.map(cat =>
      cat.category === category ? { ...cat, allocated: numValue } : cat
    );
    setBudgetCategories(updatedCategories);

    // Update total
    const newTotal = updatedCategories.reduce((sum, cat) => sum + cat.allocated, 0);
    setCalculatedTotal(newTotal);
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const formattedName = formatCategoryName(newCategory.name);
      const categoryKey = formattedName.toLowerCase().replace(/[^a-z0-9]/g, '') as CategoryType;
      const category: CustomCategory = {
        category: categoryKey,
        allocated: parseFloat(newCategory.allocated.toString()) || 0,
        spent: 0,
        color: '#6B7280', // Default gray color
        icon: newCategory.icon,
        isCustom: true
      };
      setBudgetCategories([...budgetCategories, category]);

      // Update total
      const newTotal = calculatedTotal + category.allocated;
      setCalculatedTotal(newTotal);

      setNewCategory({ name: '', allocated: 0, icon: '📌' });
      setShowAddCategory(false);
      toast.success(`${formattedName} category added!`);
    }
  };

  const handleDeleteCategory = (category: CategoryType) => {
    const categoryToDelete = budgetCategories.find(cat => cat.category === category);
    if (categoryToDelete?.isCustom) {
      const updatedCategories = budgetCategories.filter(cat => cat.category !== category);
      setBudgetCategories(updatedCategories);

      // Update total
      const newTotal = updatedCategories.reduce((sum, cat) => sum + cat.allocated, 0);
      setCalculatedTotal(newTotal);

      toast.success('Category removed!');
    }
  };

  const handleQuickAdd = (suggested: SuggestedCategory) => {
    const formattedName = formatCategoryName(suggested.name);
    const categoryKey = formattedName.toLowerCase().replace(/[^a-z0-9]/g, '') as CategoryType;
    const exists = budgetCategories.some(cat =>
      cat.category === categoryKey
    );

    if (!exists) {
      const category: CustomCategory = {
        category: categoryKey,
        allocated: suggested.budget,
        spent: 0,
        color: '#6B7280',
        icon: suggested.icon,
        isCustom: true
      };
      setBudgetCategories([...budgetCategories, category]);

      // Update total
      const newTotal = calculatedTotal + category.allocated;
      setCalculatedTotal(newTotal);

      toast.success(`${formattedName} added!`);
    }
  };

  const handleSave = () => {
    onSave(budgetCategories, calculatedTotal);
    toast.success('Budget updated successfully!');
    onClose();
  };

  const applyPreset = (presetName: string) => {
    let presetCategories: BudgetCategory[];

    switch (presetName) {
      case 'tight':
        presetCategories = budgetCategories.map(cat => ({
          ...cat,
          allocated: {
            groceries: 250,
            housing: 800,
            transportation: 150,
            shopping: 100,
            entertainment: 75,
            dining: 100,
            utilities: 120,
            other: 80
          }[cat.category] || 100
        }));
        break;
      case 'moderate':
        presetCategories = budgetCategories.map(cat => ({
          ...cat,
          allocated: {
            groceries: 400,
            housing: 1200,
            transportation: 250,
            shopping: 200,
            entertainment: 150,
            dining: 200,
            utilities: 180,
            other: 150
          }[cat.category] || 150
        }));
        break;
      case 'comfortable':
        presetCategories = budgetCategories.map(cat => ({
          ...cat,
          allocated: {
            groceries: 600,
            housing: 1800,
            transportation: 400,
            shopping: 350,
            entertainment: 300,
            dining: 350,
            utilities: 250,
            other: 200
          }[cat.category] || 200
        }));
        break;
      default:
        return;
    }

    setBudgetCategories(presetCategories);
    const newTotal = presetCategories.reduce((sum, cat) => sum + cat.allocated, 0);
    setCalculatedTotal(newTotal);
    toast.success(`Applied ${presetName} budget preset!`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Budget Categories</h2>
              <p className="text-sm text-gray-600">Manage your monthly budget allocations</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Total Budget Display */}
          <div className="bg-gradient-to-r from-mint-50 to-blue-50 p-4 rounded-xl border border-mint-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-mint-600" />
              <p className="text-sm font-medium text-gray-700">Total Monthly Budget</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">${calculatedTotal.toFixed(0)}</p>
            {calculatedTotal !== totalBudget && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Total changed from ${totalBudget.toFixed(0)}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Categories */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Category Allocations</h3>
            {budgetCategories.map(category => (
              <div key={category.category} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xl">{category.icon || CategoryIcons[category.category] || '📦'}</span>
                <span className="flex-1 font-medium text-gray-800">
                  {CategoryLabels[category.category] || formatCategoryName(category.category)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={category.allocated}
                    onChange={(e) => handleBudgetChange(category.category, e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:border-mint-500 focus:outline-none focus:ring-1 focus:ring-mint-500"
                    min="0"
                    step="10"
                  />
                </div>
                {category.isCustom && (
                  <button
                    onClick={() => handleDeleteCategory(category.category)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add New Category Form */}
          {showAddCategory ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-2 border-dashed border-mint-300 rounded-lg p-4 mb-6 bg-mint-50"
            >
              <h3 className="font-medium mb-3 text-mint-800">Add Custom Category</h3>
              <div className="flex gap-2 mb-3">
                <select
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  className="px-2 py-1 border border-mint-300 rounded focus:border-mint-500 focus:outline-none"
                >
                  <option value="📌">📌 Default</option>
                  <option value="💳">💳 Credit</option>
                  <option value="💰">💰 Money</option>
                  <option value="❤️">❤️ Heart</option>
                  <option value="🏦">🏦 Bank</option>
                  <option value="📈">📈 Investment</option>
                  <option value="🎯">🎯 Target</option>
                  <option value="🛡️">🛡️ Shield</option>
                  <option value="🏥">🏥 Medical</option>
                  <option value="📚">📚 Education</option>
                  <option value="✨">✨ Beauty</option>
                  <option value="📱">📱 Digital</option>
                </select>
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="flex-1 px-3 py-1 border border-mint-300 rounded focus:border-mint-500 focus:outline-none"
                  autoFocus
                />
                <input
                  type="number"
                  placeholder="Budget"
                  value={newCategory.allocated}
                  onChange={(e) => setNewCategory({...newCategory, allocated: parseFloat(e.target.value) || 0})}
                  className="w-24 px-2 py-1 border border-mint-300 rounded focus:border-mint-500 focus:outline-none"
                  min="0"
                  step="10"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-mint-500 text-white rounded hover:bg-mint-600 transition-colors font-medium"
                >
                  Add Category
                </button>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-mint-400 hover:bg-mint-50 flex items-center justify-center gap-2 text-gray-600 hover:text-mint-600 mb-6 transition-all"
            >
              <Plus size={20} />
              <span>Add Custom Category</span>
            </button>
          )}

          {/* Quick Add Suggestions */}
          <div className="mb-6">
            <h3 className="font-medium mb-3 text-gray-700">Quick Add Suggestions</h3>
            <div className="flex flex-wrap gap-2">
              {suggestedCategories.map(suggested => {
                const categoryKey = suggested.name.toLowerCase().replace(/[^a-z0-9]/g, '') as CategoryType;
                const exists = budgetCategories.some(cat => cat.category === categoryKey);
                return (
                  <button
                    key={suggested.name}
                    onClick={() => handleQuickAdd(suggested)}
                    disabled={exists}
                    className={`px-3 py-2 rounded-full text-sm flex items-center gap-2 transition-all ${
                      exists
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'
                    }`}
                  >
                    <span>{suggested.icon}</span>
                    <span>{suggested.name}</span>
                    <span className="text-xs opacity-70">${suggested.budget}</span>
                    {!exists && <Plus size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Budget Presets</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyPreset('tight')}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
              >
                Tight
                <br />
                <span className="text-xs text-gray-500">$1,675</span>
              </button>
              <button
                onClick={() => applyPreset('moderate')}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
              >
                Moderate
                <br />
                <span className="text-xs text-gray-500">$2,730</span>
              </button>
              <button
                onClick={() => applyPreset('comfortable')}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
              >
                Comfortable
                <br />
                <span className="text-xs text-gray-500">$4,250</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-mint-500 text-white rounded-lg hover:bg-mint-600 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign size={16} />
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BudgetSettings;