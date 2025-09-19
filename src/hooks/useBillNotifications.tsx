import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

interface Bill {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  reminderDays: number;
  lastPaid?: string;
}

export const useBillNotifications = () => {
  useEffect(() => {
    const checkBillReminders = () => {
      const savedBills = localStorage.getItem('centsible_bills');
      if (!savedBills) return;

      const bills: Bill[] = JSON.parse(savedBills);
      const today = new Date();

      const urgentBills = bills.filter(bill => {
        const daysUntilDue = getDaysUntilDue(bill.dueDay);
        return daysUntilDue <= bill.reminderDays && daysUntilDue >= 0;
      });

      if (urgentBills.length > 0) {
        // Check if we've already shown notifications today
        const lastNotificationDate = localStorage.getItem('centsible_last_bill_notification');
        const todayString = today.toDateString();

        if (lastNotificationDate !== todayString) {
          urgentBills.forEach(bill => {
            const daysUntil = getDaysUntilDue(bill.dueDay);

            toast.success(
              `💰 ${bill.name} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} - $${bill.amount}`,
              {
                duration: 5000,
                style: {
                  background: daysUntil === 0 ? '#FEE2E2' : '#FEF3C7',
                  border: daysUntil === 0 ? '1px solid #FECACA' : '1px solid #FDE68A',
                },
              }
            );
          });

          // Mark that we've shown notifications today
          localStorage.setItem('centsible_last_bill_notification', todayString);
        }
      }
    };

    const getDaysUntilDue = (dueDay: number) => {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Create due date for this month
      let dueDate = new Date(currentYear, currentMonth, dueDay);

      // If due date has passed this month, use next month
      if (dueDate < today) {
        dueDate = new Date(currentYear, currentMonth + 1, dueDay);
      }

      const timeDiff = dueDate.getTime() - today.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };

    // Check immediately on mount
    checkBillReminders();

    // Set up interval to check every hour
    const interval = setInterval(checkBillReminders, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getUrgentBillsCount = (): number => {
    const savedBills = localStorage.getItem('centsible_bills');
    if (!savedBills) return 0;

    const bills: Bill[] = JSON.parse(savedBills);

    const getDaysUntilDue = (dueDay: number) => {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Create due date for this month
      let dueDate = new Date(currentYear, currentMonth, dueDay);

      // If due date has passed this month, use next month
      if (dueDate < today) {
        dueDate = new Date(currentYear, currentMonth + 1, dueDay);
      }

      const timeDiff = dueDate.getTime() - today.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };

    return bills.filter(bill => {
      const daysUntilDue = getDaysUntilDue(bill.dueDay);
      return daysUntilDue <= bill.reminderDays && daysUntilDue >= 0;
    }).length;
  };

  return { getUrgentBillsCount };
};