import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, DollarSign, Receipt, X } from 'lucide-react';
import { fabExpand, fabStagger } from '../../utils/animations';

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  onQuickScan: () => void;
  onManualEntry: () => void;
  onRecentReceipt: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onQuickScan,
  onManualEntry,
  onRecentReceipt,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const actions: FABAction[] = [
    {
      id: 'scan',
      label: 'Quick Scan',
      icon: <Camera size={20} />,
      color: 'bg-blue-500',
      onClick: () => {
        onQuickScan();
        setIsExpanded(false);
      },
    },
    {
      id: 'manual',
      label: 'Manual Entry',
      icon: <DollarSign size={20} />,
      color: 'bg-mint-500',
      onClick: () => {
        onManualEntry();
        setIsExpanded(false);
      },
    },
    {
      id: 'recent',
      label: 'Recent Receipt',
      icon: <Receipt size={20} />,
      color: 'bg-purple-500',
      onClick: () => {
        onRecentReceipt();
        setIsExpanded(false);
      },
    },
  ];

  const handleMainButtonClick = () => {
    setIsExpanded(!isExpanded);
  };

  // Add haptic feedback if available
  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-6 right-6 z-50" style={{ bottom: '24px', right: '24px' }}>
        {/* Sub Actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              variants={fabStagger}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute bottom-16 right-0 space-y-3"
            >
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  variants={fabExpand}
                  custom={index}
                  className="flex items-center justify-end gap-3"
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  {/* Label */}
                  <AnimatePresence>
                    {(hoveredAction === action.id || window.innerWidth < 768) && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap"
                      >
                        {action.label}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Button */}
                  <motion.button
                    onClick={() => {
                      triggerHapticFeedback();
                      action.onClick();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 ${action.color} text-white rounded-full shadow-lg flex items-center justify-center`}
                  >
                    {action.icon}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => {
            triggerHapticFeedback();
            handleMainButtonClick();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`relative w-14 h-14 ${
            isExpanded ? 'bg-red-500' : 'bg-mint-500'
          } text-white rounded-full shadow-large flex items-center justify-center transition-colors duration-200`}
        >
          {/* Ripple Effect */}
          {!isExpanded && (
            <motion.div
              className="absolute inset-0 rounded-full bg-mint-400"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{
                scale: [1, 1.5, 1.5],
                opacity: [0.3, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          )}

          {/* Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {isExpanded ? <X size={24} /> : <Plus size={24} />}
          </motion.div>

          {/* Notification Badge */}
          {!isExpanded && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
            />
          )}
        </motion.button>

        {/* Hint Text */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-0 right-16 pointer-events-none"
          >
            <motion.div
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              className="bg-gray-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity"
            >
              Add expense →
            </motion.div>
          </motion.div>
        )}
      </div>

    </>
  );
};

export default FloatingActionButton;