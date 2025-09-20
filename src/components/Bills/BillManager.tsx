import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign, Bell, Repeat, X, Plus, AlertCircle } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { CategoryType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Bill {
  id: string;
  name: string;
  amount: number;
  category: CategoryType;
  dueDay: number; // Day of month (1-31)
  isRecurring: boolean;
  frequency: 'monthly' | 'weekly' | 'yearly';
  reminderDays: number; // Days before due date to remind
  lastPaid?: string; // ISO date string
}

interface BillManagerProps {
  onClose: () => void;
}

const BillManager: React.FC<BillManagerProps> = ({ onClose }) => {
  const { addTransaction } = useBudget();
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    category: 'Other' as CategoryType,
    dueDay: 1,
    isRecurring: true,
    reminderDays: 3
  });

  // Load bills from user-specific localStorage on mount
  useEffect(() => {
    if (!user) return;

    const billsKey = `centsible_${user.id}_bills`;
    const savedBills = localStorage.getItem(billsKey);
    if (savedBills) {
      setBills(JSON.parse(savedBills));
    }
    // No demo data - users start with empty bills list
  }, [user]);

  // Save bills to user-specific localStorage whenever bills change
  useEffect(() => {
    if (!user || bills.length === 0) return;

    const billsKey = `centsible_${user.id}_bills`;
    localStorage.setItem(billsKey, JSON.stringify(bills));
  }, [bills, user]);

  const getDaysUntilDue = (dueDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Create due date for this month
    let dueDate = new Date(currentYear, currentMonth, dueDay);

    // If due date has passed this month, use next month
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }

    const timeDiff = dueDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const handlePayBill = (bill: Bill) => {
    // Add as transaction
    addTransaction({
      amount: bill.amount,
      description: bill.name,
      category: bill.category,
      date: new Date(),
      merchant: bill.name
    });

    // Update bill's last paid date
    const updatedBills = bills.map(b =>
      b.id === bill.id
        ? { ...b, lastPaid: new Date().toISOString() }
        : b
    );
    setBills(updatedBills);

    toast.success(`${bill.name} marked as paid!`);
  };

  const handleAddBill = () => {
    if (!newBill.name || !newBill.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const bill: Bill = {
      id: Date.now().toString(),
      name: newBill.name,
      amount: parseFloat(newBill.amount),
      category: newBill.category,
      dueDay: newBill.dueDay,
      isRecurring: newBill.isRecurring,
      frequency: 'monthly',
      reminderDays: newBill.reminderDays
    };

    setBills([...bills, bill]);
    setNewBill({
      name: '',
      amount: '',
      category: 'other',
      dueDay: 1,
      isRecurring: true,
      reminderDays: 3
    });
    setShowAddForm(false);
    toast.success('Bill added successfully!');
  };

  const handleDeleteBill = (billId: string) => {
    setBills(bills.filter(b => b.id !== billId));
    toast.success('Bill deleted');
  };

  const getUrgentBillsCount = () => {
    return bills.filter(bill => {
      const daysUntil = getDaysUntilDue(bill.dueDay);
      return daysUntil <= bill.reminderDays;
    }).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Bill Manager</h2>
              <p className="text-sm text-gray-600">Track and manage your bills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Stats */}
        {bills.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
            <div className="flex justify-between text-center">
              <div>
                <p className="text-lg font-bold text-purple-600">{bills.length}</p>
                <p className="text-xs text-gray-600">Total Bills</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{getUrgentBillsCount()}</p>
                <p className="text-xs text-gray-600">Due Soon</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  ${bills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(0)}
                </p>
                <p className="text-xs text-gray-600">Monthly Total</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Bills List */}
          <div className="space-y-3 mb-4">
            <AnimatePresence>
              {bills.map((bill) => {
                const daysUntil = getDaysUntilDue(bill.dueDay);
                const isUrgent = daysUntil <= bill.reminderDays;

                return (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`border rounded-lg p-4 transition-all ${
                      isUrgent
                        ? 'border-red-200 bg-red-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-800">{bill.name}</h3>
                          {isUrgent && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          ${bill.amount} • {bill.category}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`font-medium ${
                            isUrgent ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            Due in {daysUntil} days
                          </span>
                          <span className="text-gray-400">
                            Day {bill.dueDay} of month
                          </span>
                          {bill.lastPaid && (
                            <span className="text-green-600">
                              ✓ Paid {new Date(bill.lastPaid).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handlePayBill(bill)}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                        >
                          Pay Now
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {bills.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No bills added yet</p>
                <p className="text-sm">Add your first bill to get started</p>
              </div>
            )}
          </div>

          {/* Add New Bill Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-4 mt-4 overflow-hidden"
              >
                <h3 className="font-medium mb-3 text-gray-800">Add New Bill</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Bill name (e.g., Electric Bill)"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    value={newBill.name}
                    onChange={(e) => setNewBill({...newBill, name: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                  />
                  <select
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    value={newBill.category}
                    onChange={(e) => setNewBill({...newBill, category: e.target.value as CategoryType})}
                  >
                    <option value="housing">Housing</option>
                    <option value="utilities">Utilities</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="transportation">Transportation</option>
                    <option value="groceries">Groceries</option>
                    <option value="dining">Dining</option>
                    <option value="shopping">Shopping</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Day of Month
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        value={newBill.dueDay}
                        onChange={(e) => setNewBill({...newBill, dueDay: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remind Days Before
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        value={newBill.reminderDays}
                        onChange={(e) => setNewBill({...newBill, reminderDays: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBill}
                      className="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                    >
                      Add Bill
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? 'Cancel' : 'Add New Bill'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BillManager;