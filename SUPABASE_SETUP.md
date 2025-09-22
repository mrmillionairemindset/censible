# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Sign in
3. Create a new project
4. Choose a project name (e.g., "centsible")
5. Choose a region close to your users
6. Set a database password (save this!)

## 2. Get Project Credentials

1. Go to Project Settings → API
2. Copy your Project URL
3. Copy your `anon/public` API key (NOT the service role key)

## 3. Set Up Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Create Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the entire contents of `supabase/schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute

This will create:
- All necessary tables (`budget_periods`, `budget_categories`, `transactions`, `user_subscriptions`)
- Row Level Security policies
- Indexes for performance
- Triggers for automatic calculations
- A function to create user subscriptions on signup

## 5. Enable Authentication

1. Go to Authentication → Settings
2. Enable the auth providers you want (Email, Google, etc.)
3. For email auth, you may want to disable email confirmations for testing

## 6. Test the Setup

1. Start your React app: `npm start`
2. The app should load without errors
3. You're ready to implement the authentication UI!

## Database Schema Overview

### Tables Created:
- **budget_periods**: Monthly budget cycles
- **budget_categories**: Categories with allocated/spent amounts per period
- **transactions**: Individual transactions linked to periods and categories
- **user_subscriptions**: User tier management (free/paid)

### Key Features:
- **Automatic monthly reset**: Creates new periods automatically
- **Budget inheritance**: Copies categories from previous month
- **Real-time updates**: Spent amounts update automatically when transactions change
- **Data retention**: Free tier keeps 2 months, paid tier unlimited
- **Row Level Security**: Users can only see their own data

## Next Steps

1. Implement authentication UI
2. Update BudgetContext to use Supabase
3. Add real-time subscriptions
4. Test the monthly reset functionality