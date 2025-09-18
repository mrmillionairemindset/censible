import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BudgetProvider } from './contexts/BudgetContext';
import Dashboard from './components/Dashboard/Dashboard';
import { generateDemoData } from './utils/demoData';
import './App.css';

function App() {
  useEffect(() => {
    // Generate demo data if no transactions exist
    const existingTransactions = localStorage.getItem('centsible_transactions');
    if (!existingTransactions || JSON.parse(existingTransactions).length === 0) {
      generateDemoData();
    }
  }, []);

  return (
    <BudgetProvider>
      <div className="App">
        <Dashboard />
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
      </div>
    </BudgetProvider>
  );
}

export default App;