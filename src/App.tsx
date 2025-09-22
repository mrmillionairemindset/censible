import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { BudgetProvider } from './contexts/BudgetContextSupabase';
import AuthWrapper from './components/Auth/AuthWrapper';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function App() {
  return (
    <BudgetProvider>
      <Router>
        <AuthWrapper>
          <Dashboard />
        </AuthWrapper>
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
    </BudgetProvider>
  );
}

export default App;