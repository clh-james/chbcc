import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ✅ UPDATED: Complete list of roles matching AppContext permissions
const STAFF_ROLES = [
  'Senior Stylist',
  'Stylist',
  'Senior Nail Technician',
  'Nail Technician',
  'Massage Therapist',
  'Esthetician',
  'Receptionist',
  'Manager',
  'Cashier'
];

export default function CreateStaffModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'Stylist' // Default to Stylist
  });

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call our secure Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: form
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error('Failed to create user');

      onSuccess();
      onClose();
      setForm({ email: '', password: '', fullName: '', role: 'Stylist' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-800">
          <h3 className="font-bold text-lg dark:text-white">Create Staff Account</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X size={20} className="dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full Name</label>
            <input 
              required
              value={form.fullName}
              onChange={e => setForm({...form, fullName: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="e.g. Maria Santos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
            <input 
              type="email"
              required
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="maria@chloehouse.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Temporary Password</label>
            <input 
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Min 8 characters"
            />
          </div>

          {/* ✅ UPDATED: Dynamic Role Selector */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Role</label>
            <select 
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              {STAFF_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}