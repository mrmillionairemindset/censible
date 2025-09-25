# Claude Development Notes

## 🔥 ALWAYS CHECK FIRST
**Before making ANY feature/permission decisions, ALWAYS read:**
- `SUBSCRIPTION_TIERS.md` - Definitive feature allocation and limits

## 🚨 CRITICAL RULES
- **NEVER assume libraries exist** - Always check package.json or imports first
- **ALWAYS use database functions, not localStorage** - Data must persist
- **Supabase doesn't have exec_sql function** - Use direct SQL execution via postgres client
- **Direct database connection may need pooler URL** - Try aws-0-us-west-1.pooler.supabase.com format
- **Browser session auth vs server scripts** - Supabase auth.getUser() fails in Node scripts, use direct DB queries instead
- **Migration needs existing schema analysis first** - Use check_schema.js before running migrations to avoid conflicts
- **PostgreSQL client works when Supabase RPC fails** - Use pg package + pooler connection for admin operations
- **Income is managed in BudgetPage.tsx, NOT IncomeTracker.tsx** - User confirmed this
- **Free tier gets 4 members (1 owner + 3 read-only), not solo** - Updated in migration
- **Per-member tracking is PREMIUM ONLY** - Individual spending/goal tracking
- **Supabase relationship queries fail without foreign keys** - Use separate queries to avoid PGRST200 errors
- **Missing table columns cause 42703 errors** - Add missing columns with ALTER TABLE statements

## 📝 ADD NEW LEARNINGS HERE
**When you discover new bugs, database issues, or Centsible quirks, ADD THEM ABOVE in Critical Rules section!**
- Format: **RULE** - Explanation/context
- This prevents repeating the same debugging sessions

## 🏗 Architecture Decisions
- **Household-first data model** - Everything scoped to households, not individual users
- **Invitation-based onboarding** - Don't auto-create households, let users join existing ones
- **Database-enforced feature gates** - Use SQL functions for subscription limits
- **RLS policies** - Household-based data access control

## 📂 Key Files
**Main Architecture:**
- `household_migration.sql` - Database migration script (updated with 4-member free tier)
- `SUBSCRIPTION_TIERS.md` - Feature definitions (CHECK THIS FIRST!)
- `MOCK_DATA_AUDIT.md` - Comprehensive audit of all mock data needing live database connections
- `src/pages/BudgetPage.tsx` - Where income is actually managed
- `src/hooks/useOCR.ts` - Existing OCR functionality (Tesseract.js)
- `src/components/Subscription/SubscriptionManager.tsx` - Existing Stripe subscription management
- `src/lib/stripe-utils.ts` - Stripe API functions and checkout/billing portal integration

**Debugging & Maintenance Scripts:**
- `run_migration_pg.js` - WORKING migration script using PostgreSQL client
- `household_migration_targeted.sql` - WORKING targeted migration for existing schema
- `verify_migration_simple.js` - WORKING verification with direct database access
- `check_schema.js` - Schema analysis tool (essential before migrations)
- `verify_migration_admin.js` - Admin verification without user session
- `run_migration.js` - FAILED - Migration execution script (no exec_sql function)
- `run_migration_direct.js` - Direct migration checker
- `verify_migration.js` - FAILED - Needs browser session (use simple version instead)
- `check_db.js` - Database debugging script (checks income sources, user auth)
- `debug_income.js` - Income-specific debugging
- `debug-categories.js` - Category debugging
- `clear_income_localstorage.js` - Clear localStorage income data
- `run_sql_cleanup.js` - General SQL cleanup utility

**Historical SQL Fixes:**
- `complete_policy_fix.sql` - RLS policy fixes
- `verify_policies.sql` - Policy verification queries
- `remove_duplicate_income_table.sql` - Cleanup duplicate tables
- `apply_emergency_fix.sql`, `quick_fix.sql`, `manual_fix.sql` - Emergency patches

## ⚡ Current Status
- ✅ Income persistence bug FIXED (moved from localStorage to database)
- ✅ Household architecture COMPLETED with subscription gating
- ✅ Migration SUCCESSFULLY EXECUTED using PostgreSQL client
- ✅ User households created and income sources linked
- ✅ Subscription tiers defined and documented
- ✅ Feature gate functions working in database
- ✅ TypeScript compilation errors FIXED (duplicate functions resolved)
- ✅ Mandatory household signup flow IMPLEMENTED
- ✅ SQL ambiguous column references FIXED
- ✅ Feature gates IMPLEMENTED with OCR premium restrictions
- ✅ Mock data audit COMPLETED (50+ items identified)
- ✅ Household member loading FIXED (Supabase relationship error resolved)
- ⚠️ ALL PAGES USE MOCK DATA - Critical UI elements need live database connections

