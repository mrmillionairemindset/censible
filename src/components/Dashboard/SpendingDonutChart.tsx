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
      const remaining = allocated - spent;

      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 z-50">
          <p className="font-semibold text-gray-800 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Budget:</span>
              <span className="font-semibold text-gray-800">${allocated.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Spent:</span>
              <span className="font-semibold text-gray-800">${spent.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(remaining).toFixed(0)}
              </span>
            </div>
            <div className="pt-1 mt-1 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      spentPercentage >= 100 ? 'bg-red-500' :
                      spentPercentage >= 75 ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {spentPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCenterLabel = () => {
    // Keep center label static - don't change on hover
    const displayAmount = remaining;
    const displayLabel = remaining >= 0 ? 'Remaining' : 'Over Budget';
    const displayColor = remaining < 0 ? 'text-red-500' : 'text-mint-600';

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
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
              wrapperStyle={{ zIndex: 1000 }}
            />
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