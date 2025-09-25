import React, { useState, useEffect } from 'react';
import { Plus, Calendar, AlertTriangle, CheckCircle, Clock, DollarSign, Repeat, Edit3, Trash2, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CategoryType } from '../types';
import CategorySelect from '../components/UI/CategorySelect';
import CategoryBadge from '../components/UI/CategoryBadge';
import {
  getUpcomingBills,
  getRecurringExpenses,
  createBill,
  updateBill,
  markBillPaid,
  deleteBill,
  Bill as DatabaseBill
} from '../lib/auth-utils';
import toast from 'react-hot-toast';

// Using Bill interface from auth-utils.ts
// Using DatabaseBill as the main Bill interface

// Using DatabaseBill from auth-utils.ts for all bill/recurring expense operations

const BillsPage: React.FC = () => {
  const { household } = useAuth();
  const [activeTab, setActiveTab] = useState<'bills' | 'recurring' | 'history'>('bills');
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<DatabaseBill | null>(null);
  const [editingBill, setEditingBill] = useState<DatabaseBill | null>(null);

  // Real data state
  const [upcomingBills, setUpcomingBills] = useState<DatabaseBill[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<DatabaseBill[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Mock recurring expenses removed - now using live data from useEffect

  // Load real data from database
  useEffect(() => {
    const loadBillsData = async () => {
      if (!household?.household_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load upcoming bills and recurring expenses in parallel
        const [billsData, recurringData] = await Promise.all([
          getUpcomingBills(30), // Get bills for the next 30 days
          getRecurringExpenses()
        ]);

        setUpcomingBills(billsData || []);
        setRecurringExpenses(recurringData || []);
      } catch (error) {
        console.error('Error loading bills data:', error);
        toast.error('Failed to load bills data. Please try again.');
        setUpcomingBills([]);
        setRecurringExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    loadBillsData();
  }, [household]);

  // Handler to add new subscription
  const handleAddSubscription = async () => {
    if (!newSubscription.name || !newSubscription.amount || !newSubscription.category || !newSubscription.startDate) return;

    try {
      const subscriptionData = {
        name: newSubscription.name,
        description: `Recurring ${newSubscription.frequency.toLowerCase()} subscription`,
        amount: parseFloat(newSubscription.amount),
        due_date: newSubscription.startDate,
        frequency: newSubscription.frequency.toLowerCase() as 'monthly' | 'yearly' | 'quarterly' | 'weekly',
        category: newSubscription.category,
        payment_method: '',
        status: 'pending' as const,
        is_automatic: true,
        is_recurring: true,
        is_active: true,
        reminder_days: 3,
        reminder_enabled: true,
        start_date: newSubscription.startDate,
        assigned_to: '',
        notes: ''
      };

      await createBill(subscriptionData);

      // Reload data after successful creation
      const recurringData = await getRecurringExpenses();
      setRecurringExpenses(recurringData || []);

      setNewSubscription({ name: '', amount: '', frequency: 'Monthly', category: 'other' as CategoryType, startDate: '' });
      setShowAddSubscription(false);
      toast.success('Subscription added successfully');
    } catch (error) {
      console.error('Error adding subscription:', error);
      toast.error('Failed to add subscription. Please try again.');
    }
  };

  // Handler to edit subscription
  const handleEditSubscription = (subscription: DatabaseBill) => {
    setEditingSubscription(subscription);
    setNewSubscription({
      name: subscription.name,
      amount: subscription.amount.toString(),
      frequency: subscription.frequency.charAt(0).toUpperCase() + subscription.frequency.slice(1), // Capitalize first letter
      category: subscription.category as CategoryType,
      startDate: subscription.due_date || ''
    });
    setShowAddSubscription(true);
  };

  // Handler to update subscription
  const handleUpdateSubscription = async () => {
    if (!editingSubscription || !newSubscription.name || !newSubscription.amount || !newSubscription.category || !newSubscription.startDate) return;

    try {
      const updates = {
        name: newSubscription.name,
        amount: parseFloat(newSubscription.amount),
        frequency: newSubscription.frequency.toLowerCase() as 'monthly' | 'yearly' | 'quarterly' | 'weekly',
        category: newSubscription.category,
        due_date: newSubscription.startDate
      };

      await updateBill(editingSubscription.id, updates);

      // Reload data after successful update
      const recurringData = await getRecurringExpenses();
      setRecurringExpenses(recurringData || []);

      setNewSubscription({ name: '', amount: '', frequency: 'Monthly', category: 'other' as CategoryType, startDate: '' });
      setShowAddSubscription(false);
      setEditingSubscription(null);
      toast.success('Subscription updated successfully');
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription. Please try again.');
    }
  };

  // Handler to delete subscription
  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;

    try {
      await deleteBill(subscriptionId);

      // Reload data after successful deletion
      const recurringData = await getRecurringExpenses();
      setRecurringExpenses(recurringData || []);

      toast.success('Subscription deleted successfully');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription. Please try again.');
    }
  };

  // Handler to edit bill
  const handleEditBill = (bill: DatabaseBill) => {
    setEditingBill(bill);
    setNewBill({
      name: bill.name,
      description: bill.description || '',
      amount: bill.amount.toString(),
      dueDate: bill.due_date || '',
      frequency: bill.frequency,
      category: bill.category as CategoryType,
      paymentMethod: bill.payment_method || '',
      isAutomatic: bill.is_automatic,
      reminderDays: bill.reminder_days,
      assignedTo: bill.assigned_to || ''
    });
    setShowAddBill(true);
  };

  // Handler to update bill
  const handleUpdateBill = async () => {
    if (!editingBill || !newBill.name || !newBill.amount || !newBill.dueDate) return;

    try {
      const updates = {
        name: newBill.name,
        description: newBill.description,
        amount: parseFloat(newBill.amount),
        due_date: newBill.dueDate,
        frequency: newBill.frequency,
        category: newBill.category,
        payment_method: newBill.paymentMethod || '',
        is_automatic: newBill.isAutomatic,
        reminder_days: newBill.reminderDays,
        assigned_to: newBill.assignedTo || ''
      };

      await updateBill(editingBill.id, updates);

      // Reload data after successful update
      const billsData = await getUpcomingBills(30);
      setUpcomingBills(billsData || []);

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
      toast.success('Bill updated successfully');
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error('Failed to update bill. Please try again.');
    }
  };

  // Handler to delete bill
  const handleDeleteBill = async (billId: string) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;

    try {
      await deleteBill(billId);

      // Reload data after successful deletion
      const billsData = await getUpcomingBills(30);
      setUpcomingBills(billsData || []);

      toast.success('Bill deleted successfully');
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill. Please try again.');
    }
  };

  // Handler to add new bill
  const handleAddBill = async () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate) return;

    try {
      const billData = {
        name: newBill.name,
        description: newBill.description,
        amount: parseFloat(newBill.amount),
        due_date: newBill.dueDate,
        frequency: newBill.frequency,
        category: newBill.category,
        payment_method: newBill.paymentMethod || '',
        status: 'pending' as const,
        is_automatic: newBill.isAutomatic,
        is_recurring: newBill.frequency !== 'one-time',
        is_active: true,
        reminder_days: newBill.reminderDays,
        reminder_enabled: newBill.reminderDays > 0,
        start_date: newBill.dueDate,
        assigned_to: newBill.assignedTo || '',
        notes: ''
      };

      await createBill(billData);

      // Reload data after successful creation
      const billsData = await getUpcomingBills(30);
      setUpcomingBills(billsData || []);

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
      toast.success('Bill added successfully');
    } catch (error) {
      console.error('Error adding bill:', error);
      toast.error('Failed to add bill. Please try again.');
    }
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

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await markBillPaid(billId);

      // Reload data after successful update
      const billsData = await getUpcomingBills(30);
      setUpcomingBills(billsData || []);

      toast.success('Bill marked as paid');
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast.error('Failed to mark bill as paid. Please try again.');
    }
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
                const daysUntil = getDaysUntilDue(bill.due_date || '');
                return (
                  <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{bill.name}</span>
                          {bill.is_automatic && (
                            <Repeat className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        {bill.description && (
                          <div className="text-sm text-gray-600">{bill.description}</div>
                        )}
                        <div className="text-sm text-gray-500">{bill.payment_method || 'Not specified'}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <CategoryBadge category={bill.category as CategoryType} size="sm" />
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900">${bill.amount}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm text-gray-900">{bill.due_date}</div>
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
                      <span className="text-sm text-gray-900">{bill.assigned_to || 'Unassigned'}</span>
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
                <CategoryBadge category={expense.category as CategoryType} size="sm" />
              </div>
              <div className="flex space-x-2">
                {expense.reminder_days > 0 && (
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
                <span className="text-sm text-gray-900">{expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  expense.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {expense.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {expense.due_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Due:</span>
                  <span className="text-sm text-gray-900">{expense.due_date}</span>
                </div>
              )}
              {expense.payment_method && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <span className="text-sm text-gray-900">{expense.payment_method}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button className="w-full text-sm text-gray-600 hover:text-gray-800">
                {expense.is_active ? 'Pause Subscription' : 'Reactivate Subscription'}
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills & Recurring</h1>
          <p className="text-gray-600">
            Manage bills, subscriptions, and recurring expenses
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-600"></div>
          <span className="ml-3 text-gray-600">Loading bills data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bills & Recurring</h1>
        <p className="text-gray-600">
          Manage bills, subscriptions, and recurring expenses
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