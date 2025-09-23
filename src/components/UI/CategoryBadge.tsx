import React from 'react';
import { CategoryType, CategoryLabels, CategoryIcons, CategoryColors } from '../../types';

interface CategoryBadgeProps {
  category: CategoryType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className = ''
}) => {
  // Handle case where category might be a string not in our CategoryType
  const isValidCategory = category in CategoryLabels;
  const categoryKey = isValidCategory ? category as CategoryType : 'other';

  const color = CategoryColors[categoryKey];
  const icon = CategoryIcons[categoryKey];
  const label = isValidCategory ? CategoryLabels[categoryKey] : category;

  // Convert hex color to RGB for background opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 107, g: 114, b: 128 }; // Default gray
  };

  const rgb = hexToRgb(color);
  const backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor,
        borderColor,
        color
      }}
    >
      {showIcon && <span>{icon}</span>}
      {showLabel && <span>{label}</span>}
    </span>
  );
};

export default CategoryBadge;