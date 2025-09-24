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
**When finishing a major section/feature:**
1. Complete the implementation and testing
2. Provide a concise commit comment summarizing the changes
3. Include the exact git command: `git commit -m "provided comment"`
4. Wait for user to commit the changes
5. When user says "done", proceed to next tasks