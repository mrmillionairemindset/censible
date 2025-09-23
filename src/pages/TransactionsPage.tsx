import React, { useState } from 'react';
import { Plus, Filter, Search, Download, CreditCard, MapPin, User, DollarSign, CheckCircle, XCircle, Clock, Camera, Edit3, Scan } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: string;
  member: string;
  memberId: string;
  memberType: 'adult' | 'child' | 'teen';
  amount: number;
  category: string;
  description: string;
  merchant?: string;
  location?: string;
  date: string;
  time: string;
  expenseType: 'shared' | 'personal' | 'allowance';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  paymentMethod: string;
  receiptUrl?: string;
}

interface FilterOptions {
  member: string;
  category: string;
  expenseType: string;
  approvalStatus: string;
  dateRange: string;
}

const TransactionsPage: React.FC = () => {
  const { household } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [addTransactionMode, setAddTransactionMode] = useState<'manual' | 'scan'>('manual');
  const [newTransaction, setNewTransaction] = useState({
    member: '',
    amount: '',
    category: '',
    description: '',
    merchant: '',
    location: '',
    expenseType: 'personal',
    paymentMethod: ''
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    member: 'all',
    category: 'all',
    expenseType: 'all',
    approvalStatus: 'all',
    dateRange: 'all'
  });

  // Handler to add new transaction
  const handleAddTransaction = () => {
    if (!newTransaction.member || !newTransaction.amount || !newTransaction.category || !newTransaction.description) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      member: familyMembers.find(m => m.id === newTransaction.member)?.name || '',
      memberId: newTransaction.member,
      memberType: familyMembers.find(m => m.id === newTransaction.member)?.type as 'adult' | 'child' | 'teen' || 'adult',
      amount: -parseFloat(newTransaction.amount),
      category: newTransaction.category,
      description: newTransaction.description,
      merchant: newTransaction.merchant || undefined,
      location: newTransaction.location || undefined,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expenseType: newTransaction.expenseType as 'shared' | 'personal' | 'allowance',
      approvalStatus: 'pending' as 'pending' | 'approved' | 'rejected',
      paymentMethod: newTransaction.paymentMethod
    };

    // In real app, this would save to database
    console.log('Adding transaction:', transaction);

    // Reset form
    setNewTransaction({
      member: '',
      amount: '',
      category: '',
      description: '',
      merchant: '',
      location: '',
      expenseType: 'personal',
      paymentMethod: ''
    });
    setShowAddTransaction(false);
  };

  // Handler for receipt scanning with AI
  const handleScanReceipt = async () => {
    if (!receiptFile) return;

    setAiProcessing(true);

    try {
      // Simulate AI processing of receipt
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI response - in real app, this would call an AI service
      const aiResponse = {
        merchant: 'Target',
        amount: '45.67',
        category: 'Groceries',
        description: 'Grocery shopping',
        location: 'Austin, TX',
        items: ['Milk', 'Bread', 'Eggs', 'Bananas'],
        confidence: 0.95
      };

      setAiSuggestion(aiResponse);
      setNewTransaction({
        member: '',
        amount: aiResponse.amount,
        category: aiResponse.category,
        description: aiResponse.description,
        merchant: aiResponse.merchant,
        location: aiResponse.location,
        expenseType: 'shared',
        paymentMethod: ''
      });

    } catch (error) {
      console.error('Error processing receipt:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  // Handler for file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  // Mock data - will be replaced with real data from database
  const familyMembers = [
    { id: '1', name: 'Sarah', type: 'adult' },
    { id: '2', name: 'Mike', type: 'adult' },
    { id: '3', name: 'Emma', type: 'teen' },
    { id: '4', name: 'Jake', type: 'child' }
  ];

  const transactions: Transaction[] = [
    {
      id: '1',
      member: 'Sarah',
      memberId: '1',
      memberType: 'adult',
      amount: -89.24,
      category: 'Groceries',
      description: 'Weekly grocery shopping',
      merchant: 'Whole Foods Market',
      location: 'Austin, TX',
      date: '2025-09-22',
      time: '10:30 AM',
      expenseType: 'shared',
      approvalStatus: 'approved',
      paymentMethod: 'Credit Card ****1234'
    },
    {
      id: '2',
      member: 'Mike',
      memberId: '2',
      memberType: 'adult',
      amount: -45.67,
      category: 'Transportation',
      description: 'Gas for work commute',
      merchant: 'Shell Station',
      location: 'Austin, TX',
      date: '2025-09-21',
      time: '7:45 AM',
      expenseType: 'personal',
      approvalStatus: 'approved',
      paymentMethod: 'Debit Card ****5678'
    },
    {
      id: '3',
      member: 'Emma',
      memberId: '3',
      memberType: 'teen',
      amount: -12.00,
      category: 'Entertainment',
      description: 'Movie tickets with friends',
      merchant: 'AMC Theater',
      location: 'Austin, TX',
      date: '2025-09-21',
      time: '6:00 PM',
      expenseType: 'allowance',
      approvalStatus: 'approved',
      approvedBy: 'Sarah',
      paymentMethod: 'Allowance Balance'
    },
    {
      id: '4',
      member: 'Sarah',
      memberId: '1',
      memberType: 'adult',
      amount: -67.89,
      category: 'Dining',
      description: 'Family dinner',
      merchant: 'Olive Garden',
      location: 'Austin, TX',
      date: '2025-09-20',
      time: '7:30 PM',
      expenseType: 'shared',
      approvalStatus: 'approved',
      paymentMethod: 'Credit Card ****1234'
    },
    {
      id: '5',
      member: 'Jake',
      memberId: '4',
      memberType: 'child',
      amount: -8.50,
      category: 'Personal',
      description: 'Pokemon card pack',
      merchant: 'Target',
      location: 'Austin, TX',
      date: '2025-09-20',
      time: '2:15 PM',
      expenseType: 'allowance',
      approvalStatus: 'pending',
      paymentMethod: 'Allowance Request'
    },
    {
      id: '6',
      member: 'Mike',
      memberId: '2',
      memberType: 'adult',
      amount: -156.78,
      category: 'Utilities',
      description: 'Electric bill payment',
      merchant: 'Austin Energy',
      date: '2025-09-19',
      time: '9:00 AM',
      expenseType: 'shared',
      approvalStatus: 'approved',
      paymentMethod: 'Auto-pay ****5678'
    }
  ];

  const categories = ['All', 'Groceries', 'Transportation', 'Entertainment', 'Dining', 'Personal', 'Utilities', 'Healthcare'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'shared':
        return 'bg-blue-100 text-blue-800';
      case 'personal':
        return 'bg-green-100 text-green-800';
      case 'allowance':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMemberTypeColor = (type: string) => {
    switch (type) {
      case 'adult':
        return 'bg-gray-100 text-gray-800';
      case 'teen':
        return 'bg-orange-100 text-orange-800';
      case 'child':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMember = filters.member === 'all' || transaction.memberId === filters.member;
    const matchesCategory = filters.category === 'all' || transaction.category === filters.category;
    const matchesExpenseType = filters.expenseType === 'all' || transaction.expenseType === filters.expenseType;
    const matchesApprovalStatus = filters.approvalStatus === 'all' || transaction.approvalStatus === filters.approvalStatus;

    return matchesSearch && matchesMember && matchesCategory && matchesExpenseType && matchesApprovalStatus;
  });

  const handleApproval = (transactionId: string, action: 'approve' | 'reject') => {
    // In real app, this would update the database
    console.log(`${action} transaction ${transactionId}`);
  };

  const totalSpent = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const pendingCount = filteredTransactions.filter(t => t.approvalStatus === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Transactions</h1>
          <p className="text-gray-600">
            Track who spent what, where - transparency for the whole {household?.household_name || 'family'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowAddTransaction(true)}
              className="flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total This Month</p>
              <p className="text-2xl font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions, merchants, descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              showFilters ? 'bg-mint-50 border-mint-200 text-mint-700' : 'bg-gray-50 border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Member</label>
              <select
                value={filters.member}
                onChange={(e) => setFilters({...filters, member: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Members</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
              <select
                value={filters.expenseType}
                onChange={(e) => setFilters({...filters, expenseType: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="shared">Shared</option>
                <option value="personal">Personal</option>
                <option value="allowance">Allowance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.approvalStatus}
                onChange={(e) => setFilters({...filters, approvalStatus: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Member</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Transaction</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Date</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Amount</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Status</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <User className="w-8 h-8 p-1 bg-gray-100 rounded-full text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{transaction.member}</div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMemberTypeColor(transaction.memberType)}`}>
                          {transaction.memberType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{transaction.description}</div>
                      {transaction.merchant && (
                        <div className="text-sm text-gray-600 flex items-center space-x-1">
                          <CreditCard className="w-3 h-3" />
                          <span>{transaction.merchant}</span>
                        </div>
                      )}
                      {transaction.location && (
                        <div className="text-sm text-gray-600 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{transaction.location}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExpenseTypeColor(transaction.expenseType)}`}>
                      {transaction.expenseType}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">{transaction.date}</div>
                    {transaction.time && (
                      <div className="text-xs text-gray-600">{transaction.time}</div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                    </span>
                    <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {getStatusIcon(transaction.approvalStatus)}
                      <span className="text-xs text-gray-600 capitalize">
                        {transaction.approvalStatus}
                      </span>
                    </div>
                    {transaction.approvedBy && (
                      <div className="text-xs text-gray-500">by {transaction.approvedBy}</div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {transaction.approvalStatus === 'pending' && (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleApproval(transaction.id, 'approve')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApproval(transaction.id, 'reject')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600">Try adjusting your search or filters to see more results.</p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New Transaction</h3>
              <button
                onClick={() => {
                  setShowAddTransaction(false);
                  setAddTransactionMode('manual');
                  setAiSuggestion(null);
                  setReceiptFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Mode Selection */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setAddTransactionMode('manual')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    addTransactionMode === 'manual'
                      ? 'bg-mint-50 border-mint-200 text-mint-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Manual Entry</span>
                </button>
                <button
                  onClick={() => setAddTransactionMode('scan')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    addTransactionMode === 'scan'
                      ? 'bg-mint-50 border-mint-200 text-mint-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Receipt</span>
                </button>
              </div>
            </div>

            {/* Receipt Scan Mode */}
            {addTransactionMode === 'scan' && (
              <div className="space-y-4 mb-6">
                {!receiptFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Receipt</h4>
                    <p className="text-gray-600 mb-4">Take a photo or upload an image of your receipt</p>
                    <label className="inline-flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700 cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Camera className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{receiptFile.name}</span>
                      </div>
                      <button
                        onClick={() => setReceiptFile(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>

                    {!aiSuggestion && (
                      <button
                        onClick={handleScanReceipt}
                        disabled={aiProcessing}
                        className="w-full flex items-center justify-center space-x-2 bg-mint-600 text-white px-4 py-3 rounded-lg hover:bg-mint-700 disabled:opacity-50"
                      >
                        {aiProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing Receipt...</span>
                          </>
                        ) : (
                          <>
                            <Scan className="w-4 h-4" />
                            <span>Analyze with AI</span>
                          </>
                        )}
                      </button>
                    )}

                    {aiSuggestion && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">AI Analysis Complete</span>
                          <span className="text-sm text-green-700">({Math.round(aiSuggestion.confidence * 100)}% confidence)</span>
                        </div>
                        <div className="text-sm text-green-800">
                          <p><strong>Merchant:</strong> {aiSuggestion.merchant}</p>
                          <p><strong>Amount:</strong> ${aiSuggestion.amount}</p>
                          <p><strong>Category:</strong> {aiSuggestion.category}</p>
                          <p><strong>Description:</strong> {aiSuggestion.description}</p>
                          {aiSuggestion.items && (
                            <p><strong>Items:</strong> {aiSuggestion.items.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Transaction Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Family Member</label>
                  <select
                    value={newTransaction.member}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, member: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
                    required
                  >
                    <option value="">Select member</option>
                    {familyMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.slice(1).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
                  <select
                    value={newTransaction.expenseType}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, expenseType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
                  >
                    <option value="personal">Personal</option>
                    <option value="shared">Shared</option>
                    <option value="allowance">Allowance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What was this purchase for?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Merchant (optional)</label>
                  <input
                    type="text"
                    value={newTransaction.merchant}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, merchant: e.target.value }))}
                    placeholder="Store or business name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location (optional)</label>
                  <input
                    type="text"
                    value={newTransaction.location}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <input
                  type="text"
                  value={newTransaction.paymentMethod}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  placeholder="Credit Card ****1234, Cash, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mint-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTransaction(false);
                  setAddTransactionMode('manual');
                  setAiSuggestion(null);
                  setReceiptFile(null);
                  setNewTransaction({
                    member: '',
                    amount: '',
                    category: '',
                    description: '',
                    merchant: '',
                    location: '',
                    expenseType: 'personal',
                    paymentMethod: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTransaction}
                disabled={!newTransaction.member || !newTransaction.amount || !newTransaction.category || !newTransaction.description || !newTransaction.paymentMethod}
                className="px-6 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;