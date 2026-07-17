import ReceiptPreview from '../components/ReceiptPreview';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  CreditCard, Search, X, ShoppingCart, Check,
  DollarSign, Package, Scissors, Printer
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

const TAX_RATE = 0.08;

// --- Type Definitions ---
type Service = { id: string; name: string; price: number; duration_minutes: number; category?: string };
type Product = { id: string; name: string; retail_price: number; current_stock: number };
type Customer = { id: string; full_name: string; loyalty_points: number };
type CartItem = { id: string; name: string; price: number; qty: number; type: 'service' | 'product' };

type InvoiceItemRow = {
  id: string;
  item_type: 'service' | 'product';
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type RecentInvoice = {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  customers?: { full_name: string } | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: string;
  items: InvoiceItemRow[];
  customer?: { full_name: string } | null;
  paymentMethod?: string;
  discountPercent?: number;
};

type BranchDetails = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active?: boolean;
  is_main?: boolean;
};

export default function POS() {
  // ✅ ADDED setSelectedBranchId to allow auto-switching branches
  const { isDarkMode: isDark, businessProfile, selectedBranchId, setSelectedBranchId } = useApp();

  // State
  const [currentBranch, setCurrentBranch] = useState<BranchDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tab, setTab] = useState<'services' | 'products'>('services');
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [payMethod, setPayMethod] = useState('card');
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [branches, setBranches] = useState<BranchDetails[]>([]); // ✅ Added to store all branches for fallback search

  // Print state
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<RecentInvoice | null>(null);

  // ✅ FIX: Use ref to track if component is mounted to prevent race conditions
  const isMountedRef = useRef(true);

  // ✅ FIXED: Synchronous wrapper for useEffect dependency
  const loadBranchData = useCallback(async (branchId: string) => {
    if (!isMountedRef.current) return;

    setLoading(true);

    // 1. Fetch requested branch WITH active status
    const { data: requestedBranch } = await supabase
      .from('branches')
      .select('id, name, address, city, phone, is_active, is_main')
      .eq('id', branchId)
      .single();

    let activeBranchToUse: BranchDetails | null = requestedBranch as BranchDetails || null;

    // 2. SAFETY FALLBACK: If selected branch is inactive, switch to Main Branch
    if (requestedBranch && !requestedBranch.is_active) {
      console.warn("Selected branch is inactive. Switching receipt to Main Branch.");

      const { data: mainBranch } = await supabase
        .from('branches')
        .select('id, name, address, city, phone')
        .eq('is_main', true)
        .single();

      if (mainBranch) {
        activeBranchToUse = mainBranch as BranchDetails;
      } else {
        // Fallback 2: If no main branch flag, try Cotabato City
        const { data: cotabatoBranch } = await supabase
          .from('branches')
          .select('id, name, address, city, phone')
          .ilike('city', '%cotabato%')
          .single();

        if (cotabatoBranch) activeBranchToUse = cotabatoBranch as BranchDetails;
      }
    }

    if (isMountedRef.current) setCurrentBranch(activeBranchToUse);

    // 3. Use the ACTIVE branch ID for fetching services/products
    const actualBranchId = activeBranchToUse?.id || branchId;

    const [svcRes, prodRes, custRes, invRes] = await Promise.all([
      supabase.from('services').select('id, name, price, duration_minutes').eq('branch_id', actualBranchId).eq('is_active', true).order('name'),
      supabase.from('products').select('id, name, retail_price, current_stock').eq('branch_id', actualBranchId).eq('is_active', true).gt('current_stock', 0).order('name'),
      supabase.from('customers').select('id, full_name, loyalty_points').eq('branch_id', actualBranchId).eq('is_active', true).order('full_name'),
      supabase.from('invoices').select('id, invoice_number, total_amount, status, created_at, customers(full_name), subtotal, discount_amount, tax_amount, payment_method').eq('branch_id', actualBranchId).order('created_at', { ascending: false }).limit(8),
    ]);

    if (!isMountedRef.current) return;

    // ✅ Explicit typing instead of implicit any
    const invoicesWithItems = await Promise.all((invRes.data || []).map(async (inv: unknown) => {
      const typedInv = inv as Omit<RecentInvoice, 'items'>;
      const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', typedInv.id);
      return { ...typedInv, items: (items as InvoiceItemRow[]) || [] };
    }));

    setServices(svcRes.data || []);
    setProducts(prodRes.data || []);
    setCustomers(custRes.data || []);
    setRecentInvoices(invoicesWithItems || []);
    setLoading(false);
  }, []);

  // ✅ FIXED: Effect depends only on selectedBranchId (primitive value)
  useEffect(() => {
    isMountedRef.current = true;

    if (selectedBranchId) {
      loadBranchData(selectedBranchId);
    } else {
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [selectedBranchId, loadBranchData]);

  // ✅ NEW: Auto-switch if current branch becomes inactive
  useEffect(() => {
    if (currentBranch && !currentBranch.is_active && currentBranch.id === selectedBranchId) {
      console.log("Current branch deactivated. Finding active branch...");

      // Find first active branch or main branch from our local state
      const activeBranch = branches.find(b => b.is_active && b.is_main) ||
        branches.find(b => b.is_active);

      if (activeBranch && activeBranch.id !== selectedBranchId) {
        console.log(`Switching to ${activeBranch.name} (${activeBranch.city})`);
        setSelectedBranchId(activeBranch.id);
      }
    }
  }, [currentBranch, selectedBranchId, branches, setSelectedBranchId]);

  // ✅ Load all branches once on mount to enable auto-switch fallback
  useEffect(() => {
    const fetchAllBranches = async () => {
      const { data } = await supabase.from('branches').select('id, name, address, city, phone, is_active, is_main');
      if (data) setBranches(data as BranchDetails[]);
    };
    fetchAllBranches();
  }, []);

  function addItem(item: Omit<CartItem, 'qty'>) {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function removeItem(id: string) { setCart(prev => prev.filter(c => c.id !== id)); }
  function setQty(id: string, qty: number) {
    if (qty <= 0) removeItem(id);
    else setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const taxable = subtotal - discountAmt;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;

  async function checkout() {
    if (cart.length === 0 || !selectedBranchId) return;
    setProcessing(true);

    try {
      const invNumber = 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

      const { data: inv, error: invError } = await supabase.from('invoices').insert({
        branch_id: selectedBranchId,
        invoice_number: invNumber,
        customer_id: customerId || null,
        subtotal,
        discount_amount: discountAmt,
        tax_amount: tax,
        total_amount: total,
        paid_amount: total,
        status: 'paid',
        payment_method: payMethod,
      }).select().single();

      if (invError) throw invError;

      if (inv) {
        await supabase.from('invoice_items').insert(cart.map(c => ({
          invoice_id: inv.id,
          item_type: c.type,
          item_id: c.id,
          name: c.name,
          quantity: c.qty,
          unit_price: c.price,
          discount_amount: 0,
          total_price: c.price * c.qty,
        })));

        if (customerId) {
          const pts = Math.floor(total);
          await supabase.from('loyalty_points').insert({ customer_id: customerId, points: pts, type: 'earned', description: `Purchase ${invNumber}`, reference_id: inv.id });
          const cust = customers.find(c => c.id === customerId);
          if (cust) {
            await supabase.from('customers').update({
              loyalty_points: (cust.loyalty_points || 0) + pts,
              visit_count: (cust.loyalty_points >= 0 ? 1 : 0),
              last_visit_at: new Date().toISOString(),
            }).eq('id', customerId);
          }
        }

        setLastInvoice({
          ...inv,
          items: cart.map(c => ({
            id: '', item_type: c.type, item_id: c.id, name: c.name,
            quantity: c.qty, unit_price: c.price, total_price: c.price * c.qty
          })) as InvoiceItemRow[],
          customer: customers.find(c => c.id === customerId),
          discountPercent: discount,
          paymentMethod: payMethod,
        } as RecentInvoice);
      }

      setCart([]);
      setDiscount(0);
      setCustomerId('');
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setShowReceipt(true);
      }, 1500);

      // Reload data after successful checkout
      if (selectedBranchId) await loadBranchData(selectedBranchId);
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Transaction failed. Please check your connection and try again.");
    } finally {
      setProcessing(false);
    }
  }

  // ✅ THERMAL PRINT FUNCTION (Uses same dynamic branch data as modal)
  function handlePrint() {
    if (!lastInvoice) return;

    // ✅ Use currentBranch or fallback to Main Branch defaults
    const branchToUse = currentBranch || {
      address: businessProfile?.address || 'Sinsuat Ave. MBRH',
      city: 'Cotabato City',
      phone: businessProfile?.phone || '09772915449'
    };

    const currency = businessProfile?.currency || 'PHP';
    const branchAddressStr = `${branchToUse.address || ''}${branchToUse.city ? `, ${branchToUse.city}` : ''}`;
    const branchPhoneStr = branchToUse.phone || '';

    const itemsHtml = (lastInvoice.items || []).map(item => `
      <div style="margin-bottom: 4px;">
        <div style="display:flex; justify-content:space-between; font-weight:900; font-size:10pt; color:#000;">
          <span style="max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
          <span>${formatCurrencySimple(item.total_price, currency)}</span>
        </div>
        <div style="font-size:8pt; color:#000; margin-left:4px; font-weight:700;">
          ${item.quantity} x ${formatCurrencySimple(item.unit_price, currency)}
        </div>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body { 
              width: 58mm; margin: 0; padding: 3mm; 
              font-family: 'Courier New', monospace; font-size: 10pt; line-height: 1.3; 
              color: #000 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            }
            * { color: #000 !important; }
            .center { text-align: center; }
            .bold { font-weight: 900 !important; }
            .dashed { border-top: 2px dashed #000 !important; margin: 5px 0; }
            img.receipt-logo { max-width: 100%; height: auto; margin-bottom: 5px; filter: grayscale(100%) brightness(0) contrast(100%) !important; }
            .flex-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-weight: 700 !important; }
            @media print {
              body { visibility: hidden; }
              .receipt-content { visibility: visible; position: absolute; left: 0; top: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-content">
            <div class="center">
              <img src="${window.location.origin}/logo.png" alt="Logo" class="receipt-logo" />
              ${branchAddressStr ? `<div style="font-size:8pt; font-weight:700; color:#000;">${branchAddressStr}</div>` : ''}
              ${branchPhoneStr ? `<div style="font-size:8pt; font-weight:700; color:#000;">${branchPhoneStr}</div>` : ''}
            </div>
            <div class="dashed"></div>
            <div class="flex-row"><span>Receipt #</span><span class="bold">${lastInvoice.invoice_number}</span></div>
            <div class="flex-row"><span>Date</span><span>${new Date(lastInvoice.created_at).toLocaleDateString()}</span></div>
            <div class="flex-row"><span>Time</span><span>${new Date(lastInvoice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="flex-row"><span>Customer</span><span>${lastInvoice.customer?.full_name || 'Walk-in'}</span></div>
            <div class="flex-row"><span>Payment</span><span class="capitalize">${lastInvoice.paymentMethod || lastInvoice.payment_method}</span></div>
            <div class="dashed"></div>
            <div style="margin-bottom:5px;">${itemsHtml}</div>
            <div class="dashed"></div>
            <div class="flex-row"><span>Subtotal</span><span>${formatCurrencySimple(lastInvoice.subtotal, currency)}</span></div>
            ${lastInvoice.discount_amount > 0 ? `<div class="flex-row"><span>Discount</span><span>-${formatCurrencySimple(lastInvoice.discount_amount, currency)}</span></div>` : ''}
            <div class="flex-row"><span>Tax</span><span>${formatCurrencySimple(lastInvoice.tax_amount, currency)}</span></div>
            <div class="dashed"></div>
            <div class="flex-row bold" style="font-size:12pt; margin-top:5px;"><span>TOTAL</span><span>${formatCurrencySimple(lastInvoice.total_amount, currency)}</span></div>
            <div class="center" style="margin-top:10px;">
              <div style="font-size:14pt; letter-spacing:3px; opacity:1; color:#000;">||||| |||||</div>
              <div class="bold" style="margin-top:5px;">Thank you for your purchase!</div>
              <div style="font-size:8pt; font-weight:700;">Please come again</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute'; iframe.style.width = '0'; iframe.style.height = '0';
    iframe.style.border = 'none'; iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    iframe.contentDocument?.open();
    iframe.contentDocument?.write(htmlContent);
    iframe.contentDocument?.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 1000);
      }, 100);
    };
  }

  function closeReceipt() {
    setShowReceipt(false);
    setLastInvoice(null);
  }

  function openRecentReceipt(inv: RecentInvoice) {
    setLastInvoice({
      ...inv,
      customer: inv.customers,
      paymentMethod: inv.payment_method,
      discountPercent: inv.subtotal > 0 && inv.discount_amount > 0
        ? Math.round((inv.discount_amount / inv.subtotal) * 100)
        : 0
    });
    setShowReceipt(true);
  }

  const filteredServices = services.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const filteredProducts = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;

  return (
    <>
      <div className="flex flex-col xl:flex-row gap-5 h-full">
        {/* Left: catalog + recent */}
        <div className="flex-1 space-y-5 min-w-0">
          <div className={`${card} p-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex rounded-xl p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button onClick={() => setTab('services')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'services' ? 'bg-white text-gray-900 shadow-sm' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                  <span className="flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" />Services</span>
                </button>
                <button onClick={() => setTab('products')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'products' ? 'bg-white text-gray-900 shadow-sm' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" />Products</span>
                </button>
              </div>
              <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-200 bg-gray-50'}`}>
                <Search className="w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab}…`}
                  className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
                {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={`h-20 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}
              </div>
            ) : tab === 'services' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredServices.map(s => (
                  <button key={s.id} onClick={() => addItem({ id: s.id, name: s.name, price: s.price, type: 'service' })}
                    className={`p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-rose-50 hover:border-rose-200 border border-transparent'}`}>
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.duration_minutes}min</p>
                    <p className="text-rose-500 font-bold text-sm mt-1">{formatCurrencySimple(s.price, businessProfile?.currency)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addItem({ id: p.id, name: p.name, price: p.retail_price, type: 'product' })}
                    className={`p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-rose-50 border border-transparent hover:border-rose-200'}`}>
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stock: {p.current_stock}</p>
                    <p className="text-rose-500 font-bold text-sm mt-1">{formatCurrencySimple(p.retail_price, businessProfile?.currency)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={card}>
            <div className="p-4 border-b" style={{ borderColor: isDark ? '#374151' : '#f3f4f6' }}>
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Transactions</h3>
            </div>
            <div className="divide-y" style={{ borderColor: isDark ? '#374151' : '#f9fafb' }}>
              {recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-3 group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <CreditCard className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openRecentReceipt(inv)}>
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{inv.customers?.full_name || 'Walk-in'}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{inv.invoice_number} · {new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(Number(inv.total_amount), businessProfile?.currency)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{inv.status}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openRecentReceipt(inv); }}
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="View Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: cart */}
        <div className={`xl:w-80 flex-shrink-0 ${card} flex flex-col`}>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-rose-500" />
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Sale</h3>
              {cart.length > 0 && <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{cart.reduce((s, c) => s + c.qty, 0)}</span>}
            </div>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 text-gray-700'}`}>
              <option value="">Walk-in (no customer)</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.loyalty_points}pts)</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0" style={{ maxHeight: '300px' }}>
            {cart.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">Add services or products</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className={`flex items-center gap-2 p-2.5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatCurrencySimple(item.price, businessProfile?.currency)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQty(item.id, item.qty - 1)} className={`w-6 h-6 rounded-lg text-sm font-bold flex items-center justify-center ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600 shadow-sm'}`}>−</button>
                  <span className={`text-xs font-bold w-5 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.qty}</span>
                  <button onClick={() => setQty(item.id, item.qty + 1)} className={`w-6 h-6 rounded-lg text-sm font-bold flex items-center justify-center ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600 shadow-sm'}`}>+</button>
                </div>
                <p className={`text-xs font-bold w-12 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(item.price * item.qty, businessProfile?.currency)}</p>
                <button onClick={() => removeItem(item.id)} className="text-red-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          <div className={`p-4 border-t space-y-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Discount (%)</label>
              <input type="number" min={0} max={100} value={discount} onChange={e => setDiscount(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Subtotal', val: formatCurrencySimple(subtotal, businessProfile?.currency) },
                { label: `Discount (${discount}%)`, val: `-${formatCurrencySimple(discountAmt, businessProfile?.currency)}` },
                { label: `Tax (${(TAX_RATE * 100).toFixed(0)}%)`, val: formatCurrencySimple(tax, businessProfile?.currency) },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-xs">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{r.label}</span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{r.val}</span>
                </div>
              ))}
              <div className={`flex justify-between font-bold text-sm pt-1.5 border-t ${isDark ? 'border-gray-700 text-white' : 'border-gray-100 text-gray-900'}`}>
                <span>Total</span>
                <span>{formatCurrencySimple(total, businessProfile?.currency)}</span>
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Payment Method</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['card', 'cash', 'transfer'].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all ${payMethod === m ? 'bg-rose-500 text-white' : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={checkout} disabled={cart.length === 0 || processing || !selectedBranchId}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${success ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:opacity-90'} disabled:opacity-50`}>
              {success ? <><Check className="w-4 h-4" />Payment Complete!</> : processing ? 'Processing…' : <><DollarSign className="w-4 h-4" />Charge {formatCurrencySimple(total, businessProfile?.currency)}</>}
            </button>
            {cart.length > 0 && <button onClick={() => setCart([])} className={`w-full text-xs ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>Clear cart</button>}
          </div>
        </div>
      </div>

      {/* ✅ REPLACED INLINE MODAL WITH RECEIPT PREVIEW COMPONENT */}
      <ReceiptPreview
        isOpen={showReceipt}
        onClose={closeReceipt}
        onPrint={handlePrint}
        data={lastInvoice ? {
          receiptNo: lastInvoice.invoice_number,
          date: new Date(lastInvoice.created_at).toLocaleDateString(),
          time: new Date(lastInvoice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          customer: lastInvoice.customer?.full_name || 'Walk-in',
          paymentMethod: lastInvoice.paymentMethod || lastInvoice.payment_method,
          items: lastInvoice.items.map(item => ({
            name: item.name,
            qty: item.quantity,
            price: item.unit_price,
            total: item.total_price,
          })),
          subtotal: lastInvoice.subtotal,
          tax: lastInvoice.tax_amount,
          total: lastInvoice.total_amount,
          // ✅ DYNAMIC BRANCH DATA PASSED TO COMPONENT
          branchAddress: currentBranch?.address && currentBranch.city
            ? `${currentBranch.address}, ${currentBranch.city}`
            : businessProfile?.address || 'Sinsuat Ave. MBRH, Cotabato City',
          branchPhone: currentBranch?.phone || businessProfile?.phone || '09772915449',
        } : undefined}
      />
    </>
  );
}