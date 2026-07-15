import { useEffect, useState } from 'react';
import { Plus, X, Check, Edit2, Trash2, Users, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

const BRANCH = '00000000-0000-0000-0000-000000000001';

type Membership = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  benefits: string[];
  discount_percentage: number;
  points_multiplier: number;
  is_active: boolean;
};

// ✅ FIX: Made nested objects optional (?) to match Supabase join behavior
type CustomerMembership = {
  id: string;
  membership_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  amount_paid: number;
  customers?: { id: string; full_name: string } | null;
  memberships?: { id: string; name: string; price: number } | null;
};

type Customer = { id: string; full_name: string };

const PLAN_EMPTY = {
  name: '', description: '', price: 0, duration_days: 30,
  benefits: [] as string[], discount_percentage: 0, points_multiplier: 1.0,
};

const TIER_COLORS: Record<string, string> = {
  'Silver': 'from-gray-400 to-slate-500',
  'Gold': 'from-amber-400 to-yellow-500',
  'Platinum': 'from-violet-400 to-purple-500',
};

export default function Memberships() {
  const { isDarkMode: isDark, businessProfile } = useApp();
  const [plans, setPlans] = useState<Membership[]>([]);
  const [assignments, setAssignments] = useState<CustomerMembership[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'plans' | 'members'>('plans');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({ ...PLAN_EMPTY });
  const [benefitInput, setBenefitInput] = useState('');
  const [assignForm, setAssignForm] = useState({ customer_id: '', membership_id: '', start_date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [planRes, assignRes, custRes] = await Promise.all([
      supabase.from('memberships').select('*').eq('is_active', true).order('price'),
      // ✅ FIX: Explicitly select membership_id for filtering
      supabase.from('customer_memberships')
        .select('id, membership_id, start_date, end_date, status, amount_paid, customers(id, full_name), memberships(id, name, price)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name').eq('branch_id', BRANCH).eq('is_active', true).order('full_name'),
    ]);

    const raw = planRes.data || [];
    setPlans(raw.map(p => ({ 
      ...p, 
      benefits: Array.isArray(p.benefits) ? p.benefits : (p.benefits ? JSON.parse(JSON.stringify(p.benefits)) : []) 
    })));
    
    // ✅ FIX: Safe cast to our updated optional type
    setAssignments((assignRes.data as unknown as CustomerMembership[]) || []);
    setCustomers(custRes.data || []);
    setLoading(false);
  }

  async function savePlan() {
    if (!planForm.name.trim()) return;
    setSaving(true);
    const payload = { ...planForm, benefits: planForm.benefits, is_active: true };
    if (editing) {
      await supabase.from('memberships').update(payload).eq('id', editing);
    } else {
      await supabase.from('memberships').insert(payload);
    }
    setShowPlanModal(false); setEditing(null); setPlanForm({ ...PLAN_EMPTY });
    await load(); setSaving(false);
  }

  async function assign() {
    if (!assignForm.customer_id || !assignForm.membership_id) return;
    setSaving(true);
    const plan = plans.find(p => p.id === assignForm.membership_id);
    const end = new Date(assignForm.start_date);
    end.setDate(end.getDate() + (plan?.duration_days || 30));
    await supabase.from('customer_memberships').insert({
      customer_id: assignForm.customer_id,
      membership_id: assignForm.membership_id,
      start_date: assignForm.start_date,
      end_date: end.toISOString().split('T')[0],
      status: 'active',
      amount_paid: plan?.price || 0,
    });
    setShowAssignModal(false);
    setAssignForm({ customer_id: '', membership_id: '', start_date: new Date().toISOString().split('T')[0] });
    await load(); setSaving(false);
  }

  async function cancelMembership(id: string) {
    if (!confirm('Cancel this membership?')) return;
    await supabase.from('customer_memberships').update({ status: 'cancelled' }).eq('id', id);
    setAssignments(prev => prev.filter(a => a.id !== id));
  }

  function openEditPlan(p: Membership) {
    setPlanForm({ 
      name: p.name, description: p.description || '', price: p.price, 
      duration_days: p.duration_days, benefits: p.benefits, 
      discount_percentage: p.discount_percentage, points_multiplier: p.points_multiplier 
    });
    setEditing(p.id); setShowPlanModal(true);
  }

  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900'}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className={`flex rounded-xl p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <button onClick={() => setTab('plans')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'plans' ? 'bg-white text-gray-900 shadow-sm' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>Plans</button>
          <button onClick={() => setTab('members')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'members' ? 'bg-white text-gray-900 shadow-sm' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
            Active Members <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>{assignments.length}</span>
          </button>
        </div>
        {tab === 'plans' ? (
          <button onClick={() => { setPlanForm({ ...PLAN_EMPTY }); setEditing(null); setShowPlanModal(true); }}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" /> New Plan
          </button>
        ) : (
          <button onClick={() => setShowAssignModal(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" /> Assign Plan
          </button>
        )}
      </div>

      {tab === 'plans' ? (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1,2,3].map(i => <div key={i} className={`h-48 rounded-2xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {plans.map(plan => {
              const grad = TIER_COLORS[plan.name] || 'from-rose-400 to-pink-500';
              // ✅ FIX: Filter by ID instead of unsafe name comparison
              const memberCount = assignments.filter(a => a.membership_id === plan.id).length;
              return (
                <div key={plan.id} className={`${card} overflow-hidden`}>
                  <div className={`bg-gradient-to-br ${grad} p-5 text-white`}>
                    <div className="flex items-center justify-between mb-2">
                      <Crown className="w-6 h-6" />
                      <div className="flex gap-1">
                        <button onClick={() => openEditPlan(plan)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-3xl font-extrabold mt-1">{formatCurrencySimple(plan.price, businessProfile?.currency)}<span className="text-sm font-normal opacity-80">/mo</span></p>
                    <p className="text-xs opacity-80 mt-1">{plan.duration_days} days · {memberCount} active members</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex gap-3 text-center">
                      <div className={`flex-1 p-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.discount_percentage}%</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Discount</p>
                      </div>
                      <div className={`flex-1 p-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.points_multiplier}x</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Points</p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {plan.benefits.map((b, i) => (
                        <li key={i} className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className={card}>
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className={`h-14 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
          ) : assignments.length === 0 ? (
            <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No active memberships</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#f3f4f6' }}>
              {assignments.map(a => (
                <div key={a.id} className={`flex items-center gap-3 p-4 ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* ✅ FIX: Safe access with optional chaining */}
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{a.customers?.full_name || 'Unknown'}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{a.memberships?.name} · Expires {a.end_date ? new Date(a.end_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{formatCurrencySimple(Number(a.amount_paid), businessProfile?.currency)}</span>
                  <button onClick={() => cancelMembership(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 ml-2"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editing ? 'Edit Plan' : 'New Plan'}</h3>
              <button onClick={() => setShowPlanModal(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Plan Name *</label>
                <input value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} className={input} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Price ({businessProfile?.currency || 'PHP'})</label>
                  <input type="number" value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: Number(e.target.value) }))} className={input} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Duration (days)</label>
                  <input type="number" value={planForm.duration_days} onChange={e => setPlanForm(f => ({ ...f, duration_days: Number(e.target.value) }))} className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Discount (%)</label>
                  <input type="number" value={planForm.discount_percentage} onChange={e => setPlanForm(f => ({ ...f, discount_percentage: Number(e.target.value) }))} className={input} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Points Multiplier</label>
                  <input type="number" step="0.1" value={planForm.points_multiplier} onChange={e => setPlanForm(f => ({ ...f, points_multiplier: Number(e.target.value) }))} className={input} />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Benefits</label>
                <div className="flex gap-2 mb-2">
                  <input value={benefitInput} onChange={e => setBenefitInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && benefitInput.trim()) { setPlanForm(f => ({ ...f, benefits: [...f.benefits, benefitInput.trim()] })); setBenefitInput(''); } }}
                    placeholder="E.g. Free blowout monthly" className={`${input} flex-1`} />
                  <button onClick={() => { if (benefitInput.trim()) { setPlanForm(f => ({ ...f, benefits: [...f.benefits, benefitInput.trim()] })); setBenefitInput(''); } }}
                    className="px-3 py-2 bg-rose-500 text-white rounded-xl text-sm">Add</button>
                </div>
                <div className="space-y-1">
                  {planForm.benefits.map((b, i) => (
                    <div key={i} className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                      {b}
                      <button onClick={() => setPlanForm(f => ({ ...f, benefits: f.benefits.filter((_, j) => j !== i) }))}><X className="w-3 h-3 text-gray-400" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowPlanModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={savePlan} disabled={saving || !planForm.name.trim()} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                <Check className="w-4 h-4" />{editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Assign Membership</h3>
              <button onClick={() => setShowAssignModal(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Customer</label>
                <select value={assignForm.customer_id} onChange={e => setAssignForm(f => ({ ...f, customer_id: e.target.value }))} className={input}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Plan</label>
                <select value={assignForm.membership_id} onChange={e => setAssignForm(f => ({ ...f, membership_id: e.target.value }))} className={input}>
                  <option value="">Select plan…</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrencySimple(p.price, businessProfile?.currency)}/mo</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Start Date</label>
                <input type="date" value={assignForm.start_date} onChange={e => setAssignForm(f => ({ ...f, start_date: e.target.value }))} className={input} />
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowAssignModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={assign} disabled={saving || !assignForm.customer_id || !assignForm.membership_id} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                <Check className="w-4 h-4" /> Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}