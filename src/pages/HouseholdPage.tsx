import React, { useState } from 'react';
import { Users, UserPlus, Settings, Shield, DollarSign, Edit3, Trash2, Crown, Mail, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import HouseholdManager from '../components/Household/HouseholdManager';
import JoinHousehold from '../components/Household/JoinHousehold';

interface HouseholdMember {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'owner' | 'member' | 'viewer';
  memberType: 'adult' | 'teen' | 'child';
  joinedDate: string;
  lastActive: string;
  monthlyAllowance: number;
  allowanceBalance: number;
  monthlySpendingLimit?: number;
  canEditBudget: boolean;
  canAddTransactions: boolean;
  requiresApproval: boolean;
  avatar?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  invitedUsername?: string;
  inviteCode: string;
  sentDate: string;
  expiresAt: string;
  status: 'pending' | 'expired' | 'used';
}

const HouseholdPage: React.FC = () => {
  const { household, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'settings'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditMember, setShowEditMember] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');

  // Mock data - will be replaced with real data from database
  const householdMembers: HouseholdMember[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      username: 'sarah_j',
      email: 'sarah@email.com',
      role: 'owner',
      memberType: 'adult',
      joinedDate: '2025-09-01',
      lastActive: '2025-09-22',
      monthlyAllowance: 0,
      allowanceBalance: 0,
      canEditBudget: true,
      canAddTransactions: true,
      requiresApproval: false
    },
    {
      id: '2',
      name: 'Mike Johnson',
      username: 'mike_j',
      email: 'mike@email.com',
      role: 'member',
      memberType: 'adult',
      joinedDate: '2025-09-01',
      lastActive: '2025-09-21',
      monthlyAllowance: 0,
      allowanceBalance: 0,
      canEditBudget: true,
      canAddTransactions: true,
      requiresApproval: false
    },
    {
      id: '3',
      name: 'Emma Johnson',
      username: 'emma_j',
      email: 'emma@email.com',
      role: 'member',
      memberType: 'teen',
      joinedDate: '2025-09-05',
      lastActive: '2025-09-22',
      monthlyAllowance: 50,
      allowanceBalance: 23.50,
      monthlySpendingLimit: 75,
      canEditBudget: false,
      canAddTransactions: true,
      requiresApproval: true
    },
    {
      id: '4',
      name: 'Jake Johnson',
      username: 'jake_j',
      email: 'jake@email.com',
      role: 'member',
      memberType: 'child',
      joinedDate: '2025-09-05',
      lastActive: '2025-09-20',
      monthlyAllowance: 25,
      allowanceBalance: 18.75,
      monthlySpendingLimit: 35,
      canEditBudget: false,
      canAddTransactions: true,
      requiresApproval: true
    }
  ];

  const pendingInvitations: PendingInvitation[] = [
    {
      id: '1',
      email: 'grandma@email.com',
      invitedUsername: 'grandma_j',
      inviteCode: 'ABC123XYZ',
      sentDate: '2025-09-20',
      expiresAt: '2025-09-27',
      status: 'pending'
    }
  ];

  const isOwner = household?.role === 'owner' || household?.role === 'admin';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'member':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <UserX className="w-4 h-4 text-gray-500" />;
      default:
        return null;
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

  const handleInviteMember = async () => {
    try {
      const { inviteToHousehold } = await import('../lib/auth-utils');
      await inviteToHousehold(inviteEmail, inviteUsername);
      alert('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteUsername('');
    } catch (error) {
      alert(`Failed to send invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    // In real app, this would remove the member from the household
    console.log('Removing member:', memberId);
  };

  const handleUpdateMemberPermissions = (memberId: string, updates: any) => {
    // In real app, this would update member permissions
    console.log('Updating member permissions:', memberId, updates);
    setShowEditMember(null);
  };

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Family Members</h3>
          <p className="text-gray-600">Manage who has access to your family budget</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 bg-mint-600 text-white px-4 py-2 rounded-lg hover:bg-mint-700"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {householdMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    {getRoleIcon(member.role)}
                  </div>
                  <p className="text-sm text-gray-600">@{member.username}</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMemberTypeColor(member.memberType)} mt-1`}>
                    {member.memberType}
                  </div>
                </div>
              </div>
              {isOwner && member.role !== 'owner' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowEditMember(member.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Allowance Info */}
              {member.monthlyAllowance > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Allowance</span>
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-purple-600">Monthly:</span>
                      <div className="font-semibold text-purple-800">${member.monthlyAllowance}</div>
                    </div>
                    <div>
                      <span className="text-purple-600">Balance:</span>
                      <div className={`font-semibold ${member.allowanceBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${member.allowanceBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Permissions */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-800 mb-2">Permissions</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Edit Budget:</span>
                    <span className={member.canEditBudget ? 'text-green-600' : 'text-red-600'}>
                      {member.canEditBudget ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Add Transactions:</span>
                    <span className={member.canAddTransactions ? 'text-green-600' : 'text-red-600'}>
                      {member.canAddTransactions ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Requires Approval:</span>
                    <span className={member.requiresApproval ? 'text-yellow-600' : 'text-green-600'}>
                      {member.requiresApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {member.monthlySpendingLimit && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Spending Limit:</span>
                      <span className="text-gray-800">${member.monthlySpendingLimit}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity */}
              <div className="text-xs text-gray-500">
                <div>Joined: {member.joinedDate}</div>
                <div>Last active: {member.lastActive}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInvitationsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HouseholdManager />
        <JoinHousehold />
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Household Settings</h3>
        <p className="text-gray-600">Configure your family budget settings and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Basic Information</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Household Name</label>
            <input
              type="text"
              value={household?.household_name || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={!isOwner}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2" disabled={!isOwner}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Default Permissions</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Require approval for child transactions</div>
              <div className="text-sm text-gray-600">Children must get approval before spending</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked disabled={!isOwner} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mint-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Require approval for teen transactions over $25</div>
              <div className="text-sm text-gray-600">Teens need approval for larger purchases</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked disabled={!isOwner} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mint-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-600"></div>
            </label>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">Danger Zone</h4>
              <p className="text-sm text-red-600 mb-4">
                These actions cannot be undone. Please be certain.
              </p>
              <div className="space-y-3">
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                  Transfer Ownership
                </button>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm ml-3">
                  Delete Household
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Household Management</h1>
        <p className="text-gray-600">
          Manage your {household?.household_name || 'family'} members, permissions, and settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'members', label: 'Members', icon: Users },
            { id: 'invitations', label: 'Invitations', icon: Mail },
            { id: 'settings', label: 'Settings', icon: Settings }
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
                {tab.id === 'invitations' && pendingInvitations.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {pendingInvitations.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && renderMembersTab()}
      {activeTab === 'invitations' && renderInvitationsTab()}
      {activeTab === 'settings' && renderSettingsTab()}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Family Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="family.member@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Username (Optional)</label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="username"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                className="flex-1 bg-mint-600 text-white py-2 px-4 rounded-lg hover:bg-mint-700"
                disabled={!inviteEmail}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseholdPage;