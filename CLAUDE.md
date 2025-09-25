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