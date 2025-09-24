import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { createHousehold, inviteToHousehold, leaveHousehold, getHouseholdInvitations } from '../../lib/auth-utils';
import toast from 'react-hot-toast';

const HouseholdManager: React.FC = () => {
  const { user, profile, household, refreshHousehold } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showInvitationsList, setShowInvitationsList] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [generatedInvite, setGeneratedInvite] = useState<{code: string, expires_at: string} | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
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
      const invitation = await inviteToHousehold(inviteEmail.trim(), inviteRole);
      setGeneratedInvite({
        code: invitation.invite_code,
        expires_at: invitation.expires_at
      });
      setShowInviteForm(false);
      setShowInviteCode(true);
      setInviteEmail('');
      setInviteRole('viewer');
      toast.success('Invitation created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invitation');
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

  const loadInvitations = async () => {
    if (!household?.household_id || !['owner', 'admin'].includes(household.role || '')) return;

    setLoading(true);
    try {
      const invitationList = await getHouseholdInvitations();
      setInvitations(invitationList);
      setShowInvitationsList(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Invitation code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy invitation code');
    }
  };

  const formatExpiresAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs <= 0) return 'Expired';
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m remaining`;
    return `${diffMinutes}m remaining`;
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

            {['owner', 'admin'].includes(household.role || '') && (
              <div className="border-t pt-4 flex gap-3">
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700"
                >
                  Create Invitation
                </button>
                <button
                  onClick={loadInvitations}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Manage Invitations
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
                Create Household Invitation
              </h3>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address (optional)
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to create a general invitation code
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
                  >
                    <option value="viewer">Viewer - Can view budgets and transactions</option>
                    <option value="member">Member - Can edit budgets and add transactions</option>
                    <option value="child">Child - Limited access to age-appropriate features</option>
                  </select>
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
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Invitation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Invitation Code Modal */}
      <AnimatePresence>
        {showInviteCode && generatedInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInviteCode(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Invitation Created Successfully!
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Invitation Code:</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-bold text-mint-600 bg-white px-3 py-2 rounded border">
                    {generatedInvite.code}
                  </span>
                  <button
                    onClick={() => copyInviteCode(generatedInvite.code)}
                    className="px-3 py-2 text-sm font-medium text-mint-600 bg-mint-50 border border-mint-200 rounded-lg hover:bg-mint-100"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Expires:</strong> {formatExpiresAt(generatedInvite.expires_at)}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  This code can only be used once and expires in 48 hours
                </p>
              </div>

              <button
                onClick={() => setShowInviteCode(false)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Invitations Modal */}
      <AnimatePresence>
        {showInvitationsList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInvitationsList(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Household Invitations
              </h3>

              {invitations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No invitations created yet</p>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-mint-600 bg-mint-50 px-2 py-1 rounded">
                            {invitation.code}
                          </span>
                          <button
                            onClick={() => copyInviteCode(invitation.code)}
                            className="text-xs px-2 py-1 text-mint-600 bg-mint-50 border border-mint-200 rounded hover:bg-mint-100"
                          >
                            Copy
                          </button>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          invitation.used_at
                            ? 'bg-green-100 text-green-800'
                            : new Date(invitation.expires_at) > new Date()
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {invitation.used_at ? 'Used' : new Date(invitation.expires_at) > new Date() ? 'Active' : 'Expired'}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Role:</strong> {invitation.role}</p>
                        {invitation.email && <p><strong>Email:</strong> {invitation.email}</p>}
                        <p><strong>Created by:</strong> {invitation.invited_by_email}</p>
                        <p><strong>Expires:</strong> {formatExpiresAt(invitation.expires_at)}</p>
                        {invitation.used_at && (
                          <p><strong>Used:</strong> {new Date(invitation.used_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowInvitationsList(false)}
                className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HouseholdManager;