import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface HouseholdInfo {
  household_id: string | null;
  household_name: string | null;
  role: string | null;
  subscription_status: string | null;
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
  }

  return data;
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
      display_name,
      profiles:user_id (
        username,
        email,
        avatar_url
      )
    `)
    .eq('household_id', householdInfo.household_id)
    .order('role', { ascending: false }) // owners first, then members
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return data?.map((member: any) => ({
    id: member.id,
    user_id: member.user_id,
    username: member.profiles?.username || 'unknown',
    display_name: member.display_name || member.profiles?.username || 'Unknown User',
    email: member.profiles?.email || '',
    role: member.role,
    member_type: member.member_type || 'adult',
    joined_at: member.joined_at,
    monthly_allowance: member.monthly_allowance || 0,
    allowance_balance: member.allowance_balance || 0,
    monthly_spending_limit: member.monthly_spending_limit,
    can_edit_budget: member.can_edit_budget || false,
    can_add_transactions: member.can_add_transactions || false,
    requires_approval: member.requires_approval || false,
    avatar_url: member.profiles?.avatar_url
  })) || [];
}

/**
 * Bills Management Functions
 */

export interface Bill {
  id: string;
  household_id: string;
  created_by: string;
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
export async function createBill(bill: Omit<Bill, 'id' | 'household_id' | 'created_by' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  const { data, error } = await supabase
    .from('bills')
    .insert({
      ...bill,
      household_id: householdInfo.household_id,
      created_by: user.id
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