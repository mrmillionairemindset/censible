import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

const SpendingDonutChart: React.FC = () => {
  const { budget, setCategoryFilter, getRemainingBudget, getTotalSpent } = useBudget();
  const [selectedSegment, setSelectedSegment] = useState<CategoryType | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<CategoryType | null>(null);
  const [animatedData, setAnimatedData] = useState<ChartData[]>([]);

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

    const newCategory = selectedSegment === entry.category ? null : entry.category;
    setSelectedSegment(newCategory);
    setCategoryFilter(newCategory || undefined);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      const categoryData = budget.categories.find(c => c.category === data.category);
      const spent = categoryData?.spent || 0;
      const allocated = data.value;
      const spentPercentage = allocated > 0 ? (spent / allocated) * 100 : 0;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-3 rounded-lg shadow-large border border-gray-100"
        >
          <p className="font-semibold text-gray-800">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Allocated: <span className="font-semibold">${allocated.toFixed(0)}</span>
            </p>
            <p className="text-sm text-gray-600">
              Spent: <span className="font-semibold">${spent.toFixed(0)}</span>
            </p>
            <p className="text-sm text-gray-500">
              {spentPercentage.toFixed(1)}% used
            </p>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const renderCenterLabel = () => {
    const displayAmount = hoveredSegment
      ? budget.categories.find(c => c.category === hoveredSegment)?.spent || 0
      : remaining;

    const displayLabel = hoveredSegment
      ? CategoryLabels[hoveredSegment]
      : remaining >= 0 ? 'Remaining' : 'Over Budget';

    const displayColor = remaining < 0 ? 'text-red-500' : 'text-mint-600';

    return (
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        initial={false}
        animate={{ scale: hoveredSegment ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.div
          key={displayAmount}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="text-center"
        >
          <p className="text-sm text-gray-500 mb-1">{displayLabel}</p>
          <p className={`text-3xl font-bold ${displayColor}`}>
            ${Math.abs(displayAmount).toFixed(0)}
          </p>
          {remaining < 0 && (
            <p className="text-xs text-red-400 mt-1">
              {((Math.abs(remaining) / budget.totalBudget) * 100).toFixed(1)}% over
            </p>
          )}
        </motion.div>
      </motion.div>
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
                  stroke={selectedSegment === entry.category ? '#10B981' : 'none'}
                  strokeWidth={selectedSegment === entry.category ? 3 : 0}
                  style={{
                    filter: selectedSegment && selectedSegment !== entry.category
                      ? 'opacity(0.3)'
                      : hoveredSegment === entry.category
                      ? 'brightness(1.1)'
                      : 'none',
                    cursor: entry.name !== 'Available' ? 'pointer' : 'default',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {renderCenterLabel()}
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