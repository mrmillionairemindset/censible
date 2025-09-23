import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { SUBSCRIPTION_PLANS, createHouseholdCheckoutSession } from '../../lib/stripe-utils';
import toast from 'react-hot-toast';

interface UpgradePromptProps {
  feature: string;
  onClose?: () => void;
  inline?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, onClose, inline = false }) => {
  const { user, household } = useAuth();
  const [loading, setLoading] = useState(false);

  const plan = SUBSCRIPTION_PLANS.premium_household;

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const successUrl = `${window.location.origin}/settings?upgrade=success`;
      const cancelUrl = `${window.location.origin}/settings?upgrade=cancelled`;

      const { url } = await createHouseholdCheckoutSession(successUrl, cancelUrl);
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start upgrade process');
      setLoading(false);
    }
  };

  const content = (
    <div className={`${inline ? '' : 'bg-white rounded-xl shadow-lg'} p-6`}>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-mint-100 mb-4">
          <svg className="w-6 h-6 text-mint-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Premium Feature Required
        </h3>

        <p className="text-gray-600 mb-4">
          {feature} requires a Premium Household subscription.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{plan.name}</h4>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">
                ${(plan.price / 100).toFixed(2)}
              </span>
              <span className="text-gray-600">/{plan.interval}</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

          <ul className="text-sm text-gray-600 space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-4 h-4 text-mint-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Maybe Later
            </button>
          )}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Upgrading...
              </div>
            ) : (
              'Upgrade Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </motion.div>
    </motion.div>
  );
};

export default UpgradePrompt;