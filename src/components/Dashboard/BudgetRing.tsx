import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { CategoryType } from '../../types';

interface BudgetRingProps {
  category: CategoryType;
  spent: number;
  allocated: number;
  color: string;
  onClick?: () => void;
}

const BudgetRing: React.FC<BudgetRingProps> = ({ category, spent, allocated, color, onClick }) => {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [displayAmount, setDisplayAmount] = useState(0);
  const controls = useAnimation();

  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  useEffect(() => {
    // Animate the ring
    controls.start({
      strokeDashoffset,
      transition: {
        duration: 1.5,
        ease: [0.4, 0.0, 0.2, 1],
      },
    });

    // Animate the numbers
    const percentTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayPercentage(prev => {
          if (prev >= percentage) {
            clearInterval(interval);
            return percentage;
          }
          return Math.min(prev + 2, percentage);
        });
      }, 20);
    }, 300);

    const amountTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayAmount(prev => {
          if (prev >= spent) {
            clearInterval(interval);
            return spent;
          }
          return Math.min(prev + spent / 30, spent);
        });
      }, 30);
    }, 300);

    return () => {
      clearTimeout(percentTimer);
      clearTimeout(amountTimer);
    };
  }, [percentage, spent, strokeDashoffset, controls]);

  const getRingColor = () => {
    if (percentage > 100) return '#EF4444'; // Red for over budget
    if (percentage === 100) return '#3B82F6'; // Blue for exactly on budget
    return '#10B981'; // Green for under budget
  };

  const shouldPulse = percentage >= 90;

  return (
    <motion.div
      className="relative group cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative w-[100px] h-[100px]">
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        >
          {/* Background circle */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            stroke={getRingColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={controls}
            className={shouldPulse ? 'animate-pulse-slow' : ''}
          />
        </svg>

        {/* Center content - Always show percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="text-center"
          >
            <div className="text-xl font-bold text-gray-800">
              {displayPercentage.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">
              ${displayAmount.toFixed(0)}
            </div>
          </motion.div>
        </div>
      </div>

    </motion.div>
  );
};

export default BudgetRing;