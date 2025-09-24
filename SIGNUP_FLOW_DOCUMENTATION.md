# Critical Signup Flow Documentation

## ⚠️ MANDATORY HOUSEHOLD ASSIGNMENT AT SIGNUP

**IMPORTANT:** Every new user MUST be assigned to a household during signup. There is NO option to create a standalone account without a household.

## Signup Flow Requirements

### 1. User Information Collection
- First Name (required)
- Last Name (required)
- Username (required, 3-20 chars, alphanumeric + underscore only)
- Email (required)
- Date of Birth (required, must be 18+)
- Password (required, min 6 chars)
- Password Confirmation (required, must match)

### 2. MANDATORY Household Choice
Every user MUST choose one of the following options during signup:

#### Option A: Create New Household
- User provides a household name (required, max 50 chars)
- User becomes the OWNER of the new household
- Household starts with 'trialing' status
- Plan type set to 'premium_household'

#### Option B: Join Existing Household
- User provides a 6-character invitation code (required)
- Code format: Alphanumeric, uppercase (e.g., ABC123, V7EAPP)
- Code must be valid and not expired (48-hour expiration)
- User joins with the role specified in the invitation (viewer/member/admin)

### 3. Account Creation Process
1. Validate all user information
2. Validate household choice is made
3. Create user account in Supabase Auth
4. Execute household action:
   - If creating: Call `createHousehold(householdName)`
   - If joining: Call `joinHouseholdWithCode(inviteCode)`
5. Show success message with username confirmation

## Implementation Details

### Files Involved
- `/src/components/Auth/AuthForm.tsx` - Main signup form with household choice
- `/src/lib/auth-utils.ts` - Household creation and joining functions
- Database functions:
  - `create_invitation` - Generates 6-char codes
  - `redeem_invitation` - Processes invitation codes
  - `generate_invitation_code` - Creates unique codes

### Database Schema
- `households` table - Stores household information
- `household_members` table - Links users to households with roles
- `invitation_codes` table - Stores invitation codes with expiration

### Validation Rules
1. **No signup without household choice** - Form will not submit
2. **Household name required if creating** - Must be non-empty
3. **Valid invitation code if joining** - Exactly 6 characters
4. **Age verification** - Must be 18+ years old
5. **Username uniqueness** - Checked before account creation

## Why This Matters

### Problems This Solves
- **No orphaned accounts** - Every user belongs to a household from day 1
- **No account merging needed** - Eliminates the complexity of merging standalone accounts later
- **Clear ownership** - Household creators are automatically owners
- **Controlled access** - Users can only join via valid invitation codes

### Security Considerations
- Invitation codes expire after 48 hours
- Codes are one-time use only
- Only household owners/admins can create invitations
- Role-based permissions from the start

## Error Handling

### Common Error Messages
- "Please choose to either create a household or join with an invitation code"
- "Please enter a household name"
- "Please enter a valid 6-character invitation code"
- "Invalid or expired invitation code"
- "You are already a member of this household"
- "Username already taken"

## Testing Checklist

- [ ] Cannot submit signup form without choosing household option
- [ ] Cannot create household without name
- [ ] Cannot join without valid 6-char code
- [ ] Invitation codes work correctly
- [ ] Expired codes are rejected
- [ ] Users are properly assigned to households
- [ ] Household creators become owners
- [ ] Joiners get correct role from invitation

## Future Considerations

### DO NOT CHANGE
- The mandatory household choice at signup
- The 6-character invitation code format
- The 48-hour expiration period
- The requirement that every user must have a household

### Safe to Modify
- UI/UX styling and layout
- Error message wording
- Additional user profile fields
- Invitation email notifications

---

**Last Updated:** 2025-09-24
**Critical Rule:** NEVER allow signup without household assignment. This is the foundation of the entire multi-user system.