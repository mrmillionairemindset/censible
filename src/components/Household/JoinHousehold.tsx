import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { joinHouseholdWithCode } from '../../lib/auth-utils';
import toast from 'react-hot-toast';

const JoinHousehold: React.FC = () => {
  const { user, household, refreshHousehold } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      const householdInfo = await joinHouseholdWithCode(inviteCode.trim().toUpperCase());
      await refreshHousehold();
      setInviteCode('');
      toast.success(`Joined ${householdInfo.household_name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join household');
    } finally {
      setLoading(false);
    }
  };

  // Don't show if user already has a household
  if (!user || household?.household_id) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Join a Household
      </h2>
      <p className="text-gray-600 mb-4">
        Have an invitation code? Enter it below to join a family household.
      </p>

      <form onSubmit={handleJoinHousehold} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invitation Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 font-mono text-center text-lg tracking-wider"
            maxLength={6}
            pattern="[A-Z0-9]{6}"
          />
          <p className="mt-1 text-xs text-gray-500">
            6-character code provided by the household owner
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || inviteCode.length < 6}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Joining...
            </div>
          ) : (
            'Join Household'
          )}
        </button>
      </form>
    </div>
  );
};

export default JoinHousehold;