import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { BudgetCategory, CategoryType, CategoryLabels, CategoryIcons } from '../../types';
import toast from 'react-hot-toast';

interface BudgetSettingsProps {
  categories: BudgetCategory[];
  totalBudget: number;
  onSave: (updatedCategories: BudgetCategory[], newTotalBudget: number) => void;
  onClose: () => void;
}

const BudgetSettings: React.FC<BudgetSettingsProps> = ({
  categories,
  totalBudget,
  onSave,
  onClose
}) => {
  const [budgetCategories, setBudgetCategories] = useState(
    categories.map(cat => ({ ...cat }))
  );
  const [calculatedTotal, setCalculatedTotal] = useState(
    categories.reduce((sum, cat) => sum + cat.allocated, 0)
  );

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
        className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Budget Settings</h2>
              <p className="text-sm text-gray-600">Adjust your monthly budget allocations</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Total Budget Display */}
          <div className="bg-gradient-to-r from-mint-50 to-blue-50 p-4 rounded-xl mb-6 border border-mint-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-mint-600" />
              <p className="text-sm font-medium text-gray-700">Total Monthly Budget</p>
            </div>
            <p className="text-3xl font-bold text-gray-800">${calculatedTotal.toFixed(0)}</p>
            {calculatedTotal !== totalBudget && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Total changed from ${totalBudget.toFixed(0)}
              </p>
            )}
          </div>

          {/* Category Budgets */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Category Allocations</h3>
            {budgetCategories.map(category => (
              <div key={category.category} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">{CategoryIcons[category.category]}</span>
                  <span className="font-medium text-gray-800">{CategoryLabels[category.category]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={category.allocated}
                    onChange={(e) => handleBudgetChange(category.category, e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:border-mint-500 focus:outline-none focus:ring-1 focus:ring-mint-500"
                    min="0"
                    step="10"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Presets */}
          <div className="mb-6 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Presets</p>
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

          {/* Action Buttons */}
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