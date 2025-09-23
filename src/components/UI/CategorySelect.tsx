import React from 'react';
import { CategoryType, CategoryLabels, CategoryIcons, CategoryColors } from '../../types';

interface CategorySelectProps {
  value: CategoryType | string;
  onChange: (value: CategoryType) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  showIcons?: boolean;
  excludeCategories?: CategoryType[]; // Categories to exclude from the dropdown
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  placeholder = "Select a category",
  className = "",
  required = false,
  showIcons = true,
  excludeCategories = []
}) => {
  const allCategories: CategoryType[] = [
    'groceries',
    'housing',
    'transportation',
    'shopping',
    'entertainment',
    'dining',
    'utilities',
    'miscellaneous',
    'debt-payments',
    'credit-cards',
    'giving-charity',
    'savings',
    'insurance',
    'medical',
    'education',
    'personal-care',
    'investments',
    'subscriptions'
  ];

  // Filter out excluded categories
  const availableCategories = allCategories.filter(category =>
    !excludeCategories.includes(category)
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CategoryType)}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500 ${className}`}
      required={required}
    >
      <option value="">{placeholder}</option>
      {availableCategories.map((category: CategoryType) => (
        <option key={category} value={category}>
          {showIcons ? `${CategoryIcons[category]} ` : ''}{CategoryLabels[category]}
        </option>
      ))}
      {availableCategories.length === 0 && (
        <option value="" disabled>No additional categories available</option>
      )}
    </select>
  );
};

export default CategorySelect;