import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { createHousehold, inviteToHousehold, leaveHousehold } from '../../lib/auth-utils';
import toast from 'react-hot-toast';

const HouseholdManager: React.FC = () => {
  const { user, profile, household, refreshHousehold } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim()) return;

    setLoading(true);
    try {
      await createHousehold(householdName.trim());
      await refreshHousehold();
      setShowCreateForm(false);
      setHouseholdName('');
      toast.success('Household created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      const invitation = await inviteToHousehold(
        inviteEmail.trim(),
        inviteUsername.trim() || undefined
      );
      setShowInviteForm(false);
      setInviteEmail('');
      setInviteUsername('');
      toast.success(`Invitation sent! Code: ${invitation.invite_code}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to leave this household?')) return;

    setLoading(true);
    try {
      await leaveHousehold();
      await refreshHousehold();
      toast.success('Left household successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave household');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Household Management
        </h2>

        {household?.household_id ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {household.household_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Role: {household.role} • Status: {household.subscription_status}
                </p>
              </div>
              {household.role !== 'owner' && (
                <button
                  onClick={handleLeaveHousehold}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                >
                  Leave Household
                </button>
              )}
            </div>

            {household.role === 'owner' && (
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700"
                >
                  Invite Member
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Household Account
            </h3>
            <p className="text-gray-600 mb-4">
              Create a household account to share budgets with family members.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700"
            >
              Create Household
            </button>
          </div>
        )}
      </div>

      {/* Create Household Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create Household
              </h3>
              <form onSubmit={handleCreateHousehold} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Household Name
                  </label>
                  <input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="The Smith Family"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !householdName.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInviteForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Invite Family Member
              </h3>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    If they already have an account
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !inviteEmail.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HouseholdManager;