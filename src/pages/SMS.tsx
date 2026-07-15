import { useEffect, useState } from 'react';
import { MessageSquare, Send, X, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const BRANCH = '00000000-0000-0000-0000-000000000001';

type SmsRow = {
  id: string;
  phone: string;
  message: string;
  type: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  customers: { full_name: string } | null;
};

type Customer = { id: string; full_name: string; phone: string | null };

const TEMPLATES = [
  { label: 'Appointment Reminder', msg: 'Hi {name}, this is a reminder for your appointment tomorrow. Reply CONFIRM or CANCEL. — Chloe House Of Beauty' },
  { label: 'Appointment Confirmed', msg: 'Hi {name}, your appointment is confirmed! We look forward to seeing you. — Chloe House Of Beauty' },
  { label: 'Thank You', msg: 'Thank you for visiting Chloe House Of Beauty, {name}! We hope you loved your treatment. Book again at: luxesalon.com' },
  { label: 'Promotion', msg: 'Hi {name}, exclusive offer: 20% off all services this weekend! Book now. — Chloe House Of Beauty' },
  { label: 'Birthday', msg: 'Happy Birthday, {name}! Celebrate with 15% off your next visit. Gift from Chloe House Of Beauty.' },
];

export default function SMS() {
  const { isDarkMode: isDark } = useApp();
  const [messages, setMessages] = useState<SmsRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customer_id: '', phone: '', message: '', type: 'custom' as string });
  const [sending, setSending] = useState(false);
  const [bulk, setBulk] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [msgRes, custRes] = await Promise.all([
      supabase.from('sms_notifications').select('id, phone, message, type, status, sent_at, created_at, customers(full_name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('customers').select('id, full_name, phone').eq('branch_id', BRANCH).eq('is_active', true).not('phone', 'is', null).order('full_name'),
    ]);
    setMessages((msgRes.data as unknown as SmsRow[]) || []);
    setCustomers(custRes.data || []);
    setLoading(false);
  }

  async function sendMessage() {
    setSending(true);
    const targets = bulk
      ? customers.filter(c => c.phone).map(c => ({ customer_id: c.id, phone: c.phone!, message: form.message.replace('{name}', c.full_name.split(' ')[0]), type: form.type }))
      : [{ customer_id: form.customer_id || null, phone: form.phone, message: form.message, type: form.type }];

    for (const t of targets) {
      await supabase.from('sms_notifications').insert({ ...t, status: 'sent', sent_at: new Date().toISOString() });
    }
    setShowModal(false);
    setForm({ customer_id: '', phone: '', message: '', type: 'custom' });
    setBulk(false);
    await load();
    setSending(false);
  }

  function applyTemplate(msg: string) {
    const cust = customers.find(c => c.id === form.customer_id);
    const name = cust ? cust.full_name.split(' ')[0] : '{name}';
    setForm(f => ({ ...f, message: msg.replace('{name}', name) }));
  }

  function onCustomerChange(id: string) {
    const c = customers.find(c => c.id === id);
    setForm(f => ({ ...f, customer_id: id, phone: c?.phone || '' }));
  }

  const STATUS_COLOR: Record<string, string> = {
    sent: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-600',
  };

  const TYPE_COLOR: Record<string, string> = {
    reminder: 'bg-blue-100 text-blue-700',
    confirmation: 'bg-emerald-100 text-emerald-700',
    promotion: 'bg-amber-100 text-amber-700',
    custom: 'bg-gray-100 text-gray-600',
  };

  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900'}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {[
            { label: 'Total Sent', val: messages.filter(m => m.status === 'sent').length },
            { label: 'Pending', val: messages.filter(m => m.status === 'pending').length },
          ].map(k => (
            <div key={k.label} className={`${card} px-4 py-3 flex items-center gap-3`}>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{k.val}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => { setBulk(false); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">
          <Send className="w-4 h-4" /> Send SMS
        </button>
      </div>

      {/* Templates */}
      <div className={card}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Templates</h3>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {TEMPLATES.map(t => (
            <button key={t.label}
              onClick={() => { setForm(f => ({ ...f, message: t.msg })); setShowModal(true); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600'}`}>
              <MessageSquare className="w-3 h-3" /> {t.label}
            </button>
          ))}
          <button onClick={() => { setBulk(true); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:opacity-90">
            <Users className="w-3 h-3" /> Bulk Campaign
          </button>
        </div>
      </div>

      {/* Message log */}
      <div className={card}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Message History</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3,4].map(i => <div key={i} className={`h-14 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No messages sent yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#f9fafb' }}>
            {messages.map(m => (
              <div key={m.id} className={`p-4 ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.customers?.full_name || m.phone}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLOR[m.type] || 'bg-gray-100 text-gray-600'}`}>{m.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.status] || 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{bulk ? 'Bulk Campaign' : 'Send SMS'}</h3>
              <button onClick={() => { setShowModal(false); setBulk(false); }} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!bulk ? (
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Customer (optional)</label>
                  <select value={form.customer_id} onChange={e => onCustomerChange(e.target.value)} className={input}>
                    <option value="">Manual number</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
                  </select>
                </div>
              ) : (
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'} text-xs`}>
                  Will send to all {customers.filter(c => c.phone).length} customers with phone numbers. {'{name}'} will be replaced with first name.
                </div>
              )}
              {!bulk && (
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Phone Number</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0000" className={input} />
                </div>
              )}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={input}>
                  {['custom','reminder','confirmation','promotion'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Message</label>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{form.message.length}/160</span>
                </div>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} maxLength={320}
                  placeholder="Type your message…" className={input} />
              </div>
              <div>
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Templates</p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map(t => (
                    <button key={t.label} onClick={() => applyTemplate(t.msg)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => { setShowModal(false); setBulk(false); }} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={sendMessage} disabled={sending || !form.message.trim() || (!bulk && !form.phone.trim())}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90">
                <Send className="w-4 h-4" />{sending ? 'Sending…' : bulk ? `Send to ${customers.filter(c => c.phone).length} customers` : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
