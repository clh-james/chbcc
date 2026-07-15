import { useEffect, useState } from 'react';
import { Users, Plus, Search, X, Check, Edit2, Trash2, Phone, Mail, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

const BRANCH = '00000000-0000-0000-0000-000000000001';

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  loyalty_points: number;
  total_spent: number;
  visit_count: number;
  last_visit_at: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

const EMPTY: Partial<Customer> = {
  full_name: '', email: '', phone: '', gender: '', date_of_birth: '', notes: '', is_active: true,
};

export default function Customers() {
  const { isDarkMode: isDark, businessProfile } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').eq('branch_id', BRANCH).eq('is_active', true).order('full_name');
    setCustomers(data || []);
    setLoading(false);
  }

  async function save() {
    if (!form.full_name?.trim()) return;
    setSaving(true);
    const payload = {
      branch_id: BRANCH,
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      notes: form.notes || null,
      is_active: true,
    };
    if (editing) {
      await supabase.from('customers').update(payload).eq('id', editing);
    } else {
      await supabase.from('customers').insert(payload);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ ...EMPTY });
    await load();
    setSaving(false);
  }

  async function deactivate(id: string) {
    if (!confirm('Remove this customer?')) return;
    await supabase.from('customers').update({ is_active: false }).eq('id', id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function openEdit(c: Customer) {
    setForm({ full_name: c.full_name, email: c.email || '', phone: c.phone || '', gender: c.gender || '', date_of_birth: c.date_of_birth || '', notes: c.notes || '' });
    setEditing(c.id);
    setShowModal(true);
  }

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.full_name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone…"
            className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>
        <button onClick={() => { setForm({ ...EMPTY }); setEditing(null); setShowModal(true); }}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', val: customers.length },
          { label: 'Total Spent', val: formatCurrencySimple(customers.reduce((s, c) => s + Number(c.total_spent), 0), businessProfile?.currency) },
          { label: 'Total Visits', val: customers.reduce((s, c) => s + c.visit_count, 0) },
        ].map(k => (
          <div key={k.label} className={`${card} p-4 text-center`}>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{k.val}</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className={`flex gap-5 ${selected ? '' : ''}`}>
        {/* List */}
        <div className={`flex-1 ${card} overflow-hidden`}>
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className={`h-14 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
          ) : filtered.length === 0 ? (
            <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No customers found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#f3f4f6' }}>
              {filtered.map(c => (
                <div key={c.id}
                  onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${selected?.id === c.id ? (isDark ? 'bg-rose-900/20' : 'bg-rose-50') : (isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50')}`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{c.full_name.slice(0,2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.full_name}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{c.email || c.phone || 'No contact'}</p>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrencySimple(Number(c.total_spent), businessProfile?.currency)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{c.visit_count} visits</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={e => { e.stopPropagation(); openEdit(c); }} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); deactivate(c.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className={`w-72 flex-shrink-0 ${card} p-5 space-y-4 self-start`}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl font-bold">{selected.full_name.slice(0,2).toUpperCase()}</span>
              </div>
              <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.full_name}</p>
              {selected.gender && <p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selected.gender}</p>}
            </div>
            <div className="space-y-2">
              {selected.phone && <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}><Phone className="w-4 h-4 text-rose-500" /> {selected.phone}</div>}
              {selected.email && <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}><Mail className="w-4 h-4 text-rose-500" /> {selected.email}</div>}
              {selected.last_visit_at && <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}><Clock className="w-4 h-4 text-rose-500" /> Last visit {new Date(selected.last_visit_at).toLocaleDateString()}</div>}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Visits', val: selected.visit_count },
                { label: 'Points', val: selected.loyalty_points },
                { label: 'Spent', val: formatCurrencySimple(Number(selected.total_spent), businessProfile?.currency) },
              ].map(s => (
                <div key={s.label} className={`p-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.val}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</p>
                </div>
              ))}
            </div>
            {selected.notes && <p className={`text-xs p-3 rounded-xl ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>{selected.notes}</p>}
            <button onClick={() => openEdit(selected)} className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editing ? 'Edit Customer' : 'New Customer'}</h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Full Name *</label>
                <input value={form.full_name || ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={input} placeholder="Jane Doe" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
                  <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={input} placeholder="jane@email.com" />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Phone</label>
                  <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={input} placeholder="+1 555-0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Gender</label>
                  <select value={form.gender || ''} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className={input}>
                    <option value="">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Date of Birth</label>
                  <input type="date" value={form.date_of_birth || ''} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className={input} />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={input} placeholder="Preferences, allergies…" />
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={save} disabled={saving || !form.full_name?.trim()} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                <Check className="w-4 h-4" /> {editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
