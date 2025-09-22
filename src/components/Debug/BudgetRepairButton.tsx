import React, { useState } from 'react';
import { useBudget } from '../../contexts/BudgetContextSupabase';
import { BudgetRepairService } from '../../services/budgetRepairService';
import toast from 'react-hot-toast';

const BudgetRepairButton: React.FC = () => {
  const { repairBudgetMath } = useBudget();
  const [isRepairing, setIsRepairing] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      await repairBudgetMath();
      toast.success('Budget math repaired successfully!');
    } catch (error) {
      toast.error('Failed to repair budget math');
      console.error('Repair failed:', error);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleShowBreakdown = async () => {
    try {
      const data = await BudgetRepairService.getSpendingBreakdown();
      setBreakdown(data);
      setShowBreakdown(true);
      console.log('Spending Breakdown:', data);
    } catch (error) {
      toast.error('Failed to get spending breakdown');
      console.error('Breakdown failed:', error);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white border border-red-300 rounded-lg p-4 shadow-lg z-50">
      <h3 className="font-bold text-red-700 mb-2">🔧 Budget Math Tools</h3>

      <div className="space-y-2">
        <button
          onClick={handleRepair}
          disabled={isRepairing}
          className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          {isRepairing ? 'Repairing...' : 'Fix Budget Math'}
        </button>

        <button
          onClick={handleShowBreakdown}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Show Breakdown
        </button>
      </div>

      {showBreakdown && breakdown && (
        <div className="mt-4 max-h-96 overflow-y-auto text-xs">
          <div className="mb-2">
            <strong>Summary:</strong>
            <div>Stored Total: ${breakdown.summary.totalStoredSpent}</div>
            <div>Actual Total: ${breakdown.summary.totalActualSpent}</div>
            <div>Transactions: {breakdown.summary.totalTransactions}</div>
          </div>

          <div className="space-y-1">
            <strong>Categories:</strong>
            {breakdown.categories?.map((cat: any) => (
              <div
                key={cat.category}
                className={`p-1 rounded text-xs ${
                  cat.isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="font-medium">{cat.category}</div>
                <div>Stored: ${cat.storedSpent}</div>
                <div>Actual: ${cat.actualSpent}</div>
                {!cat.isCorrect && (
                  <div className="text-red-600 font-bold">
                    ❌ INCORRECT (diff: ${cat.actualSpent - cat.storedSpent})
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowBreakdown(false)}
            className="mt-2 text-xs text-gray-600 underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetRepairButton;