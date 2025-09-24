# Centsible Subscription Tiers

## FREE TIER
**Core Features:**
- Basic transaction tracking (manual entry only)
- 8 core budget categories (fixed set)
- 2 months of transaction history
- Basic reporting (simple summaries)
- Basic savings goals (maximum 2 goals)
- **Household with up to 4 total members (1 owner + 3 read-only members)**
- **Email invitations with auto-generated access codes**
  - One-time use codes (6-8 character alphanumeric, e.g., J7K9M2)
  - 48-hour expiration
  - Invalid after successful use
  - Tied to specific household and role (viewer for free tier)
- **Read-only access for invited members** (can view but not edit)
- Manual budget creation

## PREMIUM TIER
**Everything in Free PLUS:**
- **OCR Receipt Scanning** (existing Tesseract.js integration)
- **Unlimited Savings Goals** with advanced tracking
- **Bills/Subscriptions Tracking** - Recurring transaction management
- **Custom Categories** - Create beyond the 8 core categories
- **Unlimited Transaction History** - No 2-month limit
- **Full Household Access** - Unlimited family members with full editing roles
- **Advanced member roles** (owner, admin, member, viewer, child with editing permissions)
- **Advanced Reports** - Trends, comparisons, detailed analytics
- **Income Management** - Multiple income sources tracking
- **Export Data** - CSV/PDF reports
- **Spending limits per member**
- **Budget editing permissions for all members**
- **Per-member tracking** - All transactions, savings goals, income sources, categories can be tracked individually per household member

## Key Differentiator
**Free**: Functional family budget viewing with owner-only editing
**Premium**: Full collaborative family financial management with individual member tracking

## Database Limits
- Free: `max_members = 4`, `max_savings_goals = 2`, `data_retention_months = 2`
- Premium: `max_members = NULL` (unlimited), `max_savings_goals = NULL` (unlimited), `data_retention_months = NULL` (unlimited)