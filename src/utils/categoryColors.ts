import { CategoryColors } from '../types';

// Extended color palette for categories
const COLOR_PALETTE = [
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#FACC15', // Yellow
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#F43F5E', // Rose
  '#22C55E', // Green
  '#FB923C', // Orange light
  '#818CF8', // Indigo light
  '#2DD4BF', // Teal light
  '#A78BFA', // Violet light
  '#60A5FA', // Blue light
  '#34D399', // Emerald light
  '#FCD34D', // Yellow light
  '#FB7185', // Rose light
  '#C084FC', // Purple light
  '#5EEAD4', // Teal dark
  '#FCA5A5', // Red light
  '#FDE047', // Yellow bright
  '#86EFAC', // Green light
  '#93C5FD', // Blue lighter
];

/**
 * Get a consistent color for any category name
 * Uses the predefined color if available, otherwise generates one
 */
export function getCategoryColor(category: string): string {
  // Check if it's a predefined category
  if (CategoryColors[category as keyof typeof CategoryColors]) {
    return CategoryColors[category as keyof typeof CategoryColors];
  }

  // Generate a consistent color based on the category name
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    const char = category.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value to ensure positive index
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Get a unique color that's not already in use
 */
export function getUniqueColor(categoryName: string, usedColors: string[]): string {
  // First try the default color for this category
  const defaultColor = getCategoryColor(categoryName);

  if (!usedColors.includes(defaultColor)) {
    return defaultColor;
  }

  // If default is taken, find an unused color from the palette
  for (const color of COLOR_PALETTE) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }

  // If all colors are used (unlikely), generate a random one
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Ensure all categories in a list have unique colors
 */
export function ensureUniqueColors(categories: Array<{ category: string; color?: string }>): void {
  const usedColors = new Set<string>();

  // First pass: collect existing colors
  for (const cat of categories) {
    if (cat.color && cat.color !== '#6B7280') { // Ignore default gray
      usedColors.add(cat.color);
    }
  }

  // Second pass: assign colors to categories without them
  for (const cat of categories) {
    if (!cat.color || cat.color === '#6B7280') {
      const newColor = getUniqueColor(cat.category, Array.from(usedColors));
      cat.color = newColor;
      usedColors.add(newColor);
    }
  }
}