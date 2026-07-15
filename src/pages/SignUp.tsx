// src/pages/SignUp.tsx
import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

interface SignUpProps {
  onSignInClick: () => void;
}

export default function SignUp({ onSignInClick }: SignUpProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (signUpError) throw signUpError;
      
      setMessage('Account created successfully! Please check your email to verify your account.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
    } catch (err: unknown) {
      // ✅ FIX: Replaced 'any' with 'unknown' and proper type guard
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
        <button 
          onClick={onSignInClick}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-600 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Join Chloe House of Beauty today</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl border border-green-200 dark:border-green-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-300">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <button onClick={onSignInClick} className="text-rose-600 hover:underline font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}