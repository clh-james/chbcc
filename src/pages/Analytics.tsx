import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Calendar, BarChart3, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

const BRANCH = '00000000-0000-0000-0000-000000000001';

export default function Analytics() {
  const { isDarkMode: isDark, businessProfile } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalCustomers: 0, totalAppointments: 0,
    avgTicket: 0, topStaff: [] as { name: string; revenue: number }[],
    topServices: [] as { name: string; count: number }[],
    monthlyRevenue: [] as { month: string; revenue: number }[],
    customerRetention: 0,
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

    const [invRes, custRes, apptRes, staffInvRes] = await Promise.all([
      supabase.from('invoices').select('total_amount, created_at, status').eq('branch_id', BRANCH).gte('created_at', yearStart),
      supabase.from('customers').select('id, visit_count, created_at').eq('branch_id', BRANCH),
      supabase.from('appointments').select('id, created_at').eq('branch_id', BRANCH).gte('created_at', yearStart),
      supabase.from('invoices').select('total_amount, staff(full_name)').eq('branch_id', BRANCH).eq('status', 'paid').gte('created_at', yearStart),
    ]);

    const paid = (invRes.data || []).filter(i => i.status === 'paid');
    const totalRevenue = paid.reduce((s, i) => s + Number(i.total_amount), 0);
    const avgTicket = paid.length ? totalRevenue / paid.length : 0;

    // Monthly revenue
    const monthMap: Record<string, number> = {};
    paid.forEach(i => {
      const key = i.created_at.slice(0, 7);
      monthMap[key] = (monthMap[key] || 0) + Number(i.total_amount);
    });
    const monthlyRevenue = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, revenue]) => ({
      month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
      revenue,
    }));

    // Top staff by revenue
    const staffMap: Record<string, number> = {};
    (staffInvRes.data || []).forEach((inv: any) => {
      const name = inv.staff?.full_name || 'Unknown';
      staffMap[name] = (staffMap[name] || 0) + Number(inv.total_amount);
    });
    const topStaff = Object.entries(staffMap).sort(([,a],[,b]) => b - a).slice(0, 5).map(([name, revenue]) => ({ name, revenue }));

    // Retention (customers with >1 visit)
    const allCust = custRes.data || [];
    const returning = allCust.filter(c => c.visit_count > 1).length;
    const customerRetention = allCust.length ? Math.round(returning / allCust.length * 100) : 0;

    setStats({
      totalRevenue,
      totalCustomers: allCust.length,
      totalAppointments: apptRes.count || (apptRes.data || []).length,
      avgTicket,
      topStaff,
      topServices: [],
      monthlyRevenue,
      customerRetention,
    });
    setLoading(false);
  }

  const maxMonthRev = Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1);
  const maxStaffRev = Math.max(...stats.topStaff.map(s => s.revenue), 1);

  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'YTD Revenue', val: formatCurrencySimple(stats.totalRevenue, businessProfile?.currency), icon: DollarSign, grad: 'from-emerald-400 to-teal-500' },
          { label: 'Total Customers', val: String(stats.totalCustomers), icon: Users, grad: 'from-blue-400 to-cyan-500' },
          { label: 'Total Appointments', val: String(stats.totalAppointments), icon: Calendar, grad: 'from-rose-400 to-pink-500' },
          { label: 'Avg Ticket', val: formatCurrencySimple(stats.avgTicket, businessProfile?.currency), icon: TrendingUp, grad: 'from-amber-400 to-orange-500' },
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className={`${card} p-5`}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-rose-500" />
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Monthly Revenue (YTD)</h3>
          </div>
          {loading ? <div className={`h-36 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} /> : (
            stats.monthlyRevenue.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
            ) : (
              <div className="flex items-end gap-2 h-36">
                {stats.monthlyRevenue.map(m => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{fontSize:'9px'}}>{formatCurrencySimple(m.revenue, businessProfile?.currency)}</span>
                    <div className="w-full bg-gradient-to-t from-rose-500 to-pink-400 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${(m.revenue / maxMonthRev) * 100}%`, minHeight: '4px' }} />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.month}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Top Staff */}
        <div className={`${card} p-5`}>
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Top Staff by Revenue</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className={`h-8 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
          ) : stats.topStaff.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No staff revenue data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topStaff.map((s, i) => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium flex items-center gap-1.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>{i+1}</span>
                      {s.name}
                    </span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(s.revenue, businessProfile?.currency)}</span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${(s.revenue / maxStaffRev) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retention */}
        <div className={`${card} p-5`}>
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-blue-500" />
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Insights</h3>
          </div>
          {loading ? <div className={`h-24 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} /> : (
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-2xl font-extrabold text-blue-500">{stats.customerRetention}%</div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Retention Rate</p>
              </div>
              <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalCustomers}</div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Customers</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className={`${card} p-5`}>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Business Health</h3>
          </div>
          {loading ? <div className={`h-24 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} /> : (
            <div className="space-y-3">
              {[
                { label: 'YTD Revenue', val: formatCurrencySimple(stats.totalRevenue, businessProfile?.currency), pct: 100 },
                { label: 'Avg Ticket Size', val: formatCurrencySimple(stats.avgTicket, businessProfile?.currency), pct: Math.min(100, (stats.avgTicket / 200) * 100) },
                { label: 'Customer Retention', val: `${stats.customerRetention}%`, pct: stats.customerRetention },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{m.label}</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.val}</span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
