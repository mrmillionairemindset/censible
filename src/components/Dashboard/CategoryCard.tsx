import React from 'react';
import { motion } from 'framer-motion';
import { CategoryType, CategoryLabels, CategoryIcons } from '../../types';
import BudgetRing from './BudgetRing';
import { fadeInUp } from '../../utils/animations';

interface CategoryCardProps {
  category: CategoryType;
  spent: number;
  allocated: number;
  color: string;
  icon?: string;
  recentTransactions?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  spent,
  allocated,
  color,
  icon,
  recentTransactions = 0,
  onClick,
  isSelected = false,
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
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const remaining = allocated - spent;
  const isOverBudget = remaining < 0;
  const daysLeft = Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()));
  const dailyBudget = remaining > 0 ? remaining / daysLeft : 0;

  const getStatusColor = () => {
    if (percentage >= 100) return 'bg-red-50 border-red-200';
    if (percentage >= 90) return 'bg-amber-50 border-amber-200';
    if (percentage >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  const getStatusText = () => {
    if (percentage >= 100) return 'Over Budget!';
    if (percentage >= 90) return 'Almost there';
    if (percentage >= 70) return 'On track';
    return 'Good standing';
  };

  const getStatusTextColor = () => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-amber-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-mint-600';
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -2, boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer min-h-[200px] flex flex-col justify-between ${getStatusColor()} ${
        isSelected ? 'ring-2 ring-mint-500 ring-offset-2' : ''
      }`}
    >
      {/* Status Badge */}
      {percentage >= 90 && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <div className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
            percentage >= 100 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            {percentage >= 100 ? '!' : '⚠'}
          </div>
        </motion.div>
      )}

      {/* Vertical Layout: Ring on Top, Details Below */}
      <div className="flex flex-col items-center flex-1">
        {/* Top: Budget Ring Container */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-[120px] h-[120px] flex items-center justify-center">
            <BudgetRing
              category={category}
              spent={spent}
              allocated={allocated}
              color={color}
            />
          </div>
        </div>

        {/* Bottom: Details */}
        <div className="flex-1 w-full text-center">
          {/* Header with Icon and Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">{icon || CategoryIcons[category] || '📌'}</span>
            <h3 className="font-medium text-base text-gray-800">{CategoryLabels[category] || formatCategoryName(category)}</h3>
          </div>

          {/* Status Badge */}
          <div className="mb-3">
            <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusTextColor()} bg-opacity-10`}
                  style={{ backgroundColor: `${getStatusTextColor().includes('red') ? '#EF4444' : getStatusTextColor().includes('amber') ? '#F59E0B' : '#10B981'}20` }}>
              {getStatusText()}
            </span>
          </div>

          {/* Spending Info */}
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Spent: <span className="font-semibold">${spent.toFixed(0)}</span></p>
            <p className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-700'}`}>
              {isOverBudget ? `$${Math.abs(remaining).toFixed(0)} over` : `$${remaining.toFixed(0)} left`}
            </p>
            <p className="text-xs text-gray-500">
              ${Math.max(0, dailyBudget).toFixed(0)}/day remaining
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryCard;