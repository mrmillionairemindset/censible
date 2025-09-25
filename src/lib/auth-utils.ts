import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  bio?: string | null;
  timezone?: string | null;
  language?: string | null;
  phone?: string | null;
}

export interface HouseholdInfo {
  household_id: string | null;
  household_name: string | null;
  role: string | null;
  subscription_status: string | null;
  subscription_tier?: string | null;
}

/**
 * Sign up with username instead of email
 */
export async function signUpWithUsername(
  username: string,
  email: string,
  password: string,
  displayName?: string
) {
  // First check if username is available
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (existingProfile) {
    throw new Error('Username already taken');
  }

  // Create auth user with username in metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || username,
        username: username
      }
    }
  });

  if (error) throw error;

  // After signup, update the profile with the chosen username
  // This overrides the auto-generated username from the trigger
  if (data?.user) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: username,
        display_name: displayName || username
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.warn('Failed to update username, but signup succeeded:', updateError);
    }

    // Create a default household for the new user
    try {
      const householdName = `${displayName || username}'s Household`;

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          household_name: householdName,
          created_by: data.user.id,
          subscription_status: 'active', // Start with active status for individual users
          plan_type: 'individual'
        })
        .select()
        .single();

      if (householdError) {
        console.warn('Failed to create household during signup:', householdError);
      } else {
        // Add user as owner to the household_members table
        const { error: memberError } = await supabase
          .from('household_members')
          .insert({
            household_id: household.id,
            user_id: data.user.id,
            role: 'owner',
            member_type: 'adult',
            display_name: displayName || username,
            joined_at: new Date().toISOString(),
            can_edit_budget: true,
            can_add_transactions: true,
            requires_approval: false
          });

        if (memberError) {
          console.warn('Failed to add user to household during signup:', memberError);
        }
      }
    } catch (error) {
      console.warn('Failed to set up household during signup:', error);
    }
  }

  return data;
}


/**
 * Create a household for existing users who don't have one
 */
export async function createDefaultHouseholdForUser(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if user already has a household
  const householdInfo = await getUserHousehold();
  if (householdInfo.household_id) {
    // User has household but may not be in household_members table - check and add if needed
    const { data: existingMember } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdInfo.household_id)
      .eq('user_id', user.id)
      .single();

    if (!existingMember) {
      // Get user profile for display name
      const profile = await getCurrentUserProfile();
      const displayName = profile?.display_name || profile?.username || 'User';

      // Add user as owner to the household_members table
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: householdInfo.household_id,
          user_id: user.id,
          role: 'owner',
          member_type: 'adult',
          display_name: displayName,
          joined_at: new Date().toISOString(),
          can_edit_budget: true,
          can_add_transactions: true,
          requires_approval: false
        });

      if (memberError) {
        console.error('Failed to add user to household_members:', memberError);
        throw memberError;
      }
    }
    return;
  }

  // Get user profile for display name
  const profile = await getCurrentUserProfile();
  const displayName = profile?.display_name || profile?.username || 'User';

  const householdName = `${displayName}'s Household`;

  try {
    // Create household
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({
        household_name: householdName,
        created_by: user.id,
        subscription_status: 'active',
        plan_type: 'individual'
      })
      .select()
      .single();

    if (householdError) throw householdError;

    // Add user as owner to the household_members table
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: 'owner',
        member_type: 'adult',
        display_name: displayName,
        joined_at: new Date().toISOString(),
        can_edit_budget: true,
        can_add_transactions: true,
        requires_approval: false
      });

    if (memberError) throw memberError;
  } catch (error) {
    console.error('Failed to create default household:', error);
    throw error;
  }
}

/**
 * Sign in with username or email
 */
export async function signInWithUsername(usernameOrEmail: string, password: string) {
  // Check if input is an email
  const isEmail = usernameOrEmail.includes('@');

  let email: string;

  if (isEmail) {
    // If it's an email, use it directly
    email = usernameOrEmail;
  } else {
    // If it's a username, look up the email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', usernameOrEmail)
      .single();

    if (profileError || !profile) {
      throw new Error('Username not found');
    }

    email = profile.email;
  }

  // Login with email (Supabase requirement)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) throw error;

  return data;
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) return null;

  return profile;
}

/**
 * Get user's household information
 */
export async function getUserHousehold(): Promise<HouseholdInfo> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      household_id: null,
      household_name: null,
      role: null,
      subscription_status: null
    };
  }

  const { data, error } = await supabase.rpc('get_user_household', {
    user_uuid: user.id
  });

  if (error || !data || data.length === 0) {
    return {
      household_id: null,
      household_name: null,
      role: null,
      subscription_status: null
    };
  }

  const householdInfo = data[0];
  return {
    household_id: householdInfo.household_id,
    household_name: householdInfo.household_name,
    role: householdInfo.role,
    subscription_status: householdInfo.subscription_status
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<UserProfile>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Check if username is being updated and is available
  if (updates.username) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', updates.username)
      .neq('id', user.id)
      .single();

    if (existingProfile) {
      throw new Error('Username already taken');
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Check if user has premium household access
 */
export async function hasHouseholdAccess(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase.rpc('user_has_household_access', {
    user_uuid: user.id
  });

  if (error) {
    console.error('Error checking household access:', error);
    return false;
  }

  return data === true;
}

/**
 * Create a new household (premium feature)
 */
export async function createHousehold(householdName: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Check if user already has household access
  const hasAccess = await hasHouseholdAccess();
  if (hasAccess) {
    throw new Error('User already belongs to a household');
  }

  // Create household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({
      household_name: householdName,
      created_by: user.id,
      subscription_status: 'trialing', // Start with trial
      plan_type: 'premium_household'
    })
    .select()
    .single();

  if (householdError) throw householdError;

  // Add creator as owner
  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: 'owner'
    });

  if (memberError) throw memberError;

  return household;
}

/**
 * Generate and send household invitation
 */
export async function inviteToHousehold(email: string, role: string = 'viewer') {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Get user's household
  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  if (!['owner', 'admin'].includes(householdInfo.role || '')) {
    throw new Error('Only household owners and admins can send invitations');
  }

  // Create invitation using our new database function
  const { data, error } = await supabase.rpc('create_invitation', {
    p_household_id: householdInfo.household_id,
    p_invited_by: user.id,
    p_email: email,
    p_role: role
  });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Failed to create invitation');

  const invitation = data[0];
  return {
    invite_code: invitation.code,
    expires_at: invitation.expires_at
  };
}

/**
 * Join household using invite code
 */
export async function joinHouseholdWithCode(inviteCode: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Use our new redeem_invitation function
  const { data, error } = await supabase.rpc('redeem_invitation', {
    p_code: inviteCode.toUpperCase(),
    p_user_id: user.id
  });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Failed to redeem invitation');

  const result = data[0];

  if (!result.success) {
    throw new Error(result.message || 'Failed to join household');
  }

  return {
    id: result.household_id,
    household_name: result.household_name,
    role: result.role
  };
}

/**
 * Get household invitations for management
 */
export async function getHouseholdInvitations() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Get user's household
  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  if (!['owner', 'admin'].includes(householdInfo.role || '')) {
    throw new Error('Only household owners and admins can view invitations');
  }

  // Get invitations using our new database function
  const { data, error } = await supabase.rpc('get_household_invitations', {
    p_household_id: householdInfo.household_id
  });

  if (error) throw error;

  return data || [];
}

/**
 * Leave household
 */
export async function leaveHousehold() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  if (householdInfo.role === 'owner') {
    throw new Error('Household owners cannot leave. Transfer ownership first or delete the household.');
  }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('user_id', user.id)
    .eq('household_id', householdInfo.household_id);

  if (error) throw error;
}

/**
 * Search users by username (for invitations)
 */
export async function searchUsersByUsername(query: string): Promise<UserProfile[]> {
  if (query.length < 2) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, email, avatar_url, created_at')
    .ilike('username', `%${query}%`)
    .limit(10);

  if (error) throw error;

  return data || [];
}

/**
 * Get household members for the user's household
 */
export interface HouseholdMember {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  email: string;
  role: string;
  member_type: string;
  joined_at: string;
  monthly_allowance: number;
  allowance_balance: number;
  monthly_spending_limit: number | null;
  can_edit_budget: boolean;
  can_add_transactions: boolean;
  requires_approval: boolean;
  avatar_url?: string;
}

export async function getHouseholdMembers(): Promise<HouseholdMember[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('household_members')
    .select(`
      id,
      user_id,
      role,
      member_type,
      joined_at,
      monthly_allowance,
      allowance_balance,
      monthly_spending_limit,
      can_edit_budget,
      can_add_transactions,
      requires_approval,
      display_name
    `)
    .eq('household_id', householdInfo.household_id)
    .order('role', { ascending: false }) // owners first, then members
    .order('joined_at', { ascending: true });

  if (error) throw error;

  // Get profile data separately to avoid relationship issues
  const memberData = data || [];
  const userIds = memberData.map(member => member.user_id);

  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url, display_name')
      .in('id', userIds);

    if (profileError) {
      console.warn('Could not load profiles:', profileError);
    } else {
      profiles = profileData || [];
    }
  }

  return memberData.map((member: any) => {
    // Find the profile for this member from the separate profiles array
    const profile = profiles.find(p => p.id === member.user_id);
    return {
      id: member.id,
      user_id: member.user_id,
      username: profile?.username || 'unknown',
      display_name: member.display_name || profile?.display_name || profile?.username || 'Unknown User',
      email: profile?.email || '',
      role: member.role,
      member_type: member.member_type || 'adult',
      joined_at: member.joined_at,
      monthly_allowance: member.monthly_allowance || 0,
      allowance_balance: member.allowance_balance || 0,
      monthly_spending_limit: member.monthly_spending_limit,
      can_edit_budget: member.can_edit_budget || false,
      can_add_transactions: member.can_add_transactions || false,
      requires_approval: member.requires_approval || false,
      avatar_url: profile?.avatar_url
    };
  });
}

/**
 * Remove a member from the household
 */
export async function removeHouseholdMember(memberId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  if (!['owner', 'admin'].includes(householdInfo.role || '')) {
    throw new Error('Only household owners and admins can remove members');
  }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('id', memberId)
    .eq('household_id', householdInfo.household_id);

  if (error) throw error;
}

/**
 * Update household member permissions and settings
 */
