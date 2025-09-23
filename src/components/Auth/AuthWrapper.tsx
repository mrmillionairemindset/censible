import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthForm from './AuthForm';
import LoadingSpinner from '../LoadingSpinner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log(`[${new Date().toISOString()}] 🔒 AuthWrapper state:`, {
    hasUser: !!user,
    loading,
    userEmail: user?.email,
    userId: user?.id
  });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log(`[${new Date().toISOString()}] ⏳ AuthWrapper showing loading spinner`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 to-blue-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not authenticated
  if (!user) {
    console.log(`[${new Date().toISOString()}] 🔐 AuthWrapper showing login form`);
    return <AuthForm />;
  }

  // User is authenticated, show the main app content
  console.log(`[${new Date().toISOString()}] ✅ AuthWrapper showing main app for user:`, user?.email);
  return <>{children}</>;
};

export default AuthWrapper;