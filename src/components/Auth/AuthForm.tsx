import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [signupSuccess, setSignupSuccess] = useState<{ username: string; email: string } | null>(null);

  const { signIn, signUp } = useAuth();

  // Clean username input (remove spaces, special chars except underscore)
  const cleanUsername = (input: string): string => {
    return input.toLowerCase().replace(/[^a-z0-9_]/g, '');
  };

  // Check if user is at least 18 years old
  const isAtLeast18 = (birthDateStr: string): boolean => {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Check age requirement
        if (!isAtLeast18(birthDate)) {
          setError('You must be at least 18 years old to create an account');
          setIsLoading(false);
          return;
        }

        // Check password confirmation
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        // Use user-chosen username
        const cleanedUsername = cleanUsername(username);
        if (!cleanedUsername) {
          setError('Please enter a valid username');
          setIsLoading(false);
          return;
        }

        const displayName = `${firstName} ${lastName}`;

        try {
          await signUp(cleanedUsername, email, password, displayName);
          setSignupSuccess({ username: cleanedUsername, email });
        } catch (err: any) {
          if (err.message?.includes('Username already taken')) {
            setError('Username already taken. Please choose a different username.');
          } else {
            throw err;
          }
        }
      } else {
        // For sign-in, accept either username or email
        await signIn(usernameOrEmail, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message if signup was successful
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 to-blue-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h2>
            <div className="bg-mint-50 border border-mint-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Your username is:</p>
              <p className="text-xl font-bold text-mint-700">@{signupSuccess.username}</p>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p>✅ We've sent a confirmation email to <strong>{signupSuccess.email}</strong></p>
              <p>📧 You can sign in with your email or username</p>
              <p>🔒 Your password is secure and encrypted</p>
            </div>
            <button
              onClick={() => {
                setSignupSuccess(null);
                setIsSignUp(false);
                setUsernameOrEmail(signupSuccess.email); // Pre-fill with email for easier sign-in
                setPassword('');
              }}
              className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-mint-600 hover:bg-mint-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint-500"
            >
              Continue to Sign In
            </button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> You can sign in using either your email (<strong>{signupSuccess.email}</strong>) or your username (<strong>@{signupSuccess.username}</strong>).
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 to-blue-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Centsible</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <motion.form
          className="bg-white rounded-xl shadow-lg p-8 space-y-6"
          onSubmit={handleSubmit}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {!isSignUp ? (
            <div>
              <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Username
              </label>
              <input
                id="usernameOrEmail"
                name="usernameOrEmail"
                type="text"
                autoComplete="username email"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                placeholder="Enter your email or username"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can use your email address or username to sign in
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">@</span>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(cleanUsername(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    placeholder="Choose your username"
                    minLength={3}
                    maxLength={20}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>
            </>
          )}

          {isSignUp && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You must be at least 18 years old to create an account
                </p>
              </div>
            </>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
              placeholder="Enter your password"
              minLength={6}
            />
            {isSignUp && (
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                placeholder="Confirm your password"
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">
                Please confirm your password
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-mint-600 hover:bg-mint-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </div>
            ) : (
              isSignUp ? 'Create account' : 'Sign in'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setEmail('');
                setFirstName('');
                setLastName('');
                setBirthDate('');
                setUsername('');
                setUsernameOrEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-sm text-mint-600 hover:text-mint-700 font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </motion.form>

        {isSignUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🎉 Welcome to Centsible!
            </h3>
            <p className="text-sm text-gray-600">
              Start your journey to better financial management with automatic monthly budget tracking,
              category insights, and spending analytics.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthForm;