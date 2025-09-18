import React, { useState } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Transaction, CategoryIcons, CategoryLabels } from '../../types';
import { Trash2, Edit3, Calendar, Store } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onEdit, onDelete }) => {
  const [dragX, setDragX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('delete'),
    onSwipedRight: () => handleSwipe('edit'),
    onSwiping: (eventData) => {
      setDragX(eventData.deltaX);
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  const handleSwipe = (action: 'edit' | 'delete') => {
    if (action === 'delete') {
      setIsDeleting(true);
      setTimeout(() => onDelete(transaction.id), 300);
    } else {
      onEdit(transaction);
    }
    setDragX(0);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        handleSwipe('edit');
      } else {
        handleSwipe('delete');
      }
    } else {
      setDragX(0);
    }
  };

  const getBackgroundColor = () => {
    if (dragX > 50) return 'bg-blue-500';
    if (dragX < -50) return 'bg-red-500';
    return 'bg-gray-100';
  };

  const getBackgroundOpacity = () => {
    return Math.min(Math.abs(dragX) / 100, 1);
  };

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div
          className="relative mb-2 touch-pan-y"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dragX < 0 ? -300 : 300, transition: { duration: 0.3 } }}
        >
          {/* Background Action Indicators */}
          <div className={`absolute inset-0 ${getBackgroundColor()} rounded-xl transition-colors duration-200`}
               style={{ opacity: getBackgroundOpacity() }}>
            <div className="flex items-center justify-between h-full px-4">
              <motion.div
                className="flex items-center gap-2 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: dragX > 50 ? 1 : 0 }}
              >
                <Edit3 size={20} />
                <span className="font-medium">Edit</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: dragX < -50 ? 1 : 0 }}
              >
                <span className="font-medium">Delete</span>
                <Trash2 size={20} />
              </motion.div>
            </div>
          </div>

          {/* Main Card */}
          <motion.div
            {...swipeHandlers}
            drag="x"
            dragConstraints={{ left: -150, right: 150 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            animate={{ x: dragX }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            whileTap={{ scale: 0.98 }}
            className="relative bg-white rounded-xl shadow-soft p-4 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center justify-between">
              {/* Left Side - Category & Details */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl">
                  {CategoryIcons[transaction.category]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800">
                      {transaction.merchant || transaction.description}
                    </h4>
                    {transaction.receiptImage && (
                      <div className="w-4 h-4 rounded bg-mint-100 flex items-center justify-center">
                        <span className="text-xs">📷</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={10} />
                      {format(new Date(transaction.date), 'MMM d')}
                    </span>
                    {transaction.merchant && transaction.merchant !== transaction.description && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Store size={10} />
                        {transaction.description}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {CategoryLabels[transaction.category]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Amount */}
              <div className="text-right">
                <motion.p
                  className="text-lg font-bold text-gray-900"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  ${transaction.amount.toFixed(2)}
                </motion.p>
              </div>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 pt-2 border-t border-gray-100"
              >
                <p className="text-xs text-gray-600 italic">"{transaction.notes}"</p>
              </motion.div>
            )}

            {/* Swipe Hint on Hover */}
            <motion.div
              className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            >
              <div className="flex gap-1">
                <motion.div
                  className="w-1 h-4 bg-gray-300 rounded-full"
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <motion.div
                  className="w-1 h-4 bg-gray-300 rounded-full"
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
                />
                <motion.div
                  className="w-1 h-4 bg-gray-300 rounded-full"
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionCard;