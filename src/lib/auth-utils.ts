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
export async function inviteToHousehold(email: string, username?: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Get user's household
  const householdInfo = await getUserHousehold();
  if (!householdInfo.household_id) {
    throw new Error('User is not part of a household');
  }

  if (householdInfo.role !== 'owner') {
    throw new Error('Only household owners can send invitations');
  }

  // Generate invite code
  const { data: inviteCode, error: codeError } = await supabase.rpc('generate_invite_code');

  if (codeError || !inviteCode) {
    throw new Error('Failed to generate invite code');
  }

  // Create invitation
  const { data, error } = await supabase
    .from('household_invitations')
    .insert({
      household_id: householdInfo.household_id,
      email: email,
      invited_username: username,
      invite_code: inviteCode,
      invited_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Join household using invite code
 */
export async function joinHouseholdWithCode(inviteCode: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Check if user already belongs to a household
  const currentHousehold = await getUserHousehold();
  if (currentHousehold.household_id) {
    throw new Error('User already belongs to a household');
  }

  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('household_invitations')
    .select(`
      *,
      households (
        id,
        household_name,
        subscription_status
      )
    `)
    .eq('invite_code', inviteCode)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (inviteError || !invitation) {
    throw new Error('Invalid or expired invitation code');
  }

  // Get user profile to verify email/username match
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error('User profile not found');

  // Verify invitation is for this user
  const emailMatch = invitation.email === profile.email;
  const usernameMatch = invitation.invited_username === profile.username;

  if (!emailMatch && !usernameMatch) {
    throw new Error('This invitation is not for your account');
  }

  // Add user to household
  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: invitation.household_id,
      user_id: user.id,
      role: 'member',
      invited_by: invitation.invited_by
    });

  if (memberError) throw memberError;

  // Mark invitation as used
  const { error: updateError } = await supabase
    .from('household_invitations')
    .update({
      used_at: new Date().toISOString(),
      used_by: user.id
    })
    .eq('id', invitation.id);

  if (updateError) throw updateError;

  return invitation.households;
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