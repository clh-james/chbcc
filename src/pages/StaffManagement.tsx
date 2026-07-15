// src/pages/StaffManagement.tsx
import { useCallback, useEffect, useState, FormEvent, MouseEvent } from 'react';
import { UserCog, Plus, Search, X, Check, Edit2, Trash2, Phone, Mail, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

type Staff = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  specializations: string[];
  hourly_rate: number;
  commission_rate: number;
  hire_date: string;
  is_active: boolean;
  branch_id?: string;
};

const EMPTY: Partial<Staff> = {
  full_name: '', email: '', phone: '', role: 'Stylist',
  specializations: [], hourly_rate: 15, commission_rate: 10,
  hire_date: new Date().toISOString().split('T')[0], is_active: true,
};

const ROLES = ['Senior Stylist', 'Stylist', 'Senior Nail Technician', 'Nail Technician', 'Massage Therapist', 'Esthetician', 'Receptionist', 'Cashier', 'Manager'];

// --- Create Staff Login Modal Component ---
function CreateLoginModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'Stylist'
  });

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: form.role
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error('Failed to create user account');

      onSuccess();
      onClose();
      setForm({ email: '', password: '', fullName: '', role: 'Stylist' });
    } catch (err: unknown) {
      // ✅ FIX: Replaced 'any' with 'unknown' and proper type guard
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white border-gray-200 text-gray-900";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Create Staff Login</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600">Full Name *</label>
            <input
              required
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className={inputClass}
              placeholder="e.g. Maria Santos"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="maria@chloehouse.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600">Staff Role *</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className={inputClass}
            >
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-gray-600">Temporary Password *</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="Min 8 characters"
            />
            <p className="text-[10px] text-gray-400 mt-1">Staff can change this after first login</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
            {loading ? 'Creating Account...' : 'Create Login Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main Staff Management Component ---
export default function StaffManagement() {
  const { isDarkMode: isDark, selectedBranchId } = useApp();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Staff | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Staff>>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [specInput, setSpecInput] = useState('');

  // ✅ FIXED: Load all active staff and filter client-side to prevent UUID mismatches
  const load = useCallback(async () => {
    setLoading(true);

    // Fetch ALL active staff without strict branch_id filter first
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('Error loading staff:', error);
      setStaff([]);
    } else {
      // Filter safely on client side
      const filteredData = data?.filter(s => {
        // If no branch selected, show everyone
        if (!selectedBranchId) return true;

        // Match exact ID OR partial match (handles UUID formatting issues)
        return s.branch_id === selectedBranchId ||
          s.branch_id?.toString().startsWith(selectedBranchId.substring(0, 8));
      }) || [];

      setStaff(filteredData);
    }

    setLoading(false);
  }, [selectedBranchId]);

  useEffect(() => {
    load();
  }, [load]);

  // ✅ FIXED: Robust save function with validation, error handling, AND profiles sync
  async function save() {
    if (!form.full_name?.trim()) {
      alert("Full name is required.");
      return;
    }

    // ✅ CRITICAL: Validate branch_id before attempting insert
    if (!selectedBranchId) {
      alert("Error: No branch selected. Please refresh the page and try again.");
      return;
    }

    setSaving(true);
    
    const payload = {
      branch_id: selectedBranchId,
      full_name: form.full_name.trim(),
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      role: form.role || 'Stylist',
      specializations: form.specializations || [],
      hourly_rate: Number(form.hourly_rate) || 0,
      commission_rate: Number(form.commission_rate) || 0,
      hire_date: form.hire_date,
      is_active: true,
    };

    try {
      let error;
      
      if (editing) {
        // The database trigger 'trigger_sync_staff_to_profiles' 
        // will automatically update the profiles table when this runs
        const res = await supabase.from('staff').update(payload).eq('id', editing);
        error = res.error;
      } else {
        const res = await supabase.from('staff').insert(payload);
        error = res.error;
      }

      if (error) {
        console.error("Database error:", error);
        // Show specific RLS or constraint errors to user
        alert(`Failed to save staff: ${error.message}`);
        return; // Stop execution, keep modal open
      }

      // Success: Close modal and refresh list
      setShowModal(false);
      setEditing(null);
      setForm({ ...EMPTY });
      await load();
      
    } catch (err: unknown) {
      // ✅ FIX: Replaced 'any' with 'unknown' and proper type guard
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error("Unexpected error:", errorMessage);
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  // ✅ FIXED: Deactivate now updates DATABASE first, then local state
  async function deactivate(id: string) {
    if (!confirm('Remove this staff member?')) return;

    try {
      // 1. Update database FIRST
      const { error } = await supabase
        .from('staff')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Failed to deactivate staff:', error);
        alert('Failed to remove staff member. Please try again.');
        return;
      }

      // 2. Update local state AFTER successful DB update
      setStaff(prev => prev.filter(s => s.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err: unknown) {
      // ✅ FIX: Replaced 'any' with 'unknown' and proper type guard
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate staff.';
      console.error(errorMessage);
      alert(errorMessage);
    }
  }

  function openEdit(s: Staff) {
    setForm({ ...s, specializations: s.specializations || [] });
    setEditing(s.id);
    setShowModal(true);
  }

  function addSpec() {
    if (!specInput.trim()) return;
    setForm(f => ({ ...f, specializations: [...(f.specializations || []), specInput.trim()] }));
    setSpecInput('');
  }

  const filtered = staff.filter(s => !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()));
  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900'}`;

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"
            className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>

        <button onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <UserPlus className="w-4 h-4" /> Create Login
        </button>

        <button onClick={() => { setForm({ ...EMPTY }); setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Staff', val: staff.length },
          { label: 'Avg Commission', val: staff.length ? `${(staff.reduce((s, m) => s + Number(m.commission_rate), 0) / staff.length).toFixed(1)}%` : '0%' },
          { label: 'Avg Hourly Rate', val: staff.length ? `₱${(staff.reduce((s, m) => s + Number(m.hourly_rate), 0) / staff.length).toFixed(0)}/hr` : '₱0/hr' },
        ].map(k => (
          <div key={k.label} className={`${card} p-4 text-center`}>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{k.val}</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Staff List & Detail View */}
      <div className="flex gap-5">
        <div className={`flex-1 ${card} overflow-hidden`}>
          {loading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
          ) : filtered.length === 0 ? (
            <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No staff found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#f3f4f6' }}>
              {filtered.map(s => (
                <div key={s.id} onClick={() => setSelected(selected?.id === s.id ? null : s)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${selected?.id === s.id ? (isDark ? 'bg-rose-900/20' : 'bg-rose-50') : (isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50')}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{s.full_name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.full_name}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.role}</p>
                  </div>
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>{Number(s.hourly_rate).toFixed(0)}/hr</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.commission_rate}% commission</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={(e: MouseEvent) => { e.stopPropagation(); openEdit(s); }} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e: MouseEvent) => { e.stopPropagation(); deactivate(s.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className={`w-64 flex-shrink-0 ${card} p-5 space-y-4 self-start`}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-lg font-bold">{selected.full_name.slice(0, 2).toUpperCase()}</span>
              </div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.full_name}</p>
              <span className={`inline-block text-xs px-2.5 py-1 rounded-full mt-1 ${isDark ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>{selected.role}</span>
            </div>
            <div className="space-y-2">
              {selected.phone && <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}><Phone className="w-3.5 h-3.5 text-violet-500" />{selected.phone}</div>}
              {selected.email && <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}><Mail className="w-3.5 h-3.5 text-violet-500" />{selected.email}</div>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Hourly', val: `${Number(selected.hourly_rate).toFixed(0)}` },
                { label: 'Commission', val: `${selected.commission_rate}%` },
              ].map(s => (
                <div key={s.label} className={`p-2 rounded-xl text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.val}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</p>
                </div>
              ))}
            </div>
            {selected.specializations?.length > 0 && (
              <div>
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Specializations</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.specializations.map(spec => (
                    <span key={spec} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{spec}</span>
                  ))}
                </div>
              </div>
            )}
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Hired: {new Date(selected.hire_date).toLocaleDateString()}</p>
            <button onClick={() => openEdit(selected)} className="w-full py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">Edit</button>
          </div>
        )}
      </div>

      {/* Original Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editing ? 'Edit Staff' : 'Add Staff Member'}</h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Full Name *</label>
                <input value={form.full_name || ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={input} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Role</label>
                <select value={form.role || ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={input}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
                  <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Phone</label>
                  <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Hourly Rate (₱)</label>
                  <input type="number" value={form.hourly_rate || 0} onChange={e => setForm(f => ({ ...f, hourly_rate: Number(e.target.value) }))} className={input} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Commission (%)</label>
                  <input type="number" value={form.commission_rate || 0} onChange={e => setForm(f => ({ ...f, commission_rate: Number(e.target.value) }))} className={input} />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Hire Date</label>
                <input type="date" value={form.hire_date || ''} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} className={input} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Specializations</label>
                <div className="flex gap-2 mb-2">
                  <input value={specInput} onChange={e => setSpecInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSpec()}
                    placeholder="E.g. Hair Color" className={`${input} flex-1`} />
                  <button onClick={addSpec} className="px-3 py-2 bg-rose-500 text-white rounded-xl text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(form.specializations || []).map((spec, i) => (
                    <span key={i} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {spec}
                      <button onClick={() => setForm(f => ({ ...f, specializations: (f.specializations || []).filter((_, j) => j !== i) }))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={save} disabled={saving || !form.full_name?.trim()} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />} 
                {saving ? 'Saving...' : (editing ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Login Modal */}
      <CreateLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => load()}
      />
    </div>
  );
}