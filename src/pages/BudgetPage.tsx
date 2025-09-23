import React, { useState } from 'react';
import { Plus, Wallet, PieChart, Users, Tag, UserPlus, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContextSupabase';
import { CategoryType, CategoryColors, CategoryLabels, IncomeSource, BudgetCategory, CategoryIcons } from '../types';
import CategorySelect from '../components/UI/CategorySelect';

// Using types from the global types file
// IncomeSource is already defined in types/index.ts
// BudgetCategory is already defined in types/index.ts

interface LocalMember {
  id: string;
  name: string;
  role: 'admin' | 'member';
  email: string;
}

const BudgetPage: React.FC = () => {
  const { household } = useAuth();
  const {
    budget,
    incomeSources,
    setIncomeSources,
    updateCategoryBudgets,
    deleteCategory
  } = useBudget();
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'categories' | 'members'>('overview');
  const householdId = household?.household_id || 'default';

  // Get categories from Supabase context instead of localStorage
  const categories = budget.categories.map(cat => ({
    id: `${cat.category}-${householdId}`,
    name: cat.category,
    budgetAmount: cat.allocated,
    color: cat.color
  }));
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [editingIncome, setEditingIncome] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    frequency: 'monthly' as 'weekly' | 'bi-weekly' | 'monthly' | 'yearly' | 'one-time'
  });

  // Categories now come from Supabase context above
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '' as CategoryType | '',
    budgetAmount: ''
  });

  // Local state for members (keeping this local for now as it's not in Supabase context yet)
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'member' as 'admin' | 'member'
  });

  // Handler to add new income source - using Supabase context
  const handleAddIncome = () => {
    if (!newIncome.source || !newIncome.amount) return;

    if (editingIncome) {
      // Update existing income source
      const updatedSources = incomeSources.map(source =>
        source.id === editingIncome
          ? { ...source, source: newIncome.source, amount: parseFloat(newIncome.amount), frequency: newIncome.frequency as any }
          : source
      );
      setIncomeSources(updatedSources);
      setEditingIncome(null);
    } else {
      // Add new income source
      const incomeSource: IncomeSource = {
        id: Date.now().toString(),
        source: newIncome.source,
        amount: parseFloat(newIncome.amount),
        frequency: newIncome.frequency as any,
        startDate: new Date(),
        isActive: true
      };
      setIncomeSources([...incomeSources, incomeSource]);
    }

    setNewIncome({ source: '', amount: '', frequency: 'monthly' });
    setShowAddIncome(false);
  };

  // Handler to edit income source
  const handleEditIncome = (incomeId: string) => {
    const income = incomeSources.find(source => source.id === incomeId);
    if (income) {
      setNewIncome({
        source: income.source,
        amount: income.amount.toString(),
        frequency: income.frequency
      });
      setEditingIncome(incomeId);
      setShowAddIncome(true);
    }
  };

  // Handler to delete income source
  const handleDeleteIncome = (incomeId: string) => {
    if (!window.confirm('Are you sure you want to delete this income source?')) return;
    const updatedSources = incomeSources.filter(source => source.id !== incomeId);
    setIncomeSources(updatedSources);
  };

  // Calculate monthly equivalent for different frequencies
  const getMonthlyEquivalent = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'weekly': return amount * 4.33; // Average weeks per month
      case 'bi-weekly': return amount * 2.17; // 26 pay periods / 12 months
      case 'monthly': return amount;
      case 'yearly': return amount / 12;
      case 'one-time': return amount; // One-time income treated as monthly for calculation
      default: return amount;
    }
  };

  const totalIncome = incomeSources.reduce((total, source) => total + getMonthlyEquivalent(source.amount, source.frequency), 0);

  // Handler to add new category - using Supabase context
  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.budgetAmount) {
      alert('Please fill in both category name and budget amount.');
      return;
    }

    console.log('🔧 Starting category update/add process:', {
      editingCategory,
      newCategory,
      budgetCategoriesCount: budget.categories.length
    });

    try {
      const budgetAmount = parseFloat(newCategory.budgetAmount);

      if (isNaN(budgetAmount) || budgetAmount < 0) {
        alert('Please enter a valid budget amount.');
        return;
      }

      if (editingCategory) {
        console.log('📝 Updating existing category:', editingCategory);
        // Update existing category
        // Find the category by the editingCategory ID which matches our generated format
        const categoryToUpdate = categories.find(cat => cat.id === editingCategory);
        if (!categoryToUpdate) {
          throw new Error('Category not found for editing');
        }

        console.log('🔍 Found category to update:', categoryToUpdate);

        const updatedCategories = budget.categories.map(category =>
          category.category === categoryToUpdate.name
            ? { ...category, allocated: budgetAmount }
            : category
        );
        const totalBudget = updatedCategories.reduce((sum, cat) => sum + cat.allocated, 0);

        console.log('📊 Calling updateCategoryBudgets with:', {
          categoriesCount: updatedCategories.length,
          totalBudget,
          updatedCategory: updatedCategories.find(cat => cat.category === categoryToUpdate.name)
        });

        await updateCategoryBudgets(updatedCategories, totalBudget);
        setEditingCategory(null);
      } else {
        console.log('➕ Adding new category:', newCategory.name);
        // Add new category by creating it in the budget
        const categoryName = newCategory.name as CategoryType;

        // Check if category already exists
        const existingCategory = budget.categories.find(cat => cat.category === categoryName);
        if (existingCategory) {
          alert('This category already exists in your budget.');
          return;
        }

        const newBudgetCategory: BudgetCategory = {
          category: categoryName,
          allocated: budgetAmount,
          spent: 0,
          color: CategoryColors[categoryName] || '#6b7280',
          icon: CategoryIcons[categoryName] || '📦',
          isCustom: true // All manually added categories are custom
        };

        console.log('🆕 Creating new budget category:', newBudgetCategory);

        const updatedCategories = [...budget.categories, newBudgetCategory];
        const totalBudget = updatedCategories.reduce((sum, cat) => sum + cat.allocated, 0);

        console.log('📊 Calling updateCategoryBudgets with:', {
          categoriesCount: updatedCategories.length,
          totalBudget,
          newCategory: newBudgetCategory
        });

        await updateCategoryBudgets(updatedCategories, totalBudget);
      }

      console.log('✅ Category update/add completed successfully');
      setNewCategory({ name: '' as CategoryType | '', budgetAmount: '' });
      setShowAddCategory(false);
    } catch (error) {
      console.error('❌ Error updating category:', error);
      console.error('Error details:', {
        editingCategory,
        newCategory,
        budgetCategories: budget.categories,
        mappedCategories: categories,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });

      // More specific error messages
      let errorMessage = 'Failed to update category';
      if (error instanceof Error) {
        if (error.message.includes('Not authenticated')) {
          errorMessage = 'You need to be logged in to update categories.';
        } else if (error.message.includes('period_id')) {
          errorMessage = 'Budget period not found. Please try refreshing the page.';
        } else {
          errorMessage = `Failed to update category: ${error.message}`;
        }
      }

      alert(errorMessage);
    }
  };

  // Handler to edit category
  const handleEditCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setNewCategory({
        name: category.name,
        budgetAmount: category.budgetAmount.toString()
      });
      setEditingCategory(categoryId);
      setShowAddCategory(true);
    }
  };

  // Handler to delete category (only custom categories can be deleted)
  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Find the corresponding budget category to check if it's custom
    const budgetCategory = budget.categories.find(cat => cat.category === category.name);
    if (!budgetCategory || !budgetCategory.isCustom) {
      alert('Core budget categories cannot be deleted. You can only edit their budget amounts.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this custom budget category?')) return;

    try {
      await deleteCategory(category.name);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  // Handler to add new member
  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) return;

    if (editingMember) {
      // Update existing member
      setMembers(prev => prev.map(member =>
        member.id === editingMember
          ? { ...member, name: newMember.name, email: newMember.email, role: newMember.role }
          : member
      ));
      setEditingMember(null);
    } else {
      // Add new member
      const member: LocalMember = {
        id: Date.now().toString(),
        name: newMember.name,
        email: newMember.email,
        role: newMember.role
      };
      setMembers(prev => [...prev, member]);
    }

    setNewMember({ name: '', email: '', role: 'member' });
    setShowAddMember(false);
  };

  // Handler to edit member
  const handleEditMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setNewMember({
        name: member.name,
        email: member.email,
        role: member.role
      });
      setEditingMember(memberId);
      setShowAddMember(true);
    }
  };

  // Handler to delete member
  const handleDeleteMember = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    setMembers(prev => prev.filter(member => member.id !== id));
  };

  const totalBudget = budget.categories.reduce((total, category) => total + category.allocated, 0);

  // Check if all categories have been used
  const allCategoriesUsed = categories.length >= 20; // There are 20 total categories available

  // Tab content render functions
  const renderIncomeTab = () => (
    <div className="space-y-6">
      {/* Income Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Income</p>
            <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Income Sources ({incomeSources.length})</h3>
          <button
            onClick={() => setShowAddIncome(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income</span>
          </button>
        </div>

        {/* Income Sources List */}
        <div className="space-y-2">
          {incomeSources.map((source) => (
            <div key={source.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{source.source}</span>
                <div className="text-sm text-gray-600">
                  ${source.amount.toLocaleString()} {source.frequency}
                  {source.frequency !== 'monthly' && (
                    <span className="text-gray-500"> (${getMonthlyEquivalent(source.amount, source.frequency).toLocaleString()}/month)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-green-600">${getMonthlyEquivalent(source.amount, source.frequency).toLocaleString()}</span>
                <button
                  onClick={() => handleEditIncome(source.id)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit income source"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteIncome(source.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete income source"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {incomeSources.length === 0 && (
            <p className="text-gray-500 text-center py-4">No income sources added yet. Click "Add Income" to get started!</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-blue-600">${totalBudget.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <PieChart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className={`text-2xl font-bold ${totalIncome - totalBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(totalIncome - totalBudget).toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${totalIncome - totalBudget >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <PieChart className={`w-6 h-6 ${totalIncome - totalBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{incomeSources.length}</p>
            <p className="text-sm text-gray-600">Income Sources</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            <p className="text-sm text-gray-600">Members</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{household?.household_name ? '1' : '0'}</p>
            <p className="text-sm text-gray-600">Households</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      {/* Categories Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Budget Categories ({categories.length})</h3>
            <p className="text-sm text-gray-600">Total Budget: ${totalBudget.toLocaleString()}</p>
          </div>
          <button
            onClick={() => setShowAddCategory(true)}
            disabled={allCategoriesUsed}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              allCategoriesUsed
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={allCategoriesUsed ? 'All available categories have been added' : 'Add a new category'}
          >
            <Plus className="w-4 h-4" />
            <span>{allCategoriesUsed ? 'All Categories Added' : 'Add Category'}</span>
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-2">
          {categories.map((category) => {
            const budgetCategory = budget.categories.find(cat => cat.category === category.name);
            const isCoreCategory = budgetCategory ? !budgetCategory.isCustom : false;
            return (
              <div key={category.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{CategoryLabels[category.name]}</span>
                    {isCoreCategory && (
                      <span className="px-2 py-1 text-xs font-medium bg-mint-100 text-mint-700 rounded-full">
                        Core
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-blue-600">${category.budgetAmount.toLocaleString()}</span>
                  <button
                    onClick={() => handleEditCategory(category.id)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit category budget"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {!isCoreCategory && (
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete custom category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {isCoreCategory && (
                    <div className="w-4 h-4 flex items-center justify-center">
                      {/* Empty space to maintain alignment */}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Setting up your budget categories...
              </h3>
              <p className="text-gray-600">
                Core budget categories are being automatically created for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* Members Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Family Members ({members.length})</h3>
            <p className="text-sm text-gray-600">Manage household access and permissions</p>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Members List */}
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <span className="font-medium text-gray-900">{member.name}</span>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  member.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.role}
                </span>
                <button
                  onClick={() => handleEditMember(member.id)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit member"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-gray-500 text-center py-4">No members added yet. Click "Add Member" to get started!</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Family Budget</h1>
        <p className="text-gray-600">
          Manage your {household?.household_name || 'family'} budget
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: PieChart },
            { id: 'income', name: 'Income', icon: Wallet },
            { id: 'categories', name: 'Categories', icon: Tag },
            { id: 'members', name: 'Members', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
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
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'income' && renderIncomeTab()}
      {activeTab === 'categories' && renderCategoriesTab()}
      {activeTab === 'members' && renderMembersTab()}

      {/* Add Income Modal */}
      {showAddIncome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingIncome ? 'Edit Income Source' : 'Add New Income Source'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Income Name</label>
                <input
                  type="text"
                  value={newIncome.source}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g., Salary, Freelance, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={newIncome.frequency}
                    onChange={(e) => setNewIncome(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>
              {newIncome.frequency !== 'monthly' && newIncome.amount && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Monthly Equivalent:</strong> ${getMonthlyEquivalent(parseFloat(newIncome.amount) || 0, newIncome.frequency).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddIncome(false);
                  setEditingIncome(null);
                  setNewIncome({ source: '', amount: '', frequency: 'monthly' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIncome}
                disabled={!newIncome.source || !newIncome.amount}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingIncome ? 'Update Income' : 'Add Income'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <CategorySelect
                  value={newCategory.name}
                  onChange={(value) => setNewCategory(prev => ({ ...prev, name: value }))}
                  placeholder="Select a category"
                  className="focus:ring-blue-500 focus:border-blue-500"
                  excludeCategories={categories.map(cat => cat.name)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount ($)</label>
                <input
                  type="number"
                  value={newCategory.budgetAmount}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, budgetAmount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setEditingCategory(null);
                  setNewCategory({ name: '' as CategoryType | '', budgetAmount: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.name || !newCategory.budgetAmount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingMember ? 'Edit Member' : 'Add New Member'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value as 'admin' | 'member' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setEditingMember(null);
                  setNewMember({ name: '', email: '', role: 'member' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMember.name || !newMember.email}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingMember ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPage;