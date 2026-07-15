import { useCallback, useEffect, useState } from 'react';
import {
  Calendar, Plus, Search, X, Check, Clock, ChevronLeft, ChevronRight, Edit2, Trash2, User, Scissors, DollarSign, FileText, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

const BRANCH = '00000000-0000-0000-0000-000000000001';

// --- Type Definitions ---
type Appt = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  total_amount: number;
  notes: string | null;
  customers: { id: string; full_name: string; phone: string | null } | null;
  staff: { id: string; full_name: string } | null;
};

type Customer = { id: string; full_name: string; phone: string | null };
type Staff = { id: string; full_name: string; role: string };
type Service = { id: string; name: string; price: number; duration_minutes: number };

type AppointmentForm = {
  appointment_date: string;
  start_time: string;
  customer_id: string;
  staff_id: string;
  service_id: string;
  total_amount: number;
  status: string;
  notes: string;
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
  no_show: 'bg-orange-100 text-orange-600',
};

const EMPTY_FORM: AppointmentForm = {
  appointment_date: new Date().toISOString().split('T')[0],
  start_time: '10:00',
  status: 'scheduled',
  total_amount: 0,
  notes: '',
  customer_id: '',
  staff_id: '',
  service_id: '',
};

export default function Appointments() {
  const { isDarkMode: isDark, businessProfile } = useApp();
  
  // Data State
  const [appts, setAppts] = useState<Appt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AppointmentForm>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, custRes, staffRes, svcRes] = await Promise.all([
        supabase.from('appointments').select('id, appointment_date, start_time, end_time, status, total_amount, notes, customers(id, full_name, phone), staff(id, full_name)').eq('branch_id', BRANCH).eq('appointment_date', selectedDate).order('start_time'),
        supabase.from('customers').select('id, full_name, phone').eq('branch_id', BRANCH).eq('is_active', true).order('full_name'),
        supabase.from('staff').select('id, full_name, role').eq('branch_id', BRANCH).eq('is_active', true).order('full_name'),
        supabase.from('services').select('id, name, price, duration_minutes').eq('branch_id', BRANCH).eq('is_active', true).order('name'),
      ]);
      setAppts((apptRes.data as unknown as Appt[]) || []);
      setCustomers(custRes.data || []);
      setStaffList(staffRes.data || []);
      setServices(svcRes.data || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  // --- Modal Handlers ---
  function openCreate() {
    setForm({ ...EMPTY_FORM, appointment_date: selectedDate });
    setEditingId(null);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(a: Appt) {
    setForm({
      appointment_date: a.appointment_date,
      start_time: a.start_time,
      status: a.status,
      total_amount: a.total_amount,
      notes: a.notes || '',
      customer_id: a.customers?.id || '',
      staff_id: a.staff?.id || '',
      service_id: '', // Service isn't stored on appt directly in this schema, reset to allow re-selection
    });
    setEditingId(a.id);
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    setFormError(null);
  }

  function onServiceChange(svcId: string) {
    const svc = services.find(s => s.id === svcId);
    setForm(f => ({ 
      ...f, 
      service_id: svcId, 
      total_amount: svc ? svc.price : f.total_amount 
    }));
  }

  async function saveAppointment() {
    // Validation
    if (!form.appointment_date || !form.start_time) {
      setFormError('Date and time are required');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = {
        branch_id: BRANCH,
        customer_id: form.customer_id || null,
        staff_id: form.staff_id || null,
        appointment_date: form.appointment_date,
        start_time: form.start_time,
        status: form.status,
        total_amount: Number(form.total_amount) || 0,
        notes: form.notes || null,
      };

      let error;
      if (editingId) {
        ({ error } = await supabase.from('appointments').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('appointments').insert(payload));
      }

      if (error) throw error;

      closeModal();
      await loadAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save appointment';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  async function deleteAppt(id: string) {
    if (!confirm('Delete this appointment?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppts(prev => prev.filter(a => a.id !== id));
  }

  // --- Helpers ---
  const shiftDate = (d: number) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + d);
    setSelectedDate(dt.toISOString().split('T')[0]);
  };

  const filtered = appts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.customers?.full_name.toLowerCase().includes(q) || a.staff?.full_name.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-xs font-medium mb-1.5 flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><ChevronLeft className="w-4 h-4" /></button>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm font-medium ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200 text-gray-900'}`} />
          <button onClick={() => shiftDate(1)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className={`flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or staff…"
            className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200 text-gray-700'}`}>
          {['all','scheduled','confirmed','completed','cancelled','no_show'].map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_',' ')}</option>
          ))}
        </select>
        <button onClick={openCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-rose-500/20">
          <Plus className="w-4 h-4" /> New Appointment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['scheduled','confirmed','completed','cancelled','no_show'].map(s => {
          const count = appts.filter(a => a.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`${card} p-3 text-center transition-all ${statusFilter === s ? 'ring-2 ring-rose-500' : ''}`}>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</p>
              <p className={`text-xs capitalize mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.replace('_',' ')}</p>
            </button>
          );
        })}
      </div>

      {/* Appointments List */}
      <div className={card}>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No appointments found</p>
            <p className="text-sm mt-1">Try a different date or clear filters</p>
          </div>
        ) : (
          <div className="divide-y divide-transparent">
            {filtered.map(a => (
              <div key={a.id} className={`flex items-center gap-3 p-4 ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                <div className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-xs font-bold ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  {a.start_time?.slice(0,5)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{a.customers?.full_name || 'Walk-in'}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {a.staff?.full_name || 'Any staff'} · {a.customers?.phone || ''}
                  </p>
                </div>
                <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-full border-0 focus:outline-none cursor-pointer ${STATUS_COLOR[a.status] || 'bg-gray-100 text-gray-600'}`}>
                  {['scheduled','confirmed','completed','cancelled','no_show'].map(s => (
                    <option key={s} value={s}>{s.replace('_',' ')}</option>
                  ))}
                </select>
                <p className={`text-sm font-bold w-14 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(Number(a.total_amount), businessProfile?.currency)}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(a)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteAppt(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- CRUD MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            
            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingId ? 'Edit Appointment' : 'New Appointment'}
              </h3>
              <button onClick={closeModal} disabled={saving} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}><Calendar className="w-3 h-3" /> Date *</label>
                  <input type="date" value={form.appointment_date} onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className={label}><Clock className="w-3 h-3" /> Time *</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={input} />
                </div>
              </div>

              {/* Customer */}
              <div>
                <label className={label}><User className="w-3 h-3" /> Customer</label>
                <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className={input}>
                  <option value="">Walk-in / No customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>

              {/* Staff */}
              <div>
                <label className={label}><User className="w-3 h-3" /> Staff Member</label>
                <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} className={input}>
                  <option value="">Any available</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} — {s.role}</option>)}
                </select>
              </div>

              {/* Service */}
              <div>
                <label className={label}><Scissors className="w-3 h-3" /> Service (auto-fills price)</label>
                <select value={form.service_id} onChange={e => onServiceChange(e.target.value)} className={input}>
                  <option value="">Select a service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} — {formatCurrencySimple(s.price, businessProfile?.currency)} ({s.duration_minutes}min)</option>)}
                </select>
              </div>

              {/* Amount & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}><DollarSign className="w-3 h-3" /> Amount</label>
                  <input type="number" min="0" step="0.01" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: Number(e.target.value) }))} className={input} />
                </div>
                <div>
                  <label className={label}><Check className="w-3 h-3" /> Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={input}>
                    {['scheduled','confirmed','completed','cancelled','no_show'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={label}><FileText className="w-3 h-3" /> Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${input} resize-none`} placeholder="Special requests, allergies, etc..." />
              </div>
            </div>

            {/* Footer Actions */}
            <div className={`flex justify-end gap-3 p-5 border-t shrink-0 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
              <button onClick={closeModal} disabled={saving} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}>
                Cancel
              </button>
              <button onClick={saveAppointment} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20 transition-all">
                {saving ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Update Appointment' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}