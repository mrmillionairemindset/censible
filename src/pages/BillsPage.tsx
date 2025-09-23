import React, { useState } from 'react';
import { Plus, Calendar, AlertTriangle, CheckCircle, Clock, DollarSign, Repeat, Edit3, Trash2, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CategoryType } from '../types';
import CategorySelect from '../components/UI/CategorySelect';
import CategoryBadge from '../components/UI/CategoryBadge';

interface Bill {
  id: string;
  name: string;
  description?: string;
  amount: number;
  dueDate: string;
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'yearly' | 'one-time';
  category: CategoryType;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'overdue';
  isAutomatic: boolean;
  reminderDays: number;
  lastPaid?: string;
  nextDue: string;
  assignedTo?: string;
  notes?: string;
}

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: CategoryType;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  reminderEnabled: boolean;
}

const BillsPage: React.FC = () => {
  const { household } = useAuth();
  const [activeTab, setActiveTab] = useState<'bills' | 'recurring' | 'history'>('bills');
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<RecurringExpense | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [newBill, setNewBill] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly' as 'monthly' | 'weekly' | 'quarterly' | 'yearly' | 'one-time',
    category: 'other' as CategoryType,
    paymentMethod: '',
    isAutomatic: false,
    reminderDays: 3,
    assignedTo: ''
  });
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    amount: '',
    frequency: 'Monthly',
    category: 'other' as CategoryType,
    startDate: ''
  });

  // Mock data - will be replaced with real data from database
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([
    {
      id: '1',
      name: 'Netflix Subscription',
      amount: 15.99,
      frequency: 'Monthly',
      category: 'entertainment',
      isActive: true,
      startDate: '2025-01-15',
      reminderEnabled: false
    },
    {
      id: '2',
      name: 'Gym Membership',
      amount: 89.99,
      frequency: 'Monthly',
      category: 'personal-care',
      isActive: true,
      startDate: '2025-03-01',
      reminderEnabled: true
    },
    {
      id: '3',
      name: 'Amazon Prime',
      amount: 139.00,
      frequency: 'Yearly',
      category: 'shopping',
      isActive: true,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      reminderEnabled: true
    }
  ]);

  // Mock data - will be replaced with real data from database
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([
    {
      id: '1',
      name: 'Mortgage Payment',
      description: 'Monthly home mortgage',
      amount: 1850.00,
      dueDate: '2025-09-28',
      frequency: 'monthly',
      category: 'housing',
      paymentMethod: 'Bank Transfer',
      status: 'pending',
      isAutomatic: true,
      reminderDays: 3,
      nextDue: '2025-09-28',
      assignedTo: 'Sarah',
      notes: 'Automatic payment from checking account'
    },
    {
      id: '2',
      name: 'Electric Bill',
      description: 'Monthly electricity usage',
      amount: 156.42,
      dueDate: '2025-09-25',
      frequency: 'monthly',
      category: 'utilities',
      paymentMethod: 'Credit Card ****1234',
      status: 'pending',
      isAutomatic: false,
      reminderDays: 5,
      nextDue: '2025-09-25',
      assignedTo: 'Mike'
    },
    {
      id: '3',
      name: 'Internet Service',
      description: 'High-speed internet',
      amount: 89.99,
      dueDate: '2025-09-24',
      frequency: 'monthly',
      category: 'utilities',
      paymentMethod: 'Auto-pay',
      status: 'overdue',
      isAutomatic: true,
      reminderDays: 3,
      nextDue: '2025-09-24',
      assignedTo: 'Sarah'
    },
    {
      id: '4',
      name: 'Phone Plan',
      description: 'Family mobile plan',
      amount: 120.00,
      dueDate: '2025-09-30',
      frequency: 'monthly',
      category: 'utilities',
      paymentMethod: 'Credit Card ****5678',
      status: 'pending',
      isAutomatic: true,
      reminderDays: 2,
      nextDue: '2025-09-30',
      assignedTo: 'Mike'
    },
    {
      id: '5',
      name: 'Car Insurance',
      description: '6-month premium',
      amount: 892.50,
      dueDate: '2025-10-15',
      frequency: 'quarterly',
      category: 'insurance',
      paymentMethod: 'Bank Transfer',
      status: 'pending',
      isAutomatic: false,
      reminderDays: 14,
      nextDue: '2025-10-15',
      assignedTo: 'Sarah'
    }
  ]);

  // Handler to add new subscription
  const handleAddSubscription = () => {
    if (!newSubscription.name || !newSubscription.amount || !newSubscription.category || !newSubscription.startDate) return;

    const subscription: RecurringExpense = {
      id: Date.now().toString(),
      name: newSubscription.name,
      amount: parseFloat(newSubscription.amount),
      frequency: newSubscription.frequency,
      category: newSubscription.category,
      isActive: true,
      startDate: newSubscription.startDate,
      reminderEnabled: false
    };

    setRecurringExpenses(prev => [...prev, subscription]);
    setNewSubscription({ name: '', amount: '', frequency: 'Monthly', category: 'other' as CategoryType, startDate: '' });
    setShowAddSubscription(false);
  };

  // Handler to edit subscription
  const handleEditSubscription = (subscription: RecurringExpense) => {
    setEditingSubscription(subscription);
    setNewSubscription({
      name: subscription.name,
      amount: subscription.amount.toString(),
      frequency: subscription.frequency,
      category: subscription.category,
      startDate: subscription.startDate
    });
    setShowAddSubscription(true);
  };

  // Handler to update subscription
  const handleUpdateSubscription = () => {
    if (!editingSubscription || !newSubscription.name || !newSubscription.amount || !newSubscription.category || !newSubscription.startDate) return;

    const updatedSubscription: RecurringExpense = {
      ...editingSubscription,
      name: newSubscription.name,
      amount: parseFloat(newSubscription.amount),
      frequency: newSubscription.frequency,
      category: newSubscription.category,
      startDate: newSubscription.startDate
    };

    setRecurringExpenses(prev => prev.map(sub => sub.id === editingSubscription.id ? updatedSubscription : sub));
    setNewSubscription({ name: '', amount: '', frequency: 'Monthly', category: 'other' as CategoryType, startDate: '' });
    setShowAddSubscription(false);
    setEditingSubscription(null);
  };

  // Handler to delete subscription
  const handleDeleteSubscription = (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    setRecurringExpenses(prev => prev.filter(sub => sub.id !== subscriptionId));
  };

  // Handler to edit bill
  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setNewBill({
      name: bill.name,
      description: bill.description || '',
      amount: bill.amount.toString(),
      dueDate: bill.dueDate,
      frequency: bill.frequency,
      category: bill.category,
      paymentMethod: bill.paymentMethod,
      isAutomatic: bill.isAutomatic,
      reminderDays: bill.reminderDays,
      assignedTo: bill.assignedTo || ''
    });
    setShowAddBill(true);
  };

  // Handler to update bill
  const handleUpdateBill = () => {
    if (!editingBill || !newBill.name || !newBill.amount || !newBill.dueDate) return;

    const updatedBill: Bill = {
      ...editingBill,
      name: newBill.name,
      description: newBill.description,
      amount: parseFloat(newBill.amount),
      dueDate: newBill.dueDate,
      frequency: newBill.frequency,
      category: newBill.category,
      paymentMethod: newBill.paymentMethod,
      isAutomatic: newBill.isAutomatic,
      reminderDays: newBill.reminderDays,
      assignedTo: newBill.assignedTo,
      nextDue: newBill.dueDate // Update next due date
    };

    setUpcomingBills(prev => prev.map(bill => bill.id === editingBill.id ? updatedBill : bill));
    setNewBill({
      name: '',
      description: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: 'other' as CategoryType,
      paymentMethod: '',
      isAutomatic: false,
      reminderDays: 3,
      assignedTo: ''
    });
    setShowAddBill(false);
    setEditingBill(null);
  };

  // Handler to delete bill
  const handleDeleteBill = (billId: string) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    setUpcomingBills(prev => prev.filter(bill => bill.id !== billId));
  };

  // Handler to add new bill
  const handleAddBill = () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate) return;

    const bill: Bill = {
      id: Date.now().toString(),
      name: newBill.name,
      description: newBill.description,
      amount: parseFloat(newBill.amount),
      dueDate: newBill.dueDate,
      frequency: newBill.frequency,
      category: newBill.category,
      paymentMethod: newBill.paymentMethod || 'Not specified',
      status: 'pending',
      isAutomatic: newBill.isAutomatic,
      reminderDays: newBill.reminderDays,
      nextDue: newBill.dueDate,
      assignedTo: newBill.assignedTo
    };

    setUpcomingBills(prev => [...prev, bill]);
    setNewBill({
      name: '',
      description: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: 'other' as CategoryType,
      paymentMethod: '',
      isAutomatic: false,
      reminderDays: 3,
      assignedTo: ''
    });
    setShowAddBill(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalMonthlyBills = upcomingBills
    .filter(bill => bill.frequency === 'monthly' || bill.frequency === 'weekly')
    .reduce((sum, bill) => sum + bill.amount, 0);

  const overdueCount = upcomingBills.filter(bill => bill.status === 'overdue').length;
  const pendingCount = upcomingBills.filter(bill => bill.status === 'pending').length;

  const handleMarkAsPaid = (billId: string) => {
    // In real app, this would update the bill status
    console.log('Marking bill as paid:', billId);
  };

  const renderBillsTab = () => (
    <div className="space-y-6">
      {/* Bills Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Bills</p>
              <p className="text-2xl font-bold text-gray-900">${totalMonthlyBills.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Bills</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bills */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Bills</h3>
          <button
            onClick={() => setShowAddBill(true)}
            className="flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bill</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Bill</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Due Date</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Frequency</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Assigned To</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Status</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingBills.map((bill) => {
                const daysUntil = getDaysUntilDue(bill.dueDate);
                return (
                  <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{bill.name}</span>
                          {bill.isAutomatic && (
                            <Repeat className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        {bill.description && (
                          <div className="text-sm text-gray-600">{bill.description}</div>
                        )}
                        <div className="text-sm text-gray-500">{bill.paymentMethod}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <CategoryBadge category={bill.category} size="sm" />
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900">${bill.amount}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm text-gray-900">{bill.dueDate}</div>
                        <div className={`text-xs ${
                          daysUntil < 0 ? 'text-red-600' :
                          daysUntil <= 3 ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>
                          {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                           daysUntil === 0 ? 'Due today' :
                           `${daysUntil} days left`}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {bill.frequency}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-900">{bill.assignedTo}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {getStatusIcon(bill.status)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {bill.status === 'pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(bill.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditBill(bill)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit bill"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRecurringTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recurring Expenses</h3>
          <p className="text-gray-600">Manage your subscription and recurring payments</p>
        </div>
        <button
          onClick={() => setShowAddSubscription(true)}
          className="flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recurringExpenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{expense.name}</h4>
                <CategoryBadge category={expense.category} size="sm" />
              </div>
              <div className="flex space-x-2">
                {expense.reminderEnabled && (
                  <Bell className="w-4 h-4 text-yellow-500" />
                )}
                <button
                  onClick={() => handleEditSubscription(expense)}
                  className="text-gray-400 hover:text-blue-600"
                  title="Edit subscription"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSubscription(expense.id)}
                  className="text-gray-400 hover:text-red-600"
                  title="Delete subscription"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">${expense.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Frequency:</span>
                <span className="text-sm text-gray-900">{expense.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  expense.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {expense.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Date:</span>
                <span className="text-sm text-gray-900">{expense.startDate}</span>
              </div>
              {expense.endDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">End Date:</span>
                  <span className="text-sm text-gray-900">{expense.endDate}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button className="w-full text-sm text-gray-600 hover:text-gray-800">
                {expense.isActive ? 'Pause Subscription' : 'Reactivate Subscription'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        <p className="text-gray-600">View your family's bill payment history</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment history coming soon</h3>
          <p className="text-gray-600">This feature will show your complete bill payment history and analytics.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bills & Recurring</h1>
        <p className="text-gray-600">
          Manage your {household?.household_name || 'family'} bills, subscriptions, and recurring expenses
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'bills', label: 'Upcoming Bills', icon: Calendar },
            { id: 'recurring', label: 'Subscriptions', icon: Repeat },
            { id: 'history', label: 'Payment History', icon: Clock }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-mint-500 text-mint-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'bills' && overdueCount > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {overdueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'bills' && renderBillsTab()}
      {activeTab === 'recurring' && renderRecurringTab()}
      {activeTab === 'history' && renderHistoryTab()}

      {/* Add/Edit Bill Modal */}
      {showAddBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingBill ? 'Edit Bill' : 'Add New Bill'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Name</label>
                <input
                  type="text"
                  value={newBill.name}
                  onChange={(e) => setNewBill(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Electric Bill"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={newBill.description}
                  onChange={(e) => setNewBill(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Monthly electricity usage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={newBill.amount}
                  onChange={(e) => setNewBill(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="150.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <CategorySelect
                  value={newBill.category}
                  onChange={(category) => setNewBill(prev => ({ ...prev, category }))}
                  placeholder="Select a category"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={newBill.frequency}
                  onChange={(e) => setNewBill(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <input
                  type="text"
                  value={newBill.assignedTo}
                  onChange={(e) => setNewBill(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Family member name"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddBill(false);
                  setNewBill({
                    name: '',
                    description: '',
                    amount: '',
                    dueDate: '',
                    frequency: 'monthly',
                    category: 'other' as CategoryType,
                    paymentMethod: '',
                    isAutomatic: false,
                    reminderDays: 3,
                    assignedTo: ''
                  });
                  setEditingBill(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingBill ? handleUpdateBill : handleAddBill}
                disabled={!newBill.name || !newBill.amount || !newBill.dueDate}
                className="flex-1 bg-mint-600 text-white py-2 px-4 rounded-lg hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBill ? 'Update Bill' : 'Add Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Name</label>
                <input
                  type="text"
                  value={newSubscription.name}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Netflix, Spotify"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={newSubscription.amount}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="15.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={newSubscription.frequency}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <CategorySelect
                  value={newSubscription.category}
                  onChange={(category) => setNewSubscription(prev => ({ ...prev, category }))}
                  placeholder="Select a category"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newSubscription.startDate}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddSubscription(false);
                  setNewSubscription({ name: '', amount: '', frequency: 'Monthly', category: 'other' as CategoryType, startDate: '' });
                  setEditingSubscription(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingSubscription ? handleUpdateSubscription : handleAddSubscription}
                disabled={!newSubscription.name || !newSubscription.amount || !newSubscription.category || !newSubscription.startDate}
                className="flex-1 bg-mint-600 text-white py-2 px-4 rounded-lg hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsPage;