// src/pages/SignIn.tsx
import { useState, FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* Header Section with LARGER Logo */}
        <div className="pt-0.5 pb-2 px-8 text-center">
          {/* Logo Container */}
          <div className="h-56 w-72 mx-auto mb-1 transition-transform hover:scale-105 duration-300">
            <img
              src="/logo.png"
              alt="Chloe House of Beauty"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-pink-600 dark:text-white mb-1">
            Staff Login
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Please enter your credentials to access your account.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-5">
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                placeholder="admin@chloehouse.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Sign In"
            )}
          </button>

          {/* ✅ UPDATED: Copyright Footer instead of Sign Up link */}
          <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
              &copy; 2026 Chloe House of Beauty
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}