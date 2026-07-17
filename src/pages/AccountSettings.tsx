// src/pages/AccountSettings.tsx
import { useState, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { User, Lock, Save, Loader2, Shield } from 'lucide-react';

export default function AccountSettings() {
  const { user, isDarkMode } = useApp();
  
  // ✅ FIX: All hooks MUST be declared unconditionally at the top
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Initialize with optional chaining to prevent crash if user is null during first render
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ✅ FIX: Safe conditional rendering AFTER hooks are initialized
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Access Denied</h3>
          <p className="text-sm text-red-600 dark:text-red-300 mt-2">Please sign in to access account settings.</p>
        </div>
      </div>
    );
  }

  // ✅ FIX: Create a local constant to assert user is non-null for the rest of the scope
  // This satisfies TypeScript's strict null checks without using 'any' or '!'
  const currentUser = user;

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;
      
      // ✅ FIX: Use currentUser.id which is guaranteed to be non-null
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', currentUser.id);
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password changed! Please log in again.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  const cardClass = `rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`;
  const labelClass = `block text-xs font-semibold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
          <Shield size={24} />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Account Settings</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your profile, security, and preferences.</p>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Information Card */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
            <User size={20} />
          </div>
          <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Profile Information</h2>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label className={labelClass}>Email Address</label>
            {/* ✅ FIX: Use currentUser.email */}
            <input disabled value={currentUser.email || ''} className={`${inputClass} opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800`} />
            <p className="text-[11px] text-gray-400 mt-1.5">Email cannot be changed. Contact admin if needed.</p>
          </div>
          
          <div>
            <label className={labelClass}>Full Name</label>
            <input 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              className={inputClass} 
              placeholder="Enter your full name"
            />
          </div>

          <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
            Save Profile Changes
          </button>
        </form>
      </div>

      {/* Security Card */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <Lock size={20} />
          </div>
          <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Change Password</h2>
        </div>
        
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div>
            <label className={labelClass}>New Password</label>
            <input 
              type="password"
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              className={inputClass} 
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input 
              type="password"
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className={inputClass} 
              placeholder="Re-enter new password"
            />
          </div>

          <button type="submit" disabled={loading || !newPassword || !confirmPassword} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}