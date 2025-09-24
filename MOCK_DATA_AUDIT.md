# Mock Data to Live Data Transition Audit

## 🎯 Overview
This document tracks all mock/hardcoded data across the application that needs to be replaced with live database connections. Each item is prioritized and mapped to the appropriate Supabase table.

---

## 🚨 CRITICAL UI ELEMENTS MISSED IN FIRST AUDIT

The initial audit missed extensive UI elements that reference mock data. Here are the critical findings:

### Tab Badges & Counters
- **HouseholdPage.tsx:414-418** - "Invitations (1)" badge shows fake count from `pendingInvitations.length`
- **BillsPage.tsx:673-677** - Bills tab shows fake overdue count in red badge
- **All summary cards** - Calculated totals from mock data arrays

### Interactive Elements with Mock IDs
- **HouseholdPage.tsx:210-225** - Edit/delete buttons use fake member IDs (`member.id`)
- **BillsPage.tsx:507-527** - "Mark as Paid" and edit buttons use fake bill IDs
- **SavingsPage.tsx:381-386** - Edit goal buttons use mock goal IDs
- **All onClick handlers** - Reference mock data that won't exist in database

### Visual Indicators Using Mock Data
- **Permission checkmarks** - Based on fake `canEditBudget`, `canAddTransactions` flags
- **Status indicators** - Bill status badges, goal progress bars using fake percentages
- **Role badges** - Crown, UserCheck icons based on fake member roles
- **Progress bars** - All progress calculations from mock current/target amounts

### Cross-Referenced Mock Values
- **Member selection dropdowns** - Pre-populated with fake names "Sarah", "Mike", "Emma"
- **Financial calculations** - Daily averages, savings rates using hardcoded income (5200)
- **Date displays** - Join dates, last active timestamps, due dates all fake
- **Permission states** - All edit permissions based on hardcoded `profile?.id === '1'`

---

## 🔴 HIGH PRIORITY - Core Functionality

### 1. HouseholdPage.tsx - Family Members Section
**Location**: `src/pages/HouseholdPage.tsx:44-107`
**Current**: Hardcoded household members (Sarah, Mike, Emma, Jake Johnson)
**Needs**: Connect to `household_members` table with real-time data
**Impact**: Critical - Users can't see actual family members
**Database Query**:
```sql
SELECT * FROM household_members
WHERE household_id = user_household_id
ORDER BY role, joined_at
```
**Priority**: 🔴 CRITICAL

### 2. HouseholdPage.tsx - Pending Invitations
**Location**: `src/pages/HouseholdPage.tsx:109-119`
**Current**: Hardcoded invitation objects with mock codes
**Needs**: Connect to `invitation_codes` table
**Impact**: High - Invitation system won't work with real data
**Database Query**:
```sql
SELECT code, email, role, expires_at, created_at, used_at
FROM invitation_codes
WHERE household_id = user_household_id
ORDER BY created_at DESC
```
**Priority**: 🔴 CRITICAL

### 3. HouseholdPage.tsx - Owner Permission Check
**Location**: `src/pages/HouseholdPage.tsx:121`
**Current**: `profile?.id === '1'` hardcoded check
**Needs**: Real household role verification
**Impact**: High - Permission system broken
**Fix**: Use `household?.role === 'owner'` from AuthContext
**Priority**: 🔴 CRITICAL

---

## 🟡 MEDIUM PRIORITY - Feature Functionality

### 4. BillsPage.tsx - Recurring Expenses
**Location**: `src/pages/BillsPage.tsx:67-99`
**Current**: Hardcoded subscriptions (Netflix, Gym, Amazon Prime)
**Needs**: Connect to `bills` table with `is_recurring = true`
**Impact**: Medium - Bills tracking feature unusable
**Database Query**:
```sql
SELECT * FROM bills
WHERE household_id = user_household_id
AND is_recurring = true
ORDER BY next_due_date
```
**Priority**: 🟡 MEDIUM

### 5. BillsPage.tsx - Upcoming Bills
**Location**: `src/pages/BillsPage.tsx:102-179`
**Current**: Hardcoded bills (mortgage, utilities, insurance)
**Needs**: Connect to `bills` table
**Impact**: Medium - Bill management unusable
**Database Query**:
```sql
SELECT * FROM bills
WHERE household_id = user_household_id
AND status = 'pending'
ORDER BY due_date ASC
```
**Priority**: 🟡 MEDIUM

### 6. SavingsPage.tsx - Savings Goals
**Location**: `src/pages/SavingsPage.tsx:79-135`
**Current**: Hardcoded goals (Emergency fund, Vacation, Car, College)
**Needs**: Connect to `savings_goals` table
**Impact**: Medium - Savings tracking unusable
**Database Query**:
```sql
SELECT * FROM savings_goals
WHERE household_id = user_household_id
ORDER BY created_at DESC
```
**Priority**: 🟡 MEDIUM

### 7. SavingsPage.tsx - Goal Contributors
**Location**: `src/pages/SavingsPage.tsx:88,102,116,130`
**Current**: Hardcoded names ('Sarah', 'Mike', 'Emma')
**Needs**: Real household member names
**Impact**: Medium - Contributor tracking inaccurate
**Fix**: Join with `household_members` table
**Priority**: 🟡 MEDIUM

---

## 🟢 LOW PRIORITY - Analytics & Reports

### 8. ReportsPage.tsx - Spending by Member
**Location**: `src/pages/ReportsPage.tsx:36-41`
**Current**: Hardcoded member spending data
**Needs**: Aggregate from `transactions` table by `created_by`
**Impact**: Low - Analytics feature
**Database Query**:
```sql
SELECT hm.display_name, SUM(t.amount) as total_spent
FROM transactions t
JOIN household_members hm ON t.created_by = hm.user_id
WHERE t.household_id = user_household_id
GROUP BY hm.user_id, hm.display_name
```
**Priority**: 🟢 LOW

### 9. ReportsPage.tsx - Category Breakdown
**Location**: `src/pages/ReportsPage.tsx:43-52`
**Current**: Hardcoded category spending
**Needs**: Aggregate from `transactions` with budget comparison
**Impact**: Low - Analytics feature
**Database Query**:
```sql
SELECT category, SUM(amount) as spent,
       bc.budgeted_amount
FROM transactions t
JOIN budget_categories bc ON t.category = bc.category
WHERE t.household_id = user_household_id
GROUP BY category, bc.budgeted_amount
```
**Priority**: 🟢 LOW

### 10. ReportsPage.tsx - Monthly Trends
**Location**: `src/pages/ReportsPage.tsx:54-64`
**Current**: Hardcoded 9 months of financial data
**Needs**: Calculate from transaction history
**Impact**: Low - Analytics feature
**Database Query**: Aggregate transactions by month
**Priority**: 🟢 LOW

---

## 🛠️ INFRASTRUCTURE TASKS

### 11. Database Handler Functions
**Locations**: Multiple files with `console.log` placeholders
- `HouseholdPage.tsx:163-171` - Member management
- `BillsPage.tsx:377-379` - Bill payment
**Current**: Console logging instead of database operations
**Needs**: Implement proper Supabase mutations
**Priority**: 🔴 CRITICAL

### 12. SavingsPage.tsx - LocalStorage Fallback
**Location**: `src/pages/SavingsPage.tsx:43-59`
**Current**: Browser localStorage for data persistence
**Needs**: Replace with Supabase database calls
**Impact**: High - Data not shared across devices/users
**Priority**: 🟡 MEDIUM

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Critical Household Features (Week 1)
- [ ] Replace hardcoded household members with database query
- [ ] Connect invitation system to database
- [ ] Fix permission checks to use real roles
- [ ] Implement member management database operations

### Phase 2: Feature Data (Week 2)
- [ ] Connect bills/subscriptions to database
- [ ] Replace savings goals with live data
- [ ] Remove localStorage dependencies
- [ ] Add real-time subscriptions for data updates

### Phase 3: Analytics & Polish (Week 3)
- [ ] Implement spending analytics from transaction data
- [ ] Add category breakdown calculations
- [ ] Build monthly trend analysis
- [ ] Add member-specific reporting

---

## 🗄️ REQUIRED DATABASE TABLES

The following tables are needed for full live data integration:

1. ✅ **household_members** - Family member management
2. ✅ **invitation_codes** - Invitation system
3. ❌ **bills** - Bill and subscription tracking
4. ❌ **savings_goals** - Savings goal management
5. ✅ **transactions** - Transaction data (exists)
6. ✅ **budget_categories** - Budget tracking (exists)
7. ✅ **households** - Household info (exists)

**Missing Tables**: `bills`, `savings_goals` need to be created.

---

## 🚀 NEXT STEPS

1. **Immediate**: Fix HouseholdPage.tsx critical mock data (Priority 🔴)
2. **Next**: Create missing database tables (`bills`, `savings_goals`)
3. **Then**: Replace feature mock data systematically
4. **Finally**: Implement analytics and reporting

**Estimated Total Effort**: 3 weeks for complete transition from mock to live data.

---

---

## 🎨 DETAILED UI ELEMENT BREAKDOWN

### HouseholdPage.tsx UI Elements
- **Lines 201-207**: Member cards showing fake names, usernames, role badges
- **Lines 230-249**: Allowance displays with fake monthly amounts and balances
- **Lines 252-280**: Permission checkboxes showing fake edit/transaction permissions
- **Lines 284-286**: Fake join dates and last active timestamps
- **Lines 123-147**: Role icons and member type color badges from mock data
- **Lines 414-418**: **CRITICAL** - Tab badge showing "Invitations (1)" count

### BillsPage.tsx UI Elements
- **Lines 384-420**: Summary cards with totals calculated from mock data
- **Lines 450-535**: Bill table with fake names, amounts, due dates, statuses
- **Lines 557-621**: Subscription cards showing fake Netflix, gym memberships
- **Lines 673-677**: **CRITICAL** - Bills tab badge showing fake overdue count
- **Lines 507-527**: Interactive buttons using fake bill IDs for mark-as-paid actions

### SavingsPage.tsx UI Elements
- **Lines 295-345**: Summary cards with fake total saved, goals, contributions
- **Lines 354-434**: Goal cards with fake progress bars and contributor names
- **Lines 467-535**: Goals table displaying fake targets, saved amounts, deadlines
- **Lines 381-430**: Edit/action buttons using mock goal IDs

### ReportsPage.tsx UI Elements
- **Lines 73-121**: Key metrics cards with fake spending totals and savings rates
- **Lines 129-163**: Charts showing fake member spending and category breakdowns
- **Lines 216-251**: Member analysis cards with fake transaction counts and averages
- **Lines 354-359**: Monthly trend tables with fake income/expense data

## ⚠️ BREAKING CHANGES WHEN CONNECTING REAL DATA

### Immediate Breakages:
1. **All edit/delete buttons will throw errors** - Mock IDs don't exist in database
2. **Tab badges will show 0 or error** - Counts calculated from empty real data
3. **Permission checks will fail** - Hardcoded `profile?.id === '1'` breaks
4. **Financial calculations will be NaN** - Mock totals replaced with undefined
5. **Date displays will show "Invalid Date"** - Mock timestamps replaced with null

### Visual Inconsistencies:
1. **Empty member lists** - No real household members loaded yet
2. **$0.00 everywhere** - Real accounts start with no transaction history
3. **Missing progress bars** - Real goals start at 0% progress
4. **No status indicators** - Real bills have different status schema

---

*Last Updated: 2025-09-24*
*Total Mock Data Items: 50+ (Updated after comprehensive UI audit)*
*Critical UI Elements: 15+*
*Interactive Elements: 20+*
*Visual Indicators: 15+*