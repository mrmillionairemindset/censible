import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { migrateLocalDataToSupabase } from '../utils/dataMigration';
import toast from 'react-hot-toast';
import {
  signUpWithUsername,
  signInWithUsername,
  getCurrentUserProfile,
  getUserHousehold,
  updateUserProfile,
  UserProfile,
  HouseholdInfo
} from '../lib/auth-utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  household: HouseholdInfo | null;
  loading: boolean;
  error: string | null;
  signUp: (username: string, email: string, password: string, displayName?: string) => Promise<boolean>;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  refreshHousehold: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [household, setHousehold] = useState<HouseholdInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Refresh user profile
  const refreshProfile = async () => {
    try {
      console.log('🔍 AuthContext: Refreshing user profile...');
      const userProfile = await getCurrentUserProfile();
      console.log('🔍 AuthContext: Profile loaded:', userProfile);
      setProfile(userProfile);
    } catch (err) {
      console.error('❌ AuthContext: Error refreshing profile:', err);
    }
  };

  // Refresh household info
  const refreshHousehold = async () => {
    try {
      const householdInfo = await getUserHousehold();
      setHousehold(householdInfo);
    } catch (err) {
      console.error('Error refreshing household:', err);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      await updateUserProfile(updates);
      // Refresh profile to get updated data
      await refreshProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Load profile and household data when user changes
  useEffect(() => {
    if (user) {
      refreshProfile();
      refreshHousehold();
    } else {
      setProfile(null);
      setHousehold(null);
    }
  }, [user]);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthContext: Initializing authentication...');

        // Clear any stale sessions that might exist
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('🔍 AuthContext: Session check result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          error: error?.message,
          userId: session?.user?.id
        });

        if (error) {
          console.error('Error getting session:', error);
          // Clear stale auth data on error
          await supabase.auth.signOut();
          setError(null); // Don't show error, just reset
        } else if (session?.user) {
          // Check if this is a legacy user without profile
          try {
            const profile = await getCurrentUserProfile();
            console.log('🔍 AuthContext: Profile check:', profile);
            setSession(session);
            setUser(session.user);
          } catch (profileError) {
            console.log('🔍 AuthContext: No profile found for user, signing out...');
            // This is likely a legacy user, sign them out to force re-registration
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
        // Clear everything on unexpected error
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setError(null);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            setError(null);
            // Only show success message for actual sign-ins, not session restoration
            if (!isInitialLoad) {
              toast.success('Successfully signed in!');
            }
            // Trigger data migration after successful sign in
            if (session?.user) {
              migrateLocalDataToSupabase(session.user.id).catch((error) => {
                console.error('Migration error:', error);
              });
            }
            break;
          case 'SIGNED_OUT':
            setError(null);
            toast.success('Successfully signed out!');
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            break;
          case 'USER_UPDATED':
            console.log('User updated');
            break;
          default:
            // Handle other auth events
            console.log('Unhandled auth event:', event);
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isInitialLoad]);

  const signUp = async (username: string, email: string, password: string, displayName?: string): Promise<boolean> => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        setLoading(true);
        setError(null);

        await signUpWithUsername(username, email, password, displayName);
        return true;
      } catch (err: any) {
        console.error('Signup error:', err);
        retryCount++;

        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          // eslint-disable-next-line no-loop-func
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          continue;
        }

        // Handle specific errors
        let friendlyMessage = err.message || 'Signup failed';
        if (err.message?.includes('Username already taken')) {
          friendlyMessage = 'Username already taken';
        } else if (err.message?.includes('User already registered')) {
          friendlyMessage = 'An account with this email already exists';
        } else if (err.message?.includes('Password should be at least')) {
          friendlyMessage = 'Password must be at least 6 characters';
        } else if (err.message?.includes('Invalid email')) {
          friendlyMessage = 'Please enter a valid email address';
        } else if (err.message?.includes('rate limit') || err.message?.includes('too many')) {
          friendlyMessage = 'Too many attempts. Please wait a moment and try again';
        }

        setError(friendlyMessage);
        return false;
      } finally {
        setLoading(false);
      }
    }

    return false;
  };

  const signIn = async (username: string, password: string): Promise<boolean> => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        setLoading(true);
        setError(null);

        await signInWithUsername(username, password);
        return true;
      } catch (err: any) {
        console.error('Signin error:', err);
        retryCount++;

        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          // eslint-disable-next-line no-loop-func
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          continue;
        }

        // Handle specific errors
        let friendlyMessage = err.message || 'Sign in failed';
        if (err.message?.includes('Username not found')) {
          friendlyMessage = 'Username not found';
        } else if (err.message?.includes('Invalid login credentials')) {
          friendlyMessage = 'Invalid username or password';
        } else if (err.message?.includes('Email not confirmed')) {
          friendlyMessage = 'Please check your email and confirm your account';
        } else if (err.message?.includes('rate limit') || err.message?.includes('too many')) {
          friendlyMessage = 'Too many attempts. Please wait a moment and try again';
        }

        setError(friendlyMessage);
        return false;
      } finally {
        setLoading(false);
      }
    }

    return false;
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Signout error:', error);
        setError('Failed to sign out. Please try again.');
        return;
      }

      // Success is handled by the auth state change listener
    } catch (err) {
      console.error('Network error during signout:', err);
      const errorMessage = 'Failed to sign out. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Debug function to clear all auth data
  const clearAllAuthData = async () => {
    console.log('🧹 Clearing all authentication data...');
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setHousehold(null);
      setError(null);
      setLoading(false);
      localStorage.clear();
      console.log('✅ All auth data cleared');
    } catch (err) {
      console.error('Error clearing auth data:', err);
    }
  };

  // Make debug function available globally
  useEffect(() => {
    (window as any).clearAuthData = clearAllAuthData;
    return () => {
      delete (window as any).clearAuthData;
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    household,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
    refreshProfile,
    refreshHousehold,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;