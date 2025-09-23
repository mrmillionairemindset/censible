import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const HouseholdHeader: React.FC = () => {
  const { profile, household } = useAuth();

  if (!profile) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {household?.household_name || 'Personal Budget'}
          </h1>
          <p className="text-sm text-gray-600">
            {household?.household_name
              ? `${household.household_name} • @${profile.username}`
              : `@${profile.username}`
            }
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {profile.display_name || profile.username}
            </p>
            <p className="text-xs text-gray-500">
              @{profile.username}
            </p>
          </div>

          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-mint-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {(profile.display_name || profile.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {household?.household_id && (
        <div className="mt-2 flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            household.subscription_status === 'active'
              ? 'bg-green-100 text-green-800'
              : household.subscription_status === 'trialing'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {household.subscription_status === 'active' && '✓ Premium'}
            {household.subscription_status === 'trialing' && '⏱ Trial'}
            {household.subscription_status === 'past_due' && '⚠ Payment Due'}
            {household.subscription_status === 'cancelled' && '✗ Cancelled'}
          </span>

          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Role: {household.role}
          </span>
        </div>
      )}
    </div>
  );
};

export default HouseholdHeader;