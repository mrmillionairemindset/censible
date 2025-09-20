import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BudgetProvider } from './contexts/BudgetContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './pages/Login';
import { generateDemoData } from './utils/demoData';
import './App.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Generate demo data if no transactions exist and user is authenticated
    if (user) {
      const existingTransactions = localStorage.getItem('centsible_transactions');
      if (!existingTransactions || JSON.parse(existingTransactions).length === 0) {
        generateDemoData();
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#27AE60]"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BudgetProvider>
      <div className="App">
        <Dashboard />
      </div>
    </BudgetProvider>
  );
};

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;