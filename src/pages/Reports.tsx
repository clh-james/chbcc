import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

const BRANCH = '00000000-0000-0000-0000-000000000001';

type InvoiceRow = {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  customers: { full_name: string } | null;
  staff: { full_name: string } | null;
};

export default function Reports() {
  const { isDarkMode: isDark, businessProfile } = useApp();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [period]);

  async function load() {
    setLoading(true);
    const now = new Date();
    let from: string;
    if (period === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      from = d.toISOString();
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else {
      from = new Date(now.getFullYear(), 0, 1).toISOString();
    }
    const { data } = await supabase.from('invoices')
      .select('id, invoice_number, total_amount, status, payment_method, created_at, customers(full_name), staff(full_name)')
      .eq('branch_id', BRANCH)
      .gte('created_at', from)
      .order('created_at', { ascending: false });
    setInvoices((data as unknown as InvoiceRow[]) || []);
    setLoading(false);
  }

  const paid = invoices.filter(i => i.status === 'paid');
  const totalRevenue = paid.reduce((s, i) => s + Number(i.total_amount), 0);
  const avgTicket = paid.length ? totalRevenue / paid.length : 0;

  const byMethod: Record<string, number> = {};
  paid.forEach(i => {
    const m = i.payment_method || 'unknown';
    byMethod[m] = (byMethod[m] || 0) + Number(i.total_amount);
  });

  const dailyRev: Record<string, number> = {};
  paid.forEach(i => {
    const d = i.created_at.slice(0, 10);
    dailyRev[d] = (dailyRev[d] || 0) + Number(i.total_amount);
  });
  const dailyEntries = Object.entries(dailyRev).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  const maxRev = Math.max(...dailyEntries.map(([, v]) => v), 1);

  function exportCSV() {
    const rows = [
      ['Invoice#', 'Customer', 'Staff', 'Amount', 'Status', 'Payment', 'Date'],
      ...invoices.map(i => [
        i.invoice_number,
        (i.customers as any)?.full_name || 'Walk-in',
        (i.staff as any)?.full_name || '',
        Number(i.total_amount).toFixed(2),
        i.status,
        i.payment_method || '',
        new Date(i.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex rounded-xl p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {(['week','month','year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${period === p ? 'bg-white text-gray-900 shadow-sm' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>{p}</button>
          ))}
        </div>
        <button onClick={exportCSV} className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', val: formatCurrencySimple(totalRevenue, businessProfile?.currency), icon: DollarSign, grad: 'from-emerald-400 to-teal-500' },
          { label: 'Transactions', val: String(paid.length), icon: BarChart3, grad: 'from-blue-400 to-cyan-500' },
          { label: 'Avg Ticket', val: formatCurrencySimple(avgTicket, businessProfile?.currency), icon: TrendingUp, grad: 'from-amber-400 to-orange-500' },
          { label: 'Cancelled', val: String(invoices.filter(i => i.status === 'cancelled').length), icon: Calendar, grad: 'from-rose-400 to-pink-500' },
        ].map(k => (
          <div key={k.label} className={card}>
            <div className="p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${k.grad} mb-3`}>
                <k.icon className="w-5 h-5 text-white" />
              </div>
              {loading ? <div className={`h-6 w-20 rounded animate-pulse mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} /> : <p className={`text-xl font-bold mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{k.val}</p>}
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className={`xl:col-span-2 ${card} p-5`}>
          <h3 className={`font-semibold text-sm mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>Daily Revenue</h3>
          {loading ? <div className={`h-32 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} /> : (
            <div className="flex items-end gap-1.5 h-32">
              {dailyEntries.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No revenue data for this period</p>
              ) : dailyEntries.map(([date, rev]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-sm transition-all hover:opacity-80"
                    style={{ height: `${(rev / maxRev) * 100}%`, minHeight: '4px' }}
                    title={`${date}: ${formatCurrencySimple(rev, businessProfile?.currency)}`} />
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} hidden lg:block`} style={{ fontSize: '9px' }}>{date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment breakdown */}
        <div className={`${card} p-5`}>
          <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Methods</h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={`h-8 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
          ) : Object.keys(byMethod).length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byMethod).sort(([,a],[,b]) => b - a).map(([method, amount]) => {
                const pct = Math.round(amount / totalRevenue * 100);
                return (
                  <div key={method}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`capitalize font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{method}</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(amount, businessProfile?.currency)} ({pct}%)</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transactions table */}
      <div className={card}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Transactions ({invoices.length})</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className={`h-10 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
        ) : invoices.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No transactions in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs font-semibold uppercase tracking-wide`}>
                  {['Invoice', 'Customer', 'Staff', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: isDark ? '#374151' : '#f9fafb' }}>
                {invoices.slice(0, 50).map(inv => (
                  <tr key={inv.id} className={`${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{inv.invoice_number}</td>
                    <td className={`px-4 py-3 text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{(inv.customers as any)?.full_name || 'Walk-in'}</td>
                    <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{(inv.staff as any)?.full_name || '—'}</td>
                    <td className={`px-4 py-3 text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(Number(inv.total_amount), businessProfile?.currency)}</td>
                    <td className={`px-4 py-3 text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{inv.payment_method || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(inv.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