export async function updateHouseholdMember(memberId: string, updates: Partial<HouseholdMember>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  if (!['owner', 'admin'].includes(householdInfo.role || '')) {
    throw new Error('Only household owners and admins can update member permissions');
  }

  // Filter updates to only include allowed fields
  const allowedUpdates = {
    ...(updates.role && { role: updates.role }),
    ...(updates.member_type && { member_type: updates.member_type }),
    ...(updates.monthly_allowance !== undefined && { monthly_allowance: updates.monthly_allowance }),
    ...(updates.allowance_balance !== undefined && { allowance_balance: updates.allowance_balance }),
    ...(updates.monthly_spending_limit !== undefined && { monthly_spending_limit: updates.monthly_spending_limit }),
    ...(updates.can_edit_budget !== undefined && { can_edit_budget: updates.can_edit_budget }),
    ...(updates.can_add_transactions !== undefined && { can_add_transactions: updates.can_add_transactions }),
    ...(updates.requires_approval !== undefined && { requires_approval: updates.requires_approval }),
    ...(updates.display_name && { display_name: updates.display_name })
  };

  if (Object.keys(allowedUpdates).length === 0) {
    throw new Error('No valid updates provided');
  }

  const { data, error } = await supabase
    .from('household_members')
    .update(allowedUpdates)
    .eq('id', memberId)
    .eq('household_id', householdInfo.household_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Bills Management Functions
 */

export interface Bill {
  id: string;
  household_id: string;
  user_id: string;
  name: string;
  description?: string;
  amount: number;
  due_date?: string;
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'yearly' | 'one-time';
  category: string;
  payment_method?: string;
  status: 'paid' | 'pending' | 'overdue';
  is_automatic: boolean;
  is_recurring: boolean;
  is_active: boolean;
  reminder_days: number;
  reminder_enabled: boolean;
  start_date?: string;
  end_date?: string;
  last_paid?: string;
  next_due?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all bills for the user's household
 */
export async function getHouseholdBills(): Promise<Bill[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('household_id', householdInfo.household_id)
    .eq('is_active', true)
    .order('due_date', { ascending: true });

  if (error) throw error;

  return data || [];
}

/**
 * Get upcoming bills (next 30 days)
 */
export async function getUpcomingBills(daysAhead: number = 30): Promise<Bill[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('household_id', householdInfo.household_id)
    .eq('is_active', true)
    .eq('status', 'pending')
    .gte('due_date', new Date().toISOString().split('T')[0])
    .lte('due_date', new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (error) throw error;

  return data || [];
}

/**
 * Get recurring expenses (subscriptions)
 */
export async function getRecurringExpenses(): Promise<Bill[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('household_id', householdInfo.household_id)
    .eq('is_recurring', true)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;

  return data || [];
}

/**
 * Create a new bill
 */
export async function createBill(bill: Omit<Bill, 'id' | 'household_id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  // Filter out empty string UUID fields to avoid 22P02 errors
  const cleanBill = { ...bill };
  if (cleanBill.assigned_to === '') {
    delete cleanBill.assigned_to;
  }

  // Calculate next_due if not provided (required field)
  if (!cleanBill.next_due && cleanBill.due_date) {
    cleanBill.next_due = cleanBill.due_date; // For first occurrence, next_due equals due_date
  }

  const { data, error } = await supabase
    .from('bills')
    .insert({
      ...cleanBill,
      household_id: householdInfo.household_id,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update a bill
 */
export async function updateBill(billId: string, updates: Partial<Bill>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', billId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Mark a bill as paid
 */
export async function markBillPaid(billId: string, paymentDate?: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bills')
    .update({
      status: 'paid',
      last_paid: paymentDate || new Date().toISOString().split('T')[0]
    })
    .eq('id', billId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Delete a bill
 */
export async function deleteBill(billId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('bills')
    .update({ is_active: false })
    .eq('id', billId);

  if (error) throw error;
}

/**
 * Savings Goals Management Functions
 */

export interface SavingsGoal {
  id: string;
  household_id: string;
  created_by: string;
  name: string;
  type: 'emergency' | 'vacation' | 'purchase' | 'education' | 'retirement' | 'other';
  target_amount: number;
  current_amount: number;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  auto_contribute: number;
  contributors: string[];
  notes?: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all savings goals for the user's household
 */
export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('household_id', householdInfo.household_id)
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Get savings goals by priority
 */
export async function getSavingsGoalsByPriority(priority?: 'high' | 'medium' | 'low'): Promise<SavingsGoal[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_priority_savings_goals', {
    p_household_id: householdInfo.household_id,
    p_priority: priority || null
  });

  if (error) throw error;

  return data?.map((goal: any) => ({
    id: goal.id,
    household_id: householdInfo.household_id,
    created_by: '',
    name: goal.name,
    type: goal.type,
    target_amount: goal.target_amount,
    current_amount: goal.current_amount,
    deadline: goal.deadline,
    priority: goal.priority,
    auto_contribute: 0,
    contributors: [],
    icon: '💰',
    is_active: true,
    created_at: '',
    updated_at: ''
  })) || [];
}

/**
 * Create a new savings goal
 */
export async function createSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'household_id' | 'created_by' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      ...goal,
      user_id: user.id,
      household_id: householdInfo.household_id,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update a savings goal
 */
export async function updateSavingsGoal(goalId: string, updates: Partial<SavingsGoal>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('savings_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Add contribution to a savings goal
 */
export async function addSavingsContribution(goalId: string, amount: number, contributorName?: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('add_savings_contribution', {
    p_goal_id: goalId,
    p_amount: amount,
    p_contributor_name: contributorName || null
  });

  if (error) throw error;

  // Return updated goal
  const { data, error: getError } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (getError) throw getError;

  return data;
}

/**
 * Delete a savings goal
 */
export async function deleteSavingsGoal(goalId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('savings_goals')
    .update({ is_active: false })
    .eq('id', goalId);

  if (error) throw error;
}

/**
 * Reports and Analytics Functions
 */

export interface SpendingByMember {
  member: string;
  amount: number;
  percentage: number;
  transactions: number;
  color: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  budgeted: number;
  variance: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

/**
 * Get spending breakdown by household members
 */
export async function getSpendingByMember(period: string = 'month'): Promise<SpendingByMember[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get transactions first
  const { data: transactionsData, error } = await supabase
    .from('transactions')
    .select('amount, created_by')
    .eq('household_id', householdInfo.household_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', now.toISOString());

  if (error) throw error;

  // Get profiles for the members who created these transactions
  const memberIds = [...new Set(transactionsData?.map(t => t.created_by).filter(Boolean))];
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', memberIds);

  // Create a map of member profiles
  const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

  // Group by member and calculate totals
  const memberTotals: { [key: string]: { amount: number; transactions: number; name: string } } = {};
  let totalAmount = 0;

  transactionsData?.forEach((transaction: any) => {
    const memberId = transaction.created_by;
    const profile = profilesMap.get(memberId);
    const memberName = profile?.display_name || profile?.username || 'Unknown';
    const amount = Math.abs(transaction.amount); // Use absolute value for spending

    if (!memberTotals[memberId]) {
      memberTotals[memberId] = { amount: 0, transactions: 0, name: memberName };
    }

    memberTotals[memberId].amount += amount;
    memberTotals[memberId].transactions += 1;
    totalAmount += amount;
  });

  // Convert to array with percentages and colors
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-yellow-500', 'bg-pink-500'];

  return Object.keys(memberTotals).map((memberId, index) => {
    const member = memberTotals[memberId];
    return {
      member: member.name,
      amount: member.amount,
      percentage: totalAmount > 0 ? (member.amount / totalAmount) * 100 : 0,
      transactions: member.transactions,
      color: colors[index % colors.length]
    };
  }).sort((a, b) => b.amount - a.amount);
}

/**
 * Get category spending breakdown with budget comparison
 */
export async function getCategoryBreakdown(period: string = 'month'): Promise<CategoryBreakdown[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  // Calculate date range
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get spending by category
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('amount, category')
    .eq('household_id', householdInfo.household_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', now.toISOString());

  if (transError) throw transError;

  // Get budget data for comparison
  const { data: budgets, error: budgetError } = await supabase
    .from('budget_categories')
    .select('category, allocated')
    .eq('household_id', householdInfo.household_id);

  if (budgetError) throw budgetError;

  // Group spending by category
  const categoryTotals: { [key: string]: number } = {};
  let totalSpent = 0;

  transactions?.forEach((transaction: any) => {
    const category = transaction.category || 'Other';
    const amount = Math.abs(transaction.amount);

    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    totalSpent += amount;
  });

  // Create budget lookup
  const budgetLookup: { [key: string]: number } = {};
  budgets?.forEach((budget: any) => {
    budgetLookup[budget.category] = budget.allocated || 0;
  });

  // Convert to array with budget comparison
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-yellow-500', 'bg-pink-500', 'bg-red-500', 'bg-gray-500'];

  return Object.keys(categoryTotals).map((category, index) => {
    const spent = categoryTotals[category];
    const budgeted = budgetLookup[category] || 0;
    const variance = spent - budgeted;

    return {
      category,
      amount: spent,
      percentage: totalSpent > 0 ? (spent / totalSpent) * 100 : 0,
      budgeted,
      variance,
      color: colors[index % colors.length]
    };
  }).sort((a, b) => b.amount - a.amount);
}

/**
 * Get monthly trends data
 */
export async function getMonthlyTrends(monthsBack: number = 9): Promise<MonthlyTrend[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

  // Get expenses (transactions)
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('household_id', householdInfo.household_id)
    .gte('created_at', startDate.toISOString());

  if (transError) throw transError;

  // Get income data
  const { data: incomes, error: incomeError } = await supabase
    .from('income_sources')
    .select('amount, frequency')
    .eq('household_id', householdInfo.household_id)
    .eq('is_active', true);

  if (incomeError) throw incomeError;

  // Calculate monthly income (assuming consistent income)
  let monthlyIncome = 0;
  incomes?.forEach((income: any) => {
    switch (income.frequency) {
      case 'weekly':
        monthlyIncome += (income.amount * 52) / 12;
        break;
      case 'bi-weekly':
        monthlyIncome += (income.amount * 26) / 12;
        break;
      case 'monthly':
        monthlyIncome += income.amount;
        break;
      case 'yearly':
        monthlyIncome += income.amount / 12;
        break;
      default:
        monthlyIncome += income.amount; // Default to monthly
    }
  });

  // Group transactions by month
  const monthlyData: { [key: string]: { expenses: number, month: string, year: number } } = {};

  transactions?.forEach((transaction: any) => {
    const date = new Date(transaction.created_at);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { expenses: 0, month: monthName, year: date.getFullYear() };
    }

    monthlyData[monthYear].expenses += Math.abs(transaction.amount);
  });

  // Convert to array and calculate savings
  return Object.keys(monthlyData)
    .sort()
    .slice(-monthsBack)
    .map(key => {
      const data = monthlyData[key];
      return {
        month: data.month,
        income: monthlyIncome,
        expenses: data.expenses,
        savings: monthlyIncome - data.expenses
      };
    });
}

/**
 * Get report summary statistics
 */
export async function getReportSummary(period: string = 'month') {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return {
      totalSpent: 0,
      averageDailySpend: 0,
      savingsRate: 0,
      familyMembers: 0
    };
  }

  // Get member count
  const { data: members } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdInfo.household_id);

  // Get spending data
  const spendingData = await getSpendingByMember(period);
  const totalSpent = spendingData.reduce((sum, member) => sum + member.amount, 0);

  // Get income for savings rate calculation
  const { data: incomes } = await supabase
    .from('income_sources')
    .select('amount, frequency')
    .eq('household_id', householdInfo.household_id)
    .eq('is_active', true);

  let monthlyIncome = 0;
  incomes?.forEach((income: any) => {
    switch (income.frequency) {
      case 'weekly':
        monthlyIncome += (income.amount * 52) / 12;
        break;
      case 'bi-weekly':
        monthlyIncome += (income.amount * 26) / 12;
        break;
      case 'monthly':
        monthlyIncome += income.amount;
        break;
      case 'yearly':
        monthlyIncome += income.amount / 12;
        break;
      default:
        monthlyIncome += income.amount;
    }
  });

  const daysInPeriod = period === 'week' ? 7 : period === 'year' ? 365 : 30;
  const averageDailySpend = totalSpent / daysInPeriod;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalSpent) / monthlyIncome) * 100 : 0;

  return {
    totalSpent,
    averageDailySpend,
    savingsRate,
    familyMembers: members?.length || 0
  };
}

// =============================================
// TRANSACTION MANAGEMENT
// =============================================

export interface Transaction {
  id: string;
  household_id: string;
  user_id: string;
  member_id?: string;
  period_id?: string;
  category: string;
  amount: number;
  description?: string;
  merchant?: string;
  location?: string;
  transaction_date: string;
  expense_type: 'shared' | 'personal' | 'allowance';
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  payment_method?: string;
  receipt_url?: string;
  created_by: string;
  created_at: string;
  modified_by?: string;
  modified_at?: string;
}

/**
 * Get all transactions for the current household
 */
export async function getTransactions(): Promise<Transaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    return [];
  }

  // Get transactions first without nested relationships to avoid PGRST200 error
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('household_id', householdInfo.household_id)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (transactionsError) throw transactionsError;

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique user IDs from transactions
  const userIds = Array.from(new Set([
    ...transactions.map(t => t.created_by).filter(Boolean),
    ...transactions.map(t => t.member_id).filter(Boolean)
  ]));

  // Get profile information for all referenced users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, username')
    .in('id', userIds);

  if (profilesError) {
    console.warn('Could not fetch profile information:', profilesError);
    // Return transactions without profile info if profiles can't be fetched
    return transactions;
  }

  // Create a profiles lookup map
  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Enhance transactions with profile information
  const enhancedTransactions = transactions.map(transaction => ({
    ...transaction,
    created_by_profile: transaction.created_by ? profilesMap.get(transaction.created_by) : null,
    member_profile: transaction.member_id ? profilesMap.get(transaction.member_id) : null
  }));

  return enhancedTransactions;
}

/**
 * Add a new transaction
 */
export async function addTransaction(transaction: {
  member_id: string;
  category: string;
  amount: number;
  description: string;
  merchant?: string;
  location?: string;
  expense_type: 'shared' | 'personal' | 'allowance';
  payment_method?: string;
  receipt_url?: string;
}): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('No household found');
  }

  // Get current budget period
  const { data: currentPeriod } = await supabase
    .from('budget_periods')
    .select('id')
    .eq('household_id', householdInfo.household_id)
    .gte('end_date', new Date().toISOString().split('T')[0])
    .lte('start_date', new Date().toISOString().split('T')[0])
    .single();

  // Create base transaction object
  const newTransaction: any = {
    household_id: householdInfo.household_id,
    user_id: user.id,
    member_id: transaction.member_id,
    period_id: currentPeriod?.id || null,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description,
    transaction_date: new Date().toISOString().split('T')[0],
    expense_type: transaction.expense_type,
    approval_status: transaction.expense_type === 'allowance' ? 'pending' : 'approved',
    created_by: user.id
  };

  // Add optional fields if they have meaningful values
  if (transaction.merchant && transaction.merchant.trim()) {
    newTransaction.merchant = transaction.merchant.trim();
  }
  if (transaction.location && transaction.location.trim()) {
    newTransaction.location = transaction.location.trim();
  }
  if (transaction.payment_method && transaction.payment_method.trim()) {
    newTransaction.payment_method = transaction.payment_method.trim();
  }
  if (transaction.receipt_url && transaction.receipt_url.trim()) {
    newTransaction.receipt_url = transaction.receipt_url.trim();
  }


  const { data, error } = await supabase
    .from('transactions')
    .insert([newTransaction])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update transaction approval status
 */
export async function updateTransactionApproval(
  transactionId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updates: any = {
    approval_status: status,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
    modified_by: user.id,
    modified_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId);

  if (error) throw error;
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) throw error;
}
 

