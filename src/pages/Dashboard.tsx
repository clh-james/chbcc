import { useEffect, useState } from 'react';
import {
  TrendingUp, Users, Calendar, DollarSign, ArrowUpRight,
  Clock, CheckCircle, XCircle, AlertCircle, ChevronRight,
  Package
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

const BRANCH_ID = '00000000-0000-0000-0000-000000000001';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  no_show: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};


type ApptRow = {
  id: string;
  start_time: string;
  status: string;
  total_amount: number;
  customers: { full_name: string } | null;
  staff: { full_name: string } | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  customers: { full_name: string } | null;
};

type LowStock = { id: string; name: string; current_stock: number; min_stock_level: number };


export default function Dashboard() {
  const { setCurrentPage, businessProfile, isDarkMode: isDark } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, appts: 0, customers: 0, month: 0, prevMonth: 0 });
  const [appointments, setAppointments] = useState<ApptRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = today.slice(0, 7) + '-01';

      const [todayInv, monthInv, custCount, apptCount, apptDetail, stock, recentInv] = await Promise.all([
        supabase.from('invoices').select('total_amount').eq('branch_id', BRANCH_ID).eq('status', 'paid').gte('created_at', today + 'T00:00:00'),
        supabase.from('invoices').select('total_amount').eq('branch_id', BRANCH_ID).eq('status', 'paid').gte('created_at', monthStart + 'T00:00:00'),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('branch_id', BRANCH_ID),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today).eq('branch_id', BRANCH_ID),
        supabase.from('appointments').select('id, start_time, status, total_amount, customers(full_name), staff(full_name)').eq('appointment_date', today).eq('branch_id', BRANCH_ID).order('start_time'),
        supabase.from('products').select('id, name, current_stock, min_stock_level').eq('branch_id', BRANCH_ID).lte('current_stock', 5),
        supabase.from('invoices').select('id, invoice_number, total_amount, status, customers(full_name)').eq('branch_id', BRANCH_ID).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        today: (todayInv.data || []).reduce((s, r) => s + Number(r.total_amount), 0),
        month: (monthInv.data || []).reduce((s, r) => s + Number(r.total_amount), 0),
        prevMonth: 0,
        customers: custCount.count || 0,
        appts: apptCount.count || 0,
      });
      setAppointments((apptDetail.data as unknown as ApptRow[]) || []);
      setLowStock((stock.data || []).filter(p => p.current_stock <= p.min_stock_level));
      setInvoices((recentInv.data as unknown as InvoiceRow[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const card = `rounded-2xl p-5 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const heading = `font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`;

  const kpis = [
    { label: "Today's Revenue", val: formatCurrencySimple(stats.today, businessProfile?.currency), icon: DollarSign, grad: 'from-emerald-400 to-teal-500' },
    { label: "Today's Appointments", val: String(stats.appts), icon: Calendar, grad: 'from-blue-400 to-cyan-500' },
    { label: 'Total Customers', val: String(stats.customers), icon: Users, grad: 'from-rose-400 to-pink-500' },
    { label: 'Month Revenue', val: formatCurrencySimple(stats.month, businessProfile?.currency), icon: TrendingUp, grad: 'from-amber-400 to-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={card}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${k.grad}`}>
                <k.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-500 opacity-60" />
            </div>
            {loading
              ? <div className={`h-7 w-20 rounded animate-pulse mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              : <p className={`text-2xl font-bold mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{k.val}</p>
            }
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's appointments */}
        <div className={`xl:col-span-2 ${card}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={heading}>Today's Schedule</h3>
            <button onClick={() => setCurrentPage('appointments')} className="flex items-center gap-1 text-rose-500 text-sm font-medium hover:text-rose-600 transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={`h-14 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
          ) : appointments.length === 0 ? (
            <div className={`text-center py-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No appointments scheduled today</p>
              <button onClick={() => setCurrentPage('appointments')} className="mt-3 text-rose-500 text-sm font-medium hover:underline">Book one now</button>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map(a => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                  <div className={`w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700 shadow-sm'}`}>
                    {a.start_time?.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{a.customers?.full_name || 'Walk-in'}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>with {a.staff?.full_name || 'Any staff'}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                    {a.status === 'confirmed' && <CheckCircle className="w-3 h-3" />}
                    {a.status === 'scheduled' && <Clock className="w-3 h-3" />}
                    {a.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                    {a.status === 'no_show' && <AlertCircle className="w-3 h-3" />}
                    <span className="capitalize">{a.status.replace('_', ' ')}</span>
                  </span>
                  <p className={`text-sm font-bold flex-shrink-0 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(Number(a.total_amount), businessProfile?.currency)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Low stock */}
          <div className={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={heading}>Low Stock</h3>
              <button onClick={() => setCurrentPage('inventory')} className="text-rose-500 hover:text-rose-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {loading
              ? <div className={`h-10 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
              : lowStock.length === 0
                ? <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}><Package className="w-4 h-4 text-emerald-500" /> All stock levels healthy</div>
                : <div className="space-y-2">
                    {lowStock.slice(0, 4).map(p => (
                      <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-xl ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span className={`text-xs font-medium truncate ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{p.name}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 ml-2 flex-shrink-0">{p.current_stock}</span>
                      </div>
                    ))}
                  </div>
            }
          </div>

          {/* Recent invoices */}
          <div className={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={heading}>Recent Sales</h3>
              <button onClick={() => setCurrentPage('reports')} className="text-rose-500 hover:text-rose-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {loading
              ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className={`h-8 rounded-lg animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
              : invoices.length === 0
                ? <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No invoices yet</p>
                : <div className="space-y-2.5">
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{inv.customers?.full_name || 'Walk-in'}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{inv.invoice_number}</p>
                        </div>
                        <span className={`text-xs font-bold flex-shrink-0 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(Number(inv.total_amount), businessProfile?.currency)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{inv.status}</span>
                      </div>
                    ))}
                  </div>
            }
          </div>

          {/* Quick actions */}
          <div className={card}>
            <h3 className={`${heading} mb-3`}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Book Appointment', page: 'appointments' as const, grad: 'from-blue-500 to-cyan-500' },
                { label: 'New Invoice', page: 'pos' as const, grad: 'from-emerald-500 to-teal-500' },
                { label: 'Add Customer', page: 'customers' as const, grad: 'from-rose-500 to-pink-500' },
                { label: 'View Reports', page: 'reports' as const, grad: 'from-amber-500 to-orange-500' },
              ].map(a => (
                <button key={a.label} onClick={() => setCurrentPage(a.page)}
                  className={`bg-gradient-to-r ${a.grad} text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
