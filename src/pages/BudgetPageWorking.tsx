import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LocalIncomeSource {
  id: string;
  name: string;
  amount: number;
}

const BudgetPageWorking: React.FC = () => {
  const { household } = useAuth();

  // Local state for income sources - this WILL work
  const [incomeSources, setIncomeSources] = useState<LocalIncomeSource[]>([]);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [newIncome, setNewIncome] = useState({
    name: '',
    amount: ''
  });

  // Handler to add new income source - this WILL work
  const handleAddIncome = () => {
    if (!newIncome.name || !newIncome.amount) return;

    const incomeSource: LocalIncomeSource = {
      id: Date.now().toString(),
      name: newIncome.name,
      amount: parseFloat(newIncome.amount)
    };

    setIncomeSources(prev => [...prev, incomeSource]);
    setNewIncome({ name: '', amount: '' });
    setShowAddIncome(false);
  };

  const totalIncome = incomeSources.reduce((total, source) => total + source.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Family Budget - WORKING VERSION</h1>
        <p className="text-gray-600">
          Manage your {household?.household_name || 'family'} budget (Local State Test)
        </p>
      </div>

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
            <div key={source.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{source.name}</span>
              <span className="font-bold text-green-600">${source.amount.toLocaleString()}</span>
            </div>
          ))}
          {incomeSources.length === 0 && (
            <p className="text-gray-500 text-center py-4">No income sources added yet. Click "Add Income" to get started!</p>
          )}
        </div>
      </div>

      {/* Add Income Modal */}
      {showAddIncome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Income Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Income Name</label>
                <input
                  type="text"
                  value={newIncome.name}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly Salary"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddIncome(false);
                  setNewIncome({ name: '', amount: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIncome}
                disabled={!newIncome.name || !newIncome.amount}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Income
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPageWorking;