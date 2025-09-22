import React from 'react';
import { useBudget } from '../../contexts/BudgetContextSupabase';
import AuthForm from './AuthForm';
import LoadingSpinner from '../LoadingSpinner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading, authLoading, user } = useBudget();

  console.log(`[${new Date().toISOString()}] 🔒 AuthWrapper state:`, {
    isAuthenticated,
    isLoading,
    authLoading
  });

  // Show loading spinner while checking authentication
  if (isLoading) {
    const loadingMessage = authLoading ? 'Checking authentication...' : 'Loading your budget...';
    console.log(`[${new Date().toISOString()}] ⏳ AuthWrapper showing loading spinner - ${loadingMessage}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 to-blue-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    console.log(`[${new Date().toISOString()}] 🔐 AuthWrapper showing login form`);
    return <AuthForm />;
  }

  // User is authenticated, show the main app content
  console.log(`[${new Date().toISOString()}] ✅ AuthWrapper showing main app for user:`, user?.email);
  return <>{children}</>;
};

export default AuthWrapper;