import React, { useState } from 'react';
import { ArrowLeft, Search, Book, User, PiggyBank, BarChart3, Users, CreditCard, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Set up your account and learn the basics',
      icon: Book,
      articles: [
        {
          id: 'setup-account',
          title: 'Setting Up Your Centsible Account',
          content: `
# Setting Up Your Centsible Account

Welcome to Centsible! Let's get your account set up for successful budgeting.

## Step 1: Create Your Profile
1. Sign up with your email address
2. Choose a secure password
3. Verify your email address
4. Complete your profile information

## Step 2: Set Up Your Household
- **Free Plan**: You get 4 total members (1 owner + 3 read-only)
- **Premium Plans**: More members and advanced features
- Invite family members via email with one-time invitation codes

## Step 3: Add Your First Income Source
1. Go to the Budget page
2. Click "Add Income Source"
3. Enter your salary, freelance income, or other sources
4. Set frequency (weekly, bi-weekly, monthly, etc.)

## Step 4: Create Budget Categories
- Start with essential categories: Housing, Food, Transportation
- Add custom categories for your specific needs
- Set spending limits for each category

## Next Steps
- Add your first transactions
- Set up savings goals
- Explore the Reports page for insights
          `
        },
        {
          id: 'first-budget',
          title: 'Creating Your First Budget',
          content: `
# Creating Your First Budget

A good budget is the foundation of financial success. Here's how to create one in Centsible.

## The 50/30/20 Rule (Recommended Starting Point)
- **50% Needs**: Housing, food, utilities, minimum debt payments
- **30% Wants**: Entertainment, dining out, hobbies
- **20% Savings**: Emergency fund, retirement, debt payoff

## Setting Up Categories

### Essential Categories
1. **Housing** - Rent/mortgage, property taxes, insurance
2. **Food** - Groceries, necessary meals
3. **Transportation** - Car payments, gas, public transit
4. **Utilities** - Electric, water, phone, internet
5. **Insurance** - Health, auto, life insurance
6. **Minimum Debt Payments** - Credit cards, loans

### Flexible Categories
1. **Entertainment** - Movies, subscriptions, games
2. **Dining Out** - Restaurants, coffee, takeout
3. **Personal Care** - Haircuts, gym, clothing
4. **Gifts** - Birthdays, holidays, donations

### Savings Categories
1. **Emergency Fund** - 3-6 months of expenses
2. **Retirement** - 401k, IRA contributions
3. **Short-term Goals** - Vacation, new car, home repairs

## Tips for Success
- Start with realistic amounts
- Review and adjust monthly
- Don't be too restrictive initially
- Track your spending for the first month before making big changes
          `
        }
      ]
    },
    {
      id: 'budgeting',
      title: 'Budgeting & Planning',
      description: 'Master your budget and financial planning',
      icon: PiggyBank,
      articles: [
        {
          id: 'budget-categories',
          title: 'Understanding Budget Categories',
          content: `
# Understanding Budget Categories

Budget categories help organize your spending and track where your money goes.

## Core vs Custom Categories

### Core Categories
These are essential categories that most people need:
- **Housing** - Your largest expense category
- **Food** - Groceries and essential meals
- **Transportation** - Getting around costs
- **Utilities** - Basic services you need

*Core categories are marked with a "Core" tag in the app.*

### Custom Categories
These are personalized to your lifestyle:
- **Hobbies** - Your specific interests
- **Professional Development** - Career growth
- **Pet Care** - If you have pets
- **Travel** - Vacation and travel funds

*Custom categories are marked with a "Custom" tag.*

## Setting Budget Amounts

### Method 1: Historical Spending
1. Track spending for 1-2 months
2. Use those averages as starting budgets
3. Adjust based on your goals

### Method 2: Goal-Based Budgeting
1. Start with your income
2. Subtract fixed expenses (rent, loans)
3. Allocate remaining money to priorities
4. Adjust as needed

## Managing Your Categories
- **Add New**: Click "Add Category" on the Budget page
- **Edit Amounts**: Click on any budget amount to modify
- **Archive Unused**: Remove categories you no longer need
- **Reorder**: Drag categories to organize by priority

## Pro Tips
- Don't create too many categories initially
- Combine similar expenses until you need more detail
- Review monthly and adjust based on actual spending
- Use the "Other" category for miscellaneous expenses
          `
        },
        {
          id: 'track-spending',
          title: 'Tracking Your Spending',
          content: `
# Tracking Your Spending

Consistent tracking is key to successful budgeting. Here's how to make it easy.

## Adding Transactions

### Manual Entry
1. Go to Transactions page
2. Click "Add Transaction"
3. Enter amount, category, and description
4. Add date and any notes

### Quick Entry Tips
- Use clear, searchable descriptions
- Choose the most accurate category
- Add location if helpful for tracking
- Include payment method if relevant

## Transaction Categories

### Choosing the Right Category
- **Be Consistent** - Always use the same category for similar expenses
- **When in Doubt** - Choose the broader category
- **Groceries vs Dining** - Groceries = home cooking, Dining = restaurants
- **Gas vs Car Maintenance** - Separate transportation costs

### Common Category Mistakes
- Putting everything in "Other"
- Creating too many similar categories
- Mixing needs and wants in same category
- Not being consistent with categorization

## Staying on Top of Tracking

### Daily Habits (5 minutes)
- Enter transactions when they happen
- Use your phone to quickly add expenses
- Take photos of receipts for later entry

### Weekly Review (15 minutes)
- Check if you missed any transactions
- Review bank/credit card statements
- Correct any miscategorized items
- Update any pending transactions

### Monthly Analysis (30 minutes)
- Compare spending to budget
- Identify overspending categories
- Adjust next month's budget
- Celebrate staying within budget!

## Pro Tips
- Set up notifications to remind you to track
- Use consistent naming for recurring expenses
- Don't stress about perfect accuracy
- Focus on major spending patterns, not every penny
          `
        }
      ]
    },
    {
      id: 'savings',
      title: 'Savings & Goals',
      description: 'Build your savings and achieve financial goals',
      icon: BarChart3,
      articles: [
        {
          id: 'savings-goals',
          title: 'Setting Up Savings Goals',
          content: `
# Setting Up Savings Goals

Savings goals help you stay motivated and track progress toward important financial milestones.

## Types of Savings Goals

### Emergency Fund
- **Target**: 3-6 months of expenses
- **Priority**: Should be your first goal
- **Timeline**: 6-12 months for most people
- **Type**: Use "Emergency Fund" category

### Short-term Goals (1-2 years)
- Vacation
- New car down payment
- Home repairs
- Wedding expenses
- **Type**: Use "Major Purchase" category

### Medium-term Goals (2-5 years)
- Home down payment
- Starting a business
- Advanced education
- **Type**: Use "Major Purchase" or "Custom" category

### Long-term Goals (5+ years)
- Retirement
- Children's education
- Early retirement (FIRE)
- **Type**: Use "Retirement" category

## Creating a Savings Goal

1. **Go to Savings page**
2. **Click "Add Savings Goal"**
3. **Fill in details:**
   - Goal name (be specific)
   - Target amount
   - Target date
   - Goal type/category
   - Optional: Add contributors for household goals

## Goal Amount Calculation

### Emergency Fund Example
- Monthly expenses: $4,000
- Target: 6 months = $24,000
- Timeline: 12 months
- Monthly saving needed: $2,000

### Vacation Example
- Trip cost: $3,000
- Timeline: 8 months
- Monthly saving needed: $375

## Staying Motivated

### Track Progress
- Check your Savings page regularly
- Celebrate milestones (25%, 50%, 75%)
- Adjust timeline if needed

### Automate Savings
- Set up automatic transfers
- Save windfalls (tax refunds, bonuses)
- Round up purchases to savings

### Visual Motivation
- Use the progress bars in Centsible
- Create a visual chart at home
- Share goals with accountability partner

## Common Mistakes to Avoid
- Setting unrealistic timelines
- Not prioritizing emergency fund first
- Having too many goals at once
- Not adjusting for life changes
- Giving up after missing a month
          `
        }
      ]
    },
    {
      id: 'household',
      title: 'Household Management',
      description: 'Manage family finances and member permissions',
      icon: Users,
      articles: [
        {
          id: 'manage-members',
          title: 'Managing Household Members',
          content: `
# Managing Household Members

Centsible helps families manage finances together with proper permissions and access control.

## Subscription Tiers & Member Limits

### Free Plan
- **Total members**: 4 (1 owner + 3 read-only members)
- **Perfect for**: Small families getting started

### Premium Plans
- **More members**: Up to 10+ members depending on plan
- **Advanced features**: Per-member tracking, detailed permissions
- **Best for**: Larger households or advanced tracking needs

## Member Roles

### Owner (Account Holder)
- Full access to all features
- Can invite/remove members
- Manages billing and subscription
- Sets member permissions
- Can delete the household account

### Read-Only Members (Free Plan)
- View all financial data
- Cannot edit budgets or categories
- Cannot add/edit transactions
- Cannot manage savings goals
- Cannot invite other members

### Full Members (Premium Plans)
- Can add/edit their own transactions
- Can contribute to household goals
- Can view reports and analytics
- Cannot manage other members
- Cannot change core budget settings

## Inviting New Members

1. **Go to Household page**
2. **Click "Invite Member"**
3. **Enter their email address**
4. **Choose their role/permissions**
5. **Send invitation**

The invited person will receive:
- Email invitation with one-time code
- Instructions to create their account
- Automatic access to your household data

## Managing Existing Members

### Viewing Members
- See all current household members
- Check their roles and permissions
- View last activity (when they logged in)

### Updating Permissions
- Change member roles (Premium only)
- Adjust what they can access
- Temporarily restrict access if needed

### Removing Members
1. Go to member list
2. Click on member to manage
3. Choose "Remove from Household"
4. Confirm removal

*Note: Removed members lose all access to household data.*

## Best Practices

### For Couples
- Start with one person as owner
- Add partner as full member (Premium) or read-only (Free)
- Decide who handles which transactions
- Regular monthly budget meetings

### For Families with Kids
- Parents as full members
- Older teens as read-only to learn
- Separate "kid expenses" category
- Teach budgeting through involvement

### Privacy Considerations
- Members see ALL household financial data
- Only invite trusted family members
- Consider separate accounts for personal privacy
- Use household account for shared expenses only

## Troubleshooting

### Invitation Not Received
- Check spam folder
- Verify email address spelling
- Resend invitation after 24 hours
- Contact support if issues persist

### Member Can't Access Features
- Check their role/permissions
- Verify your subscription plan limits
- Ensure they're logged in to correct account
- Try removing and re-inviting if needed
          `
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      icon: HelpCircle,
      articles: [
        {
          id: 'common-issues',
          title: 'Common Issues & Solutions',
          content: `
# Common Issues & Solutions

Quick fixes for the most common Centsible issues.

## Login & Account Issues

### Can't Log In
**Problem**: Login failing or error messages
**Solutions**:
1. Check email spelling and password
2. Try password reset link
3. Clear browser cache and cookies
4. Try different browser or incognito mode
5. Check if Caps Lock is on

### Forgot Password
1. Go to login page
2. Click "Forgot Password"
3. Enter your email address
4. Check email for reset link (check spam)
5. Follow link to create new password

### Account Not Found
- Verify you're using the correct email
- Check if you signed up with Google/social login
- Contact support if you're sure the account exists

## Data & Sync Issues

### Missing Transactions
**Problem**: Transactions not showing up
**Solutions**:
1. Refresh the page (F5 or Ctrl+R)
2. Check if you're in the right household
3. Verify date range filters
4. Check if another member deleted it
5. Check your internet connection

### Budget Not Updating
1. Hard refresh: Ctrl+Shift+R (PC) or Cmd+Shift+R (Mac)
2. Log out and log back in
3. Check if changes were saved (look for save confirmation)
4. Contact support if issue persists

### Incorrect Balance Calculations
1. Check all transactions in the time period
2. Look for duplicate transactions
3. Verify transaction amounts are correct
4. Check for uncategorized transactions
5. Review income entries for accuracy

## Performance Issues

### App Running Slowly
1. Close other browser tabs
2. Restart your browser
3. Check internet connection speed
4. Try using a different browser
5. Clear browser cache

### Page Won't Load
1. Check internet connection
2. Try refreshing the page
3. Check if Centsible is down (status page)
4. Disable browser extensions temporarily
5. Try incognito/private browsing mode

## Feature-Specific Issues

### Can't Add Transactions
**Possible causes**:
- Missing required fields (amount, category)
- Date format issues
- Browser compatibility
- Insufficient permissions (read-only members)

**Solutions**:
1. Fill in all required fields
2. Check date format (MM/DD/YYYY)
3. Try a different browser
4. Verify your member permissions

### Savings Goal Not Updating
1. Check if transaction is in correct category
2. Verify goal dates and settings
3. Refresh the page
4. Check if goal is archived
5. Ensure transaction date is within goal period

### Reports Showing Incorrect Data
1. Check date range selected
2. Verify all transactions are categorized
3. Look for duplicate entries
4. Check if income is properly recorded
5. Try different date ranges to isolate issue

## Browser Compatibility

### Recommended Browsers
- **Chrome** 90+ (best performance)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Not Supported
- Internet Explorer (any version)
- Very old browser versions
- Browsers with JavaScript disabled

## Getting Additional Help

### Before Contacting Support
1. Try the solutions above
2. Note what browser you're using
3. Write down exact error messages
4. Note what you were trying to do when the issue occurred
5. Check if the issue happens on different devices

### When to Contact Support
- Solutions above don't work
- Data appears to be corrupted or missing
- Billing or subscription issues
- Account security concerns
- Feature requests or suggestions

### How to Contact Support
- Use the Contact page: /contact
- Email: support@centsible.app
- Include: browser, steps to reproduce, error messages
- Response time: within 24 hours
          `
        }
      ]
    }
  ];

  const filteredArticles = helpCategories.flatMap(category =>
    category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(article => ({ ...article, categoryTitle: category.title, categoryId: category.id }))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setSelectedArticle(null);
  };

  const selectArticle = (articleId: string) => {
    setSelectedArticle(articleId);
  };

  const selectedArticleData = helpCategories
    .flatMap(cat => cat.articles)
    .find(article => article.id === selectedArticle);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[#27AE60] hover:text-[#219A52] mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Help Center
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Find answers to common questions and learn how to get the most out of Centsible
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
              {/* Search Results */}
              {searchQuery && (
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Search Results ({filteredArticles.length})
                  </h3>
                  {filteredArticles.length > 0 ? (
                    <div className="space-y-2">
                      {filteredArticles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => {
                            selectArticle(article.id);
                            setExpandedCategory(article.categoryId);
                          }}
                          className="block w-full text-left p-2 rounded hover:bg-gray-50 text-sm"
                        >
                          <div className="font-medium text-gray-900">{article.title}</div>
                          <div className="text-xs text-gray-500">{article.categoryTitle}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No articles found matching "{searchQuery}"</p>
                  )}
                </div>
              )}

              {/* Categories */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {helpCategories.map((category) => {
                    const Icon = category.icon;
                    const isExpanded = expandedCategory === category.id;

                    return (
                      <div key={category.id}>
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-[#27AE60]" />
                            <div>
                              <div className="font-medium text-gray-900">{category.title}</div>
                              <div className="text-xs text-gray-500">{category.articles.length} articles</div>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="ml-8 mt-2 space-y-1">
                            {category.articles.map((article) => (
                              <button
                                key={article.id}
                                onClick={() => selectArticle(article.id)}
                                className={`block w-full text-left p-2 rounded text-sm hover:bg-gray-50 ${
                                  selectedArticle === article.id
                                    ? 'bg-[#27AE60] bg-opacity-10 text-[#27AE60] font-medium'
                                    : 'text-gray-700'
                                }`}
                              >
                                {article.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedArticleData ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="prose prose-gray max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedArticleData.content
                        .replace(/\n/g, '<br>')
                        .replace(/# (.*)/g, '<h1 class="text-2xl font-bold text-gray-900 mb-4">$1</h1>')
                        .replace(/## (.*)/g, '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h2>')
                        .replace(/### (.*)/g, '<h3 class="text-lg font-medium text-gray-900 mb-2 mt-4">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                        .replace(/(\d+)\. (.*)/g, '<div class="ml-4 mb-2"><strong>$1.</strong> $2</div>')
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center py-12">
                  <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No Article Selected' : 'Welcome to Help Center'}
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery
                      ? 'Select an article from the search results or browse categories'
                      : 'Choose a category from the sidebar to browse help articles, or use the search bar to find specific topics.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Still Need Help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#27AE60] bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-[#27AE60]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
              <p className="text-gray-600 text-sm mb-4">Get personalized help from our support team</p>
              <button
                onClick={() => window.location.href = '/contact'}
                className="text-[#27AE60] hover:text-[#219A52] font-medium text-sm"
              >
                Contact Us →
              </button>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#27AE60] bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-[#27AE60]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">System Status</h3>
              <p className="text-gray-600 text-sm mb-4">Check if there are any ongoing issues</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">All systems operational</span>
              </div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#27AE60] bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#27AE60]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Feature Requests</h3>
              <p className="text-gray-600 text-sm mb-4">Suggest improvements or new features</p>
              <button
                onClick={() => window.location.href = '/contact'}
                className="text-[#27AE60] hover:text-[#219A52] font-medium text-sm"
              >
                Send Feedback →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;