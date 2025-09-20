import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { BudgetProvider } from './contexts/BudgetContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { generateDemoData } from './utils/demoData';
import './App.css';

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#27AE60]"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const DashboardWrapper: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Generate demo data if no transactions exist and user is authenticated
    if (user) {
      const existingTransactions = localStorage.getItem('centsible_transactions');
      if (!existingTransactions || JSON.parse(existingTransactions).length === 0) {
        generateDemoData();
      }
    }
  }, [user]);

  if (!user) return null;

  return (
    <BudgetProvider userId={user.id}>
      <div className="App">
        <Dashboard />
      </div>
    </BudgetProvider>
  );
};

const AppContent: React.FC = () => {

  return (
    <Routes>
      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/signup" element={
        <AuthRoute>
          <Signup />
        </AuthRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardWrapper />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;