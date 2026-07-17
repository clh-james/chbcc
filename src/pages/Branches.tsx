import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Check, Edit2, Phone, Mail, MapPin, ToggleLeft, ToggleRight, Users, CalendarDays, DollarSign, Building2, Trophy, Flower2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

// --- Types ---
type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string;
  is_active: boolean;
  is_main?: boolean;
  created_at: string;
  logo_url?: string | null;
};

type BranchStats = {
  today_sales: number;
  staff_count: number;
  appointments_today: number;
};

const EMPTY_FORM = { name: '', address: '', phone: '', email: '', city: '', country: 'USA', is_main: false };

// --- Helpers (Moved outside to prevent re-creation) ---
function getInitials(name: string): string {
  if (!name.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', { 
    style: 'currency', 
    currency: 'PHP', 
    maximumFractionDigits: 0 
  }).format(amount);
}

export default function Branches() {
  const { isDarkMode: isDark, selectedBranchId, setSelectedBranchId } = useApp();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<Record<string, BranchStats>>({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // ✅ Memoized Data Fetchers
  const loadBranches = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
    setBranches(data || []);
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    if (branches.length === 0) return;
    setStatsLoading(true);
    const newStats: Record<string, BranchStats> = {};
    
    await Promise.all(
      branches.map(async (branch) => {
        try {
          const { data, error } = await supabase.rpc('get_branch_stats', { target_branch_id: branch.id });
          if (!error && data && data.length > 0) {
            newStats[branch.id] = data[0];
          } else {
            newStats[branch.id] = { today_sales: 0, staff_count: 0, appointments_today: 0 };
          }
        } catch {
          newStats[branch.id] = { today_sales: 0, staff_count: 0, appointments_today: 0 };
        }
      })
    );
    
    setStats(newStats);
    setStatsLoading(false);
  }, [branches]);

  useEffect(() => { loadBranches(); }, [loadBranches]);
  useEffect(() => { loadStats(); }, [loadStats]);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    
    const payload = { 
      name: form.name, 
      address: form.address || null, 
      phone: form.phone || null, 
      email: form.email || null, 
      city: form.city || null, 
      country: form.country || 'USA', 
      is_active: true, // New branches are active by default
      is_main: form.is_main || false 
    };
    
    try {
      // Handle Main Branch Uniqueness
      if (payload.is_main) {
        await supabase.from('branches').update({ is_main: false }).neq('id', editing || 'temp-id');
      }
      
      if (editing) {
        await supabase.from('branches').update(payload).eq('id', editing);
      } else {
        await supabase.from('branches').insert(payload);
      }
      
      setShowModal(false); 
      setEditing(null); 
      setForm({ ...EMPTY_FORM });
      await loadBranches(); 
    } catch (err) {
      console.error("Failed to save branch:", err);
      alert("Error saving branch. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(b: Branch) {
    // Optional: Prevent deactivating the ONLY active branch or Main Branch if desired
    // For now, we allow it but POS handles the fallback
    
    const newStatus = !b.is_active;
    await supabase.from('branches').update({ is_active: newStatus }).eq('id', b.id);
    
    // Update local state immediately for UI responsiveness
    setBranches(prev => prev.map(br => br.id === b.id ? { ...br, is_active: newStatus } : br));
    
    // If we just deactivated the currently selected branch, switch selection
    if (!newStatus && selectedBranchId === b.id) {
      const mainBranch = branches.find(br => br.is_main && br.is_active);
      const firstActive = branches.find(br => br.is_active && br.id !== b.id);
      const fallback = mainBranch || firstActive || branches[0];
      if (fallback) setSelectedBranchId(fallback.id);
    }
  }

  function openEdit(b: Branch) {
    setForm({ 
      name: b.name, 
      address: b.address || '', 
      phone: b.phone || '', 
      email: b.email || '', 
      city: b.city || '', 
      country: b.country,
      is_main: b.is_main || false 
    });
    setEditing(b.id); 
    setShowModal(true);
  }

  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${
    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900 bg-white'
  }`;

  const activeCount = branches.filter(b => b.is_active).length;
  const inactiveCount = branches.filter(b => !b.is_active).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-dashed border-gray-200 dark:border-gray-800">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Building2 className="w-6 h-6 text-rose-500" />
            My Branches
          </h2>
          <p className={`text-sm mt-1.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCount} Active</span>
            <span className="mx-2 opacity-40">•</span>
            <span className={inactiveCount > 0 ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>{inactiveCount} Inactive</span>
          </p>
        </div>
        <button 
          onClick={() => { setForm({ ...EMPTY_FORM }); setEditing(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-rose-200 dark:shadow-none self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className={`h-80 rounded-2xl animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {branches.map(b => {
            // Smart Main Branch Logic
            const hasExplicitMain = branches.some(branch => branch.is_main);
            const isMainBranch = b.is_main || 
              (!hasExplicitMain && b.city?.toLowerCase().includes('cotabato')) || 
              (!hasExplicitMain && branches.length === 1);
              
            const isSelected = selectedBranchId === b.id;
            const initials = getInitials(b.name);
            const branchStats = stats[b.id] || { today_sales: 0, staff_count: 0, appointments_today: 0 };
            
            // Dynamic Styling
            const baseClasses = "relative rounded-2xl border transition-all duration-300 ease-out cursor-pointer group overflow-hidden";
            
            let cardClasses = "";
            let paddingClass = "p-6";
            
            if (!b.is_active) {
              // Inactive State
              cardClasses = isDark 
                ? "bg-gray-800/50 border-gray-700 opacity-70 grayscale-[0.8]" 
                : "bg-gray-50 border-gray-200 opacity-70 grayscale-[0.8]";
            } else if (isMainBranch) {
              // Main Branch State (Gold)
              cardClasses = isDark
                ? "bg-amber-950/20 border-amber-800/50 border-l-4 border-l-amber-500 shadow-xl shadow-amber-900/10 scale-[1.02]"
                : "bg-[#FFFBF2] border-amber-100 border-l-4 border-l-[#FBBF24] shadow-xl shadow-amber-100/50 scale-[1.02]";
              paddingClass = "p-7";
            } else if (isSelected) {
              // Selected Regular Branch (Rose)
              cardClasses = isDark
                ? "bg-rose-950/30 border-rose-800 border-l-4 border-l-rose-500 shadow-lg shadow-rose-900/20 scale-[1.01]"
                : "bg-[#FFF5F7] border-rose-100 border-l-4 border-l-rose-500 shadow-lg shadow-rose-100/50 scale-[1.01]";
            } else {
              // Default Hoverable Card
              cardClasses = isDark
                ? "bg-gray-800 border-gray-700 hover:border-gray-600 hover:-translate-y-1 hover:shadow-xl"
                : "bg-white border-gray-100 hover:border-gray-200 hover:-translate-y-1 hover:shadow-xl";
            }

            return (
              <div 
                key={b.id}
                onClick={() => b.is_active && setSelectedBranchId(b.id)}
                className={`${baseClasses} ${cardClasses} ${paddingClass}`}
              >
                {/* Top Row: Avatar + Badges + Actions */}
                <div className="flex items-start justify-between mb-6">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    {/* Background Halo */}
                    <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                      !b.is_active ? (isDark ? 'bg-gray-700/30' : 'bg-gray-200') :
                      isMainBranch 
                        ? (isDark ? 'bg-amber-900/30' : 'bg-amber-100') 
                        : (isSelected 
                            ? (isDark ? 'bg-rose-900/40' : 'bg-rose-100') 
                            : (isDark ? 'bg-gray-700/50' : 'bg-gray-100'))
                    }`} />
                    
                    {/* Icon Container */}
                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                      !b.is_active ? (isDark ? 'bg-gray-700' : 'bg-gray-200') :
                      isMainBranch
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-600 shadow-md shadow-amber-300/50 dark:shadow-none'
                        : (isSelected 
                            ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-300/50 dark:shadow-none' 
                            : (isDark ? 'bg-gray-700' : 'bg-white border border-gray-200 group-hover:border-gray-300'))
                    }`}>
                      {b.logo_url ? (
                        <img src={b.logo_url} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
                          !b.is_active ? (isDark ? 'text-gray-500' : 'text-gray-400') :
                          isMainBranch ? 'text-white' : (isSelected ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-600 group-hover:text-gray-800'))
                        }`}>
                          {initials}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {!b.is_active ? (
                         <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 text-xs font-bold shadow-sm">
                           Inactive
                         </span>
                      ) : isMainBranch ? (
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> MAIN BRANCH
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300 text-xs font-bold shadow-sm flex items-center gap-1">
                          <Flower2 className="w-3 h-3" /> BRANCH
                        </span>
                      )}
                      
                      {b.is_active && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isMainBranch 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); toggle(b); }} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                        {b.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); openEdit(b); }} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Name & Location Tag */}
                <div className="mb-6">
                  <h3 className={`text-[20px] font-bold tracking-tight mb-1 leading-snug transition-colors duration-300 ${
                    !b.is_active ? (isDark ? 'text-gray-500' : 'text-gray-400') :
                    isMainBranch 
                      ? (isDark ? 'text-amber-100' : 'text-gray-900') 
                      : (isDark ? 'text-white' : 'text-gray-900')
                  }`}>
                    {b.name}
                  </h3>
                  {isMainBranch && b.is_active && (
                    <p className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-amber-500/80' : 'text-amber-600'}`}>
                      Headquarters • {b.city}
                    </p>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  {b.address && (
                    <div className={`flex items-start gap-3 text-[13px] leading-relaxed ${!b.is_active ? (isDark ? 'text-gray-600' : 'text-gray-400') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                      <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${!b.is_active ? 'text-gray-500' : (isMainBranch ? 'text-amber-500' : (isSelected ? 'text-rose-500' : 'text-gray-400'))}`} />
                      <span>{b.address}{b.city && !isMainBranch ? `, ${b.city}` : ''}</span>
                    </div>
                  )}
                  {b.phone && (
                    <div className={`flex items-center gap-3 text-[13px] ${!b.is_active ? (isDark ? 'text-gray-600' : 'text-gray-400') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                      <Phone className={`w-4 h-4 flex-shrink-0 ${!b.is_active ? 'text-gray-500' : (isMainBranch ? 'text-amber-500' : (isSelected ? 'text-rose-500' : 'text-gray-400'))}`} />
                      <span>{b.phone}</span>
                    </div>
                  )}
                  {b.email && (
                    <div className={`flex items-center gap-3 text-[13px] ${!b.is_active ? (isDark ? 'text-gray-600' : 'text-gray-400') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                      <Mail className={`w-4 h-4 flex-shrink-0 ${!b.is_active ? 'text-gray-500' : (isMainBranch ? 'text-amber-500' : (isSelected ? 'text-rose-500' : 'text-gray-400'))}`} />
                      <span className="truncate">{b.email}</span>
                    </div>
                  )}
                </div>

                {/* Stats Section */}
                <div className={`pt-5 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                  {statsLoading ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="text-center">
                          <div className={`h-3 w-12 mx-auto rounded animate-pulse mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                          <div className={`h-6 w-16 mx-auto rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className={`flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <DollarSign className="w-3 h-3" /> Sales
                        </div>
                        <div className={`text-lg font-bold transition-colors duration-300 ${
                          !b.is_active ? (isDark ? 'text-gray-600' : 'text-gray-400') :
                          isMainBranch ? 'text-amber-600 dark:text-amber-400' : (isSelected ? 'text-rose-500' : (isDark ? 'text-white' : 'text-gray-900'))
                        }`}>
                          {formatCurrency(branchStats.today_sales)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Users className="w-3 h-3" /> Staff
                        </div>
                        <div className={`text-lg font-bold transition-colors duration-300 ${
                          !b.is_active ? (isDark ? 'text-gray-600' : 'text-gray-400') :
                          isMainBranch ? 'text-amber-600 dark:text-amber-400' : (isSelected ? 'text-rose-500' : (isDark ? 'text-white' : 'text-gray-900'))
                        }`}>
                          {branchStats.staff_count}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <CalendarDays className="w-3 h-3" /> Booked
                        </div>
                        <div className={`text-lg font-bold transition-colors duration-300 ${
                          !b.is_active ? (isDark ? 'text-gray-600' : 'text-gray-400') :
                          isMainBranch ? 'text-amber-600 dark:text-amber-400' : (isSelected ? 'text-rose-500' : (isDark ? 'text-white' : 'text-gray-900'))
                        }`}>
                          {branchStats.appointments_today}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal with Main Branch Toggle */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{editing ? 'Edit Branch' : 'Add New Branch'}</h3>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Branch Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Chloe House - Main Branch" autoFocus />
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Full Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputClass} placeholder="Street, Building, Landmark" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputClass} /></div>
                <div><label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Country</label><input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+63..." /></div>
                <div><label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} /></div>
              </div>
              
              {/* Main Branch Toggle */}
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-amber-50 border-amber-200'}`}>
                <input 
                  type="checkbox" 
                  id="is_main"
                  checked={form.is_main}
                  onChange={e => setForm(f => ({ ...f, is_main: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="is_main" className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  Set as Main Branch (Headquarters)
                </label>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
              <button onClick={() => setShowModal(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-md shadow-rose-200 dark:shadow-none">
                {saving ? 'Saving...' : <><Check className="w-4 h-4" />{editing ? 'Update Branch' : 'Create Branch'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}