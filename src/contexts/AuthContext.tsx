import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { migrateLocalDataToSupabase } from '../utils/dataMigration';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
        setError('Failed to initialize authentication');
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

  const signUp = async (email: string, password: string): Promise<boolean> => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('Signup error:', error);

          // Handle specific Supabase errors with user-friendly messages
          let friendlyMessage = error.message;
          if (error.message.includes('User already registered')) {
            friendlyMessage = 'An account with this email already exists';
          } else if (error.message.includes('Password should be at least')) {
            friendlyMessage = 'Password must be at least 6 characters';
          } else if (error.message.includes('Invalid email')) {
            friendlyMessage = 'Please enter a valid email address';
          } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
            friendlyMessage = 'Too many attempts. Please wait a moment and try again';
          }

          setError(friendlyMessage);
          return false;
        }

        if (data.user && !data.session) {
          // User created but needs to confirm email
          return true;
        }

        return true;
      } catch (err) {
        console.error('Network error during signup:', err);
        retryCount++;

        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          continue;
        }

        const errorMessage = 'Connection error. Please check your internet and try again.';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    }

    return false;
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Signin error:', error);

          // Handle specific Supabase errors with user-friendly messages
          let friendlyMessage = error.message;
          if (error.message.includes('Invalid login credentials')) {
            friendlyMessage = 'Invalid email or password';
          } else if (error.message.includes('Email not confirmed')) {
            friendlyMessage = 'Please check your email and confirm your account';
          } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
            friendlyMessage = 'Too many attempts. Please wait a moment and try again';
          } else if (error.message.includes('User not found')) {
            friendlyMessage = 'No account found with this email';
          }

          setError(friendlyMessage);
          return false;
        }

        // Success is handled by the auth state change listener
        return true;
      } catch (err) {
        console.error('Network error during signin:', err);
        retryCount++;

        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          continue;
        }

        const errorMessage = 'Connection error. Please check your internet and try again.';
        setError(errorMessage);
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

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;