## 🎯 Next Steps
1. ✅ COMPLETED - Migration executed successfully
2. ✅ COMPLETED - TypeScript compilation errors fixed
3. ✅ COMPLETED - Invitation system with one-time codes built
4. ✅ COMPLETED - Feature gates implemented in React components
5. **CRITICAL PRIORITY** - Replace mock data with live database connections (see `MOCK_DATA_AUDIT.md`)
   - Phase 1: Fix HouseholdPage.tsx critical mock data (50+ UI elements)
   - Phase 2: Create missing database tables (bills, savings_goals)
   - Phase 3: Connect all pages to live data systematically

## 💡 Key Workarounds Discovered
- **Supabase RPC limitations**: Use pg package with pooler connection for migrations
- **Schema conflicts**: Always run check_schema.js first to understand existing structure
- **Auth session issues**: Use direct database queries instead of Supabase auth in Node scripts
- **Migration approach**: Targeted migrations work better than full schema rebuilds

## 🔄 Development Workflow
**MANDATORY: Create commit after EVERY significant change to app code:**
1. Complete any implementation/fix/feature work
2. **Run quality checks first:**
   - `npm run build` - Catch any production build errors
   - `npm test` - Run tests if available
   - `npm run lint` - Check code quality
3. Stage all changes: `git add .`
4. Create commit with descriptive message: `git commit -m "[commit message]"`
5. Push to remote: `git push origin master`
6. **ONLY include app functionality changes** - No mentions of documentation or local scripts
7. **NEVER mention "Claude" in commit messages** - Focus only on what was changed in the application
8. Use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.
9. Commit covers the actual functionality added/changed, not the development process

**Complete commit sequence:**
```bash
# Run these checks first:
npm run build  # Catch any production build errors
npm test       # Run tests if available
npm run lint   # Check code quality

# Then commit:
git add .
git commit -m "[commit message]"
git push origin master
```

**Example good commits with proper format:**
- `git commit -m "feat: Add live database queries for household member management"`
- `git commit -m "fix: Update permission checks to use actual household roles"`
- `git commit -m "refactor: Replace mock data with real-time database connections"`

**Example BAD commits (avoid these):**
- `docs: Update Claude documentation` ❌
- `feat: Add functionality as requested by Claude` ❌
- `fix: Issues found during development session` ❌

## Version Tagging Strategy

### Semantic Versioning Format
`vMAJOR.MINOR.PATCH` (e.g., v3.1.0)

### When to Tag Versions

#### MAJOR Version (Breaking Changes)
Create a major version when changes break backward compatibility:
- Database schema migrations required
- Authentication system overhauls
- Data structure changes affecting existing users
- Removal of existing features
- Technology stack changes (e.g., localStorage → Supabase)
- API contract changes

**Examples:**
- v3.0.0: "Migrate to Supabase database from localStorage"
- v4.0.0: "Implement tiered pricing with feature restrictions"

#### MINOR Version (New Features)
Create a minor version for backward-compatible functionality:
- New pages or navigation structure
- Additional features (receipt scanning, reports)
- UI redesigns maintaining functionality
- Performance optimizations
- New integrations

**Examples:**
- v3.1.0: "Add household management system"
- v3.2.0: "Implement bill tracking and recurring transactions"

#### PATCH Version (Fixes)
Bundle fixes rather than tagging each one:
- Bug fixes
- Security patches
- UI corrections
- Documentation updates

### Tagging Commands
```bash
# Pre-tag checklist
npm run build              # Verify production build
npm test                   # Run test suite
git status                 # Ensure clean working tree

# Create annotated tag
git tag -a v3.1.0 -m "Feature: Add household management system"

# Push tag to remote
git push origin v3.1.0

# Push all tags
git push origin --tags

# View existing tags
git tag -l

# Check current version
git describe --tags --abbrev=0
```

### Commit Before Tagging
Always create a release commit before tagging:
```bash
git add .
git commit -m "Release v3.1.0: [Brief description]

Features:
- List new features

Fixes:
- List bug fixes

Breaking changes: None"
```

## 🔧 TROUBLESHOOTING GUIDE

### Household Page - "Failed to Load Household Data" Error

**Issue**: Users report not seeing account holder or family members on household page

**Symptoms**:
- Console error: "Failed to Load Household Data"
- Empty household members list despite having household records
- Page displays loading state indefinitely

**Root Cause Analysis**:
1. Users had household records but missing corresponding household_members records
2. RLS policies had circular dependency issues preventing data access
3. Missing foreign key constraints between household_members and profiles tables
4. Supabase relationship queries failing with PGRST200 errors

**Specific Error Messages**:
```
PGRST200: Could not find a relationship between 'household_members' and 'profiles' in the schema cache
Error: Searched for a foreign key relationship between 'household_members' and 'profiles' in the schema 'public', but no matches were found.
```

**Solution Steps**:

1. **Fixed RLS Policies** (multiple SQL files):
   - `fix_households_rls.sql` - Fixed circular household policies
   - `fix_household_members_rls_v2.sql` - Restructured member policies to avoid circular dependency
   - Used separate user-only access patterns instead of nested household queries

2. **Enhanced Signup Process**:
   - `fix_signup_with_household.sql` - Modified handle_new_user() trigger
   - Automatically creates households AND household memberships at signup
   - Fixed constraint violations with proper plan_type ('premium_household') and subscription_tier ('free') values

3. **Added Missing Foreign Key Constraint**:
   ```sql
   ALTER TABLE household_members
   ADD CONSTRAINT household_members_user_id_fkey
   FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
   ```

4. **Refactored Data Loading Logic** (src/lib/auth-utils.ts:552-622):
   - Replaced Supabase nested relationship queries with separate queries
   - First query: Get household_members data directly
   - Second query: Get profiles data separately using .in() filter
   - Map data using profiles.find() instead of nested relationships

**Code Changes**:
- **Before**: Used Supabase nested select with `profiles (username, email, avatar_url)`
- **After**: Separate queries with manual data joining to avoid relationship dependency

**Files Modified**:
- `src/lib/auth-utils.ts` - getHouseholdMembers() function complete rewrite
- Multiple SQL policy fixes in project root
- Database schema updates for foreign key relationships

**Prevention**:
- Always add foreign key constraints when creating tables with relationships
- Use separate queries instead of Supabase nested selects when foreign keys might be missing
- Test RLS policies for circular dependencies before deploying
- Ensure signup triggers create ALL required records, not just profiles

**Testing Commands**:
```javascript
// Browser console debugging
debugHouseholdLoading() // Run this on household page to trace exact error
```

**Related Issues**:
- TypeScript compilation errors from cached function references (restart dev server)
- RLS policy violations during household creation (check policy syntax)
- Missing household_members records for existing users (run membership creation script)

---

### Other Potential Supabase Relationship Issues Found

**High Risk Functions** (using nested relationship queries):

1. **getTransactions()** (src/lib/auth-utils.ts:1452-1475):
   ```typescript
   .select(`
     *,
     created_by_profile:profiles!created_by(display_name, username),
     member_profile:profiles!member_id(display_name, username)
   `)
   ```
   - **Risk**: Two different profile relationships on transactions table
   - **Used in**: TransactionsPage.tsx, BudgetContext.tsx
   - **Potential Error**: PGRST200 if foreign keys missing for created_by or member_id

2. **Budget Period Service** (src/services/budgetPeriodService.ts:323-327):
   ```typescript
   .select(`
     *,
     budget_categories(spent)
   `)
   ```
   - **Risk**: Relationship between budget_periods and budget_categories
   - **Potential Error**: PGRST200 if foreign key missing

3. **Earlier getTransactions variant** (src/lib/auth-utils.ts:1135-1146):
   ```typescript
   .select(`
     amount,
     created_by,
     profiles:created_by (username, display_name)
   `)
   ```
   - **Risk**: Profile relationship on transactions
   - **Same underlying issue as #1 above**

**Recommended Preventive Actions**:
1. **Add missing foreign key constraints** for all relationship queries
2. **Convert high-risk functions to use separate queries** like getHouseholdMembers() fix
3. **Test all data loading functions** to identify PGRST200 errors before users encounter them
4. **Review all .select()` queries** with nested relationships in codebase

**Commands to Check for More Issues**:
```bash
# Find all nested relationship queries
grep -r "\.select(\`" src/ | grep -v node_modules
```

---

### Missing Database Columns - Error 42703

**Issue**: Database queries fail with column not found errors

**Symptoms**:
- Console error: `{code: "42703", details: null, hint: null, message: "column bills.is_recurring does not exist"}`
- Console error: `{code: "42703", details: null, hint: null, message: "column bills.is_active does not exist"}`
- App functions that depend on bills or other tables fail to load

**Root Cause**:
Code expects database columns that don't exist in the actual schema, likely due to:
1. Code development ahead of database migration
2. Missing migration scripts for new features
3. Schema drift between environments

**Specific Errors Found**:
- Bills table missing `is_recurring` and `is_active` columns
- Code in BillsPage.tsx and auth-utils.ts expects these columns

**Solution**:
1. **Created fix_bills_columns.sql** to add missing columns:
   ```sql
   ALTER TABLE bills
   ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;

   ALTER TABLE bills
   ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
   ```

2. **Applied fix via direct database connection**:
   ```bash
   psql "postgresql://..." -f fix_bills_columns.sql
   ```

**Files Affected**:
- `src/pages/BillsPage.tsx` - Uses both columns for bill creation and status display
- `src/lib/auth-utils.ts` - Bill type definitions and queries use these columns

**Prevention**:
- Always add database migrations when new columns are referenced in code
- Check database schema matches TypeScript type definitions
- Use `ADD COLUMN IF NOT EXISTS` to make migrations idempotent

**Detection Command**:
```bash
# Find all column references that might not exist
grep -r "is_recurring\|is_active" src/ | grep -v node_modules
```

**Additional Bills Table Fixes** (discovered during troubleshooting):
- Bills table also missing: `reminder_enabled`, `start_date`, `end_date`
- Added via `fix_more_bills_columns.sql`
- Total bills table now has 24 columns matching Bill interface

---

### UUID Validation Error - Error 22P02

**Issue**: Database insert fails with UUID validation error

**Symptoms**:
- Console error: `{code: "22P02", details: null, hint: null, message: "invalid input syntax for type uuid: \"\"}`
- Insert operations fail when creating records with UUID fields

**Root Cause**:
Code attempting to insert empty strings (`""`) into UUID database fields. PostgreSQL UUID fields require either:
- Valid UUID format (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)
- NULL value (for nullable UUID fields)
- Field omitted entirely (for optional UUID fields with defaults)

**Specific Error Found**:
- BillsPage.tsx setting `assigned_to: ''` for bills
- Empty string cannot be converted to UUID format

**Solution**:
1. **Updated createBill() function** (src/lib/auth-utils.ts:821-825):
   ```typescript
   // Filter out empty string UUID fields to avoid 22P02 errors
   const cleanBill = { ...bill };
   if (cleanBill.assigned_to === '') {
     delete cleanBill.assigned_to;
   }
   ```

2. **Prevention pattern** - Apply to all create functions:
   ```typescript
   // Clean UUID fields before database operations
   Object.keys(data).forEach(key => {
     if (data[key] === '' && isUUIDField(key)) {
       delete data[key];
     }
   });
   ```

**Files Affected**:
- `src/lib/auth-utils.ts` - createBill function
- `src/pages/BillsPage.tsx` - Source of empty assigned_to values

**Prevention**:
- Use `null` or `undefined` instead of empty strings for optional UUID fields
- Add validation before database insert operations
- Consider TypeScript strict mode to catch UUID type mismatches

**Detection Commands**:
```bash
# Find potential empty string UUID assignments
grep -r "assigned_to.*''" src/ | grep -v node_modules
grep -r ": ''" src/ | grep -E "(id|_id):" | grep -v node_modules
```

---

### NOT NULL Constraint Violation - Error 23502

**Issue**: Database insert fails due to required field being null

**Symptoms**:
- Console error: `{code: "23502", details: null, hint: null, message: "null value in column \"next_due\" of relation \"bills\" violates not-null constraint"}`
- Insert operations fail when required database fields are missing

**Root Cause**:
Code attempting to insert records without providing values for NOT NULL database columns. The mismatch occurs when:
- TypeScript interface marks fields as optional (`field?: type`)
- Database schema requires the field to be NOT NULL
- Application doesn't calculate/provide required values

**Specific Error Found**:
- Bills table requires `next_due` field (NOT NULL)
- Bill interface has `next_due?: string` (optional)
- createBill function wasn't calculating this required field

**Database NOT NULL Fields in Bills Table**:
- `amount`, `category`, `due_date`, `frequency`, `id`, `is_active`, `is_recurring`, `name`, `next_due`, `reminder_enabled`, `user_id`

**Solution**:
1. **Updated createBill() function** (src/lib/auth-utils.ts:827-830):
   ```typescript
   // Calculate next_due if not provided (required field)
   if (!cleanBill.next_due && cleanBill.due_date) {
     cleanBill.next_due = cleanBill.due_date; // For first occurrence, next_due equals due_date
   }
   ```

2. **General pattern for required field calculation**:
   ```typescript
   // Ensure all NOT NULL fields have values
   if (!data.required_field) {
     data.required_field = calculateDefaultValue(data);
   }
   ```

**Files Affected**:
- `src/lib/auth-utils.ts` - createBill function
- Bill interface should potentially mark required fields as non-optional

**Prevention**:
- Align TypeScript interfaces with database constraints
- Add validation for required fields before database operations
- Use database defaults where appropriate
- Document field calculation logic

**Detection Commands**:
```bash
# Find NOT NULL columns in a table
psql "connection_string" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'bills' AND is_nullable = 'NO';"

# Check for optional fields in interfaces that might be required
grep -r "?: " src/ | grep -E "(interface|type)" -A 10 -B 2
```

### Missing Database Columns During Inserts - Error PGRST204

**Issue**: Transaction creation fails with column not found in schema cache

**Symptoms**:
```
Error: {code: 'PGRST204', message: "Could not find the 'location' column of 'transactions' in the schema cache"}
```

**Root Cause**: Code tries to insert data into columns that don't exist in database table

**Solution**:

1. **Immediate Fix (Defensive Coding)**:
```typescript
// Create base object with guaranteed columns only
const newTransaction: any = {
  // Core required fields
  household_id: householdInfo.household_id,
  category: transaction.category,
  amount: transaction.amount,
  // ... other guaranteed fields
};

// Conditionally add optional fields only if they exist
if (transaction.location) {
  newTransaction.location = transaction.location;
}
if (transaction.merchant) {
  newTransaction.merchant = transaction.merchant;
}
```

2. **Database Migration (Long-term Fix)**:
```sql
-- Add missing columns
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS merchant TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT;
```

**Prevention**: Always verify database schema matches TypeScript interfaces before deploying

---

## 📋 USER PROFILE & SETTINGS COMPREHENSIVE PLAN

### 🎯 Implementation Strategy
**Approach**: Build comprehensive settings structure integrating existing Stripe components
**Priority**: Implement essential sections first, then expand to full feature set
**Integration**: Use existing `SubscriptionManager.tsx` and `stripe-utils.ts` for billing/subscription

### 📐 User Profile Dropdown Structure
```json
{
  "userMenu": [
    { "type": "link", "label": "Profile", "path": "/settings/profile" },
    { "type": "link", "label": "Settings", "path": "/settings" },
    { "type": "link", "label": "Help & Support", "path": "/help" },
    { "type": "link", "label": "About Centsible", "path": "/about" },
    { "type": "divider" },
    { "type": "action", "label": "Sign out", "action": "signOut" }
  ]
}
```

### 🏗️ Comprehensive Settings Structure

#### **1. Account Section** (`/settings/account`)
- **Name** - Display name, first/last name
- **Email** - Change email address
- **Phone** - Phone number for security/notifications
- **Password** - Change password with current password verification
- **Connected Accounts** - Future: Bank integrations, OAuth providers
- **Data & Privacy** - Data export, account deletion

#### **2. Profile Section** (`/settings/profile`)
- **Photo/Avatar** - Upload profile picture
- **Username/Handle** - Unique identifier (@username)
- **Bio** - Optional personal description
- **Location/Timezone** - Public location, timezone settings
- **Social Links** - Optional social media links

#### **3. Preferences Section** (`/settings/preferences`)
- **Language** - Interface language selection
- **Timezone** - User timezone for date/time display
- **Appearance** - Theme and visual settings:
  - **Theme Mode** - Light, Dark, System
  - **Accent Color** - Brand color customization
  - **Typography Scale** - Compact, Cozy, Roomy
  - **Contrast** - Normal, High
  - **Reduce Motion** - On, Off

#### **4. Notifications Section** (`/settings/notifications`)
- **Channels** - Email, Push, SMS, In-app
- **Categories** - Budget alerts, bill reminders, goal progress
- **Digests** - Daily, Weekly, Off
- **Quiet Hours** - Do not disturb schedule
- **Test** - Send test notification

#### **5. Billing Section** (`/settings/billing`) - **Uses Existing Components**
- **Billing Address** - Address for invoices
- **Payment Methods** - Credit cards, payment sources
- **Invoices & Receipts** - Download past invoices
- **Tax Info** - Tax ID, VAT numbers
- **Credits/Coupons** - Applied discounts

#### **6. Subscription Section** (`/settings/subscription`) - **Uses SubscriptionManager.tsx**
- **Current Plan** - Display current subscription status
- **Upgrade/Downgrade** - Plan selection and changes
- **Add-ons** - Additional features
- **Usage & Limits** - Current usage vs plan limits
- **Cancel/Pause** - Subscription management

#### **7. Security Section** (`/settings/security`)
- **Two-Factor Auth** - TOTP, SMS, Security Keys
- **Backup Codes** - Recovery codes
- **Active Sessions** - Currently logged in devices
- **Login History** - Recent login attempts
- **Trusted Devices** - Remembered devices
- **API & App Access** - Third-party integrations

### 🔗 Stripe Integration Points

#### **Current Stripe Functions Available:**
```typescript
// From stripe-utils.ts
createHouseholdCheckoutSession(successUrl, cancelUrl) // Subscription signup
createCustomerPortalSession(returnUrl) // Billing portal
hasPremiumAccess() // Check subscription status
getSubscriptionStatus() // Get current status
```

#### **Stripe Access Points in Settings:**
1. **Settings → Subscription → Upgrade** → `createHouseholdCheckoutSession()`
2. **Settings → Billing → Manage** → `createCustomerPortalSession()`
3. **Usage limits reached** → Upgrade prompts → Stripe Checkout
4. **Subscription page** → `SubscriptionManager` component

### 📄 Additional Pages Required

#### **About Page** (`/about`)
- **App Information** - Version, build, last update
- **Company Info** - About Centsible, mission statement
- **Legal** - Links to Privacy Policy, Terms, licenses
- **Credits** - Third-party libraries, attributions
- **Contact** - Link to support, feedback

#### **Settings Landing Page** (`/settings`)
- **Overview** - Account status, subscription, quick actions
- **Navigation** - Cards/links to all settings sections
- **Recent Activity** - Login history, recent changes
- **Quick Settings** - Most common toggles

### 🎯 Implementation Phases

#### **Phase 1: Essential (MVP)**
1. Update user dropdown with proper navigation
2. Create basic About page
3. Settings landing page with navigation
4. Profile page (basic info editing)
5. Account page (email, password)

#### **Phase 2: Subscription Integration**
6. Integrate existing SubscriptionManager into settings
7. Create billing section using Stripe portal
8. Usage limits display

#### **Phase 3: Advanced Features**
9. Security settings (2FA, sessions)
10. Preferences (theme, notifications)
11. Data export functionality

#### **Phase 4: Polish & Enhancement**
12. Avatar upload
13. Advanced notification settings
14. Connected accounts preparation

### 🔧 Technical Implementation Notes

#### **File Structure:**
```
src/pages/settings/
├── SettingsLayout.tsx          # Main settings wrapper
├── SettingsHome.tsx            # Settings landing page
├── AccountSettings.tsx         # Account section
├── ProfileSettings.tsx         # Profile section
├── SubscriptionSettings.tsx    # Uses SubscriptionManager
├── BillingSettings.tsx         # Stripe portal integration
├── SecuritySettings.tsx        # Security features
└── PreferencesSettings.tsx     # UI preferences
```

#### **Routing Structure:**
- `/settings` - Settings home
- `/settings/account` - Account settings
- `/settings/profile` - Profile settings
- `/settings/subscription` - Subscription management
- `/settings/billing` - Billing portal
- `/settings/security` - Security settings
- `/settings/preferences` - UI preferences
- `/about` - About page (moved from footer)

#### **Integration with Existing Code:**
- **User dropdown** - Update `MainNavigation.tsx` buttons to use proper routing
- **Stripe components** - Import and use existing `SubscriptionManager`
- **Auth context** - Use existing user/profile data from `useAuth()`
- **Form handling** - Consistent with existing patterns in codebase

### ✅ Success Criteria
- All user dropdown buttons functional
- About page accessible and informative
- Subscription management integrated seamlessly
- Stripe billing portal accessible
- Settings navigation intuitive and comprehensive
- Consistent UI/UX with existing app design
- Mobile responsive design
- Proper error handling and loading states

---