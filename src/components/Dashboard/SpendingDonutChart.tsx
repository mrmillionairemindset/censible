import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudget } from '../../contexts/BudgetContext';
import { CategoryType, CategoryLabels } from '../../types';
import { scaleIn } from '../../utils/animations';

interface ChartData {
  name: string;
  value: number;
  category: CategoryType;
  color: string;
  percentage: number;
}

interface ActiveCategory {
  name: string;
  budget: number;
  spent: number;
  percentage: number;
  color: string;
}

const SpendingDonutChart: React.FC = () => {
  const { budget, setCategoryFilter, getRemainingBudget, getTotalSpent } = useBudget();
  const [selectedSegment, setSelectedSegment] = useState<CategoryType | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<CategoryType | null>(null);
  const [animatedData, setAnimatedData] = useState<ChartData[]>([]);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory | null>(null);

  const remaining = getRemainingBudget();
  const totalSpent = getTotalSpent();

  useEffect(() => {
    // Show all categories with their allocated amounts, not spent amounts
    const data: ChartData[] = budget.categories.map(cat => ({
      name: CategoryLabels[cat.category],
      value: cat.allocated, // Show allocated budget, not spent
      category: cat.category,
      color: cat.color,
      percentage: (cat.allocated / budget.totalBudget) * 100,
    }));

    // Animate data changes
    setAnimatedData(data);
  }, [budget, budget.totalBudget]);

  const handleSegmentClick = (entry: ChartData) => {
    if (entry.name === 'Available') return;

    const categoryData = budget.categories.find(c => c.category === entry.category);
    if (categoryData) {
      const spentPercentage = categoryData.allocated > 0 ? (categoryData.spent / categoryData.allocated) * 100 : 0;
      setActiveCategory({
        name: entry.name,
        budget: categoryData.allocated,
        spent: categoryData.spent,
        percentage: spentPercentage,
        color: entry.color
      });
    }

    const newCategory = selectedSegment === entry.category ? null : entry.category;
    setSelectedSegment(newCategory);
    setCategoryFilter(newCategory || undefined);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return '#EF4444'; // Red for over budget
    if (percentage === 100) return '#3B82F6'; // Blue for exactly on budget
    if (percentage >= 70) return '#F59E0B';  // Amber for warning
    return '#10B981'; // Green for good
  };


  const renderCenterLabel = () => {
    // Keep center label static - don't change on hover
    const displayAmount = remaining;
    const isExactlyOnBudget = remaining === 0 && budget.totalBudget > 0;
    const displayLabel = remaining > 0 ? 'Remaining' :
                        remaining === 0 ? 'On Budget' :
                        'Over Budget';
    const displayColor = remaining < 0 ? 'text-red-500' :
                        isExactlyOnBudget ? 'text-blue-500' :
                        'text-mint-600';

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">{displayLabel}</p>
          <p className={`text-3xl font-bold ${displayColor}`}>
            ${Math.abs(displayAmount).toFixed(0)}
          </p>
          {remaining < 0 && (
            <p className="text-xs text-red-400 mt-1">
              {((Math.abs(remaining) / budget.totalBudget) * 100).toFixed(1)}% over
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      className="relative bg-white rounded-2xl shadow-soft p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Budget Overview</h2>
        {selectedSegment && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              setSelectedSegment(null);
              setCategoryFilter(undefined);
            }}
            className="text-sm text-mint-600 hover:text-mint-700 font-medium"
          >
            Clear Filter
          </motion.button>
        )}
      </div>

      <div className="relative h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={animatedData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
              onMouseEnter={(data) => setHoveredSegment(data.category)}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={(data) => handleSegmentClick(data)}
            >
              {animatedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={selectedSegment === entry.category ? '#10B981' : hoveredSegment === entry.category ? entry.color : 'none'}
                  strokeWidth={selectedSegment === entry.category ? 3 : hoveredSegment === entry.category ? 2 : 0}
                  style={{
                    filter: selectedSegment && selectedSegment !== entry.category
                      ? 'opacity(0.3)'
                      : 'none',
                    opacity: hoveredSegment === entry.category ? 0.9 : 1,
                    cursor: entry.name !== 'Available' ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {renderCenterLabel()}

        {/* Animated Tooltip Overlay */}
        <AnimatePresence>
          {activeCategory && (
            <>
              {/* Backdrop for outside clicks */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10 bg-black bg-opacity-20"
                onClick={() => setActiveCategory(null)}
              />

              {/* Tooltip */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none"
              >
                <div className="bg-white rounded-xl shadow-2xl p-6 pointer-events-auto border border-gray-100 min-w-[280px]">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: activeCategory.color }}
                    />
                    <h3 className="font-semibold text-lg text-gray-800">{activeCategory.name}</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Budget:</span>
                      <span className="font-semibold text-gray-800">${activeCategory.budget.toFixed(0)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Spent:</span>
                      <span className="font-semibold text-gray-800">${activeCategory.spent.toFixed(0)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remaining:</span>
                      <span className={`font-semibold ${
                        activeCategory.spent > activeCategory.budget ? 'text-red-500' : 'text-green-500'
                      }`}>
                        ${Math.abs(activeCategory.budget - activeCategory.spent).toFixed(0)}
                      </span>
                    </div>

                    {/* Progress bar with correct color */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500">Usage</span>
                        <span className="text-xs font-medium text-gray-600">
                          {activeCategory.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(activeCategory.percentage, 100)}%` }}
                          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: getProgressColor(activeCategory.percentage)
                          }}
                        />
                      </div>
                    </div>

                    {activeCategory.percentage > 100 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded"
                      >
                        ⚠️ Over budget by ${(activeCategory.spent - activeCategory.budget).toFixed(0)}
                      </motion.div>
                    )}
                    {activeCategory.percentage === 100 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded"
                      >
                        ✓ Exactly on budget
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Budget</span>
          <span className="font-semibold">${budget.totalBudget.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Spent</span>
          <span className="font-semibold text-gray-800">${totalSpent.toFixed(2)}</span>
        </div>
        <motion.div
          className="h-2 bg-gray-100 rounded-full overflow-hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.div
            className={`h-full ${
              totalSpent / budget.totalBudget > 0.9
                ? 'bg-red-500'
                : totalSpent / budget.totalBudget > 0.7
                ? 'bg-gold-500'
                : 'bg-mint-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalSpent / budget.totalBudget) * 100, 100)}%` }}
            transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedSegment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-mint-50 rounded-lg"
          >
            <p className="text-sm text-mint-800">
              Filtering transactions by: <span className="font-semibold">{CategoryLabels[selectedSegment]}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SpendingDonutChart;