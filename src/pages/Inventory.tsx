import { useEffect, useState, useCallback, useRef } from 'react';
import { Package, Plus, Search, X, Check, Edit2, AlertCircle, Trash2, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

// --- Type Definitions ---
type Product = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  cost_price: number;
  retail_price: number;
  current_stock: number;
  min_stock_level: number;
  unit: string;
  supplier: string | null;
  is_active: boolean;
  category_id: string | null;
  product_categories: { name: string } | null;
};

type Category = { id: string; name: string };

const EMPTY_PRODUCT = {
  name: '', sku: '', description: '', cost_price: 0, retail_price: 0,
  current_stock: 0, min_stock_level: 5, unit: 'unit', supplier: '', category_id: '',
};

export default function Inventory() {
  const { isDarkMode: isDark, selectedBranchId, businessProfile } = useApp();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [saving, setSaving] = useState(false);
  
  // Stock Adjustment State
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  
  // Category Management State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{ name: string }>({ name: '' });
  const [categorySaving, setCategorySaving] = useState(false);
  const [showInlineCategory, setShowInlineCategory] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [inlineCreating, setInlineCreating] = useState(false);
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  // Toast State (Fixed: Added setter to avoid unused variable error)
  const [toast, setToast] = useState<{ message: string; kind?: 'error' | 'success' } | null>(null);

  const load = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*, product_categories(name)').eq('branch_id', selectedBranchId).eq('is_active', true).order('name'),
        supabase.from('product_categories').select('id, name').eq('is_active', true).order('name'),
      ]);
      
      // Fixed: Explicitly cast Supabase response to our types to avoid 'unknown' errors
      setProducts((prodRes.data as Product[]) || []);
      setCategories((catRes.data as Category[]) || []);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setToast({ message: "Failed to load data", kind: "error" });
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => { load(); }, [load]);

  // Auto-focus inline category input
  useEffect(() => {
    if (showInlineCategory) inlineInputRef.current?.focus();
  }, [showInlineCategory]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    
    const payload = {
      branch_id: selectedBranchId,
      name: form.name,
      sku: form.sku || null,
      description: form.description || null,
      cost_price: Number(form.cost_price),
      retail_price: Number(form.retail_price),
      current_stock: Number(form.current_stock),
      min_stock_level: Number(form.min_stock_level),
      unit: form.unit,
      supplier: form.supplier || null,
      category_id: form.category_id || null,
      is_active: true,
    };

    try {
      if (editing) {
        await supabase.from('products').update(payload).eq('id', editing);
      } else {
        await supabase.from('products').insert(payload);
      }
      setShowModal(false); 
      setEditing(null); 
      setForm({ ...EMPTY_PRODUCT });
      await load();
      setToast({ message: editing ? 'Product updated' : 'Product added', kind: 'success' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setToast({ message: "Failed to save product", kind: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function adjustStock() {
    if (!adjustId) return;
    const prod = products.find(p => p.id === adjustId);
    if (!prod) return;
    
    const newStock = Math.max(0, prod.current_stock + adjustQty);
    try {
      await supabase.from('products').update({ current_stock: newStock }).eq('id', adjustId);
      setToast({ message: `Stock adjusted to ${newStock}`, kind: 'success' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setToast({ message: "Failed to update stock", kind: "error" });
    } finally {
      setAdjustId(null); 
      setAdjustQty(0);
      await load();
    }
  }

  async function deactivate(id: string) {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      await supabase.from('products').update({ is_active: false }).eq('id', id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setToast({ message: 'Product removed', kind: 'success' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setToast({ message: "Failed to remove product", kind: "error" });
    }
  }

  async function createCategory(name?: string) {
    const catName = (name || categoryForm.name || '').trim();
    if (!catName) return null;
    
    // Duplicate check
    if (categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
      setToast({ message: 'Category already exists', kind: 'error' });
      return null;
    }
    
    setCategorySaving(true);
    try {
      const { data } = await supabase
        .from('product_categories')
        .insert({ name: catName, is_active: true })
        .select('id, name')
        .single();
        
      setShowCategoryModal(false);
      setCategoryForm({ name: '' });
      await load();
      setToast({ message: 'Category created', kind: 'success' });
      return data?.id ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setToast({ message: "Failed to create category", kind: "error" });
      return null;
    } finally {
      setCategorySaving(false);
    }
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name, sku: p.sku || '', description: p.description || '',
      cost_price: p.cost_price, retail_price: p.retail_price,
      current_stock: p.current_stock, min_stock_level: p.min_stock_level,
      unit: p.unit, supplier: p.supplier || '', category_id: p.category_id || '',
    });
    setEditing(p.id); 
    setShowModal(true);
  }

  const lowStockCount = products.filter(p => p.current_stock <= p.min_stock_level).length;
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    const matchCat = filterCat === 'all' || p.category_id === filterCat;
    return matchSearch && matchCat;
  });

  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900'}`;

  return (
    <div className="space-y-5 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          toast.kind === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toast.kind === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, SKU…"
            className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200 text-gray-700'}`}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setShowCategoryModal(true)} title="Create category" className={`px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200 text-gray-700'}`}>
          <Tag className="w-4 h-4 inline-block mr-2" /> Category
        </button>
        <button onClick={() => { setForm({ ...EMPTY_PRODUCT }); setEditing(null); setShowModal(true); }}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats Cards - Fixed: Explicit typing to prevent ReactNode errors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', val: products.length.toString(), warn: false },
          { label: 'Low Stock', val: lowStockCount.toString(), warn: lowStockCount > 0 },
          { label: 'Stock Value', val: formatCurrencySimple(products.reduce((s, p) => s + Number(p.retail_price) * p.current_stock, 0), businessProfile?.currency), warn: false },
          { label: 'Total Items', val: products.reduce((s, p) => s + p.current_stock, 0).toString(), warn: false },
        ].map(s => (
          <div key={s.label} className={`${card} p-4 text-center`}>
            <p className={`text-xl font-bold ${s.warn ? 'text-amber-500' : (isDark ? 'text-white' : 'text-gray-900')}`}>{s.val}</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Products Table */}
      <div className={card}>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3,4].map(i => <div key={i} className={`h-14 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />)}</div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'} text-xs font-semibold uppercase tracking-wide`}>
                  {['Product', 'Category', 'Cost', 'Retail', 'Stock', 'Min', 'Supplier', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left first:rounded-tl-2xl last:rounded-tr-2xl">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: isDark ? '#374151' : '#f3f4f6' }}>
                {filtered.map(p => {
                  const lowStock = p.current_stock <= p.min_stock_level;
                  return (
                    <tr key={p.id} className={`${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                        {p.sku && <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.sku}</p>}
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{p.product_categories?.name || '—'}</td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatCurrencySimple(Number(p.cost_price), businessProfile?.currency)}</td>
                      <td className={`px-4 py-3 text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(Number(p.retail_price), businessProfile?.currency)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {lowStock && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                          <span className={`text-xs font-bold ${lowStock ? 'text-amber-500' : (isDark ? 'text-white' : 'text-gray-900')}`}>{p.current_stock}</span>
                          <button onClick={() => { setAdjustId(p.id); setAdjustQty(0); }}
                            className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>±</button>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{p.min_stock_level}</td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{p.supplier || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deactivate(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Dialog */}
      {adjustId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xs rounded-2xl shadow-2xl p-6 space-y-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Adjust Stock</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{products.find(p => p.id === adjustId)?.name}</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Current: {products.find(p => p.id === adjustId)?.current_stock} → New: {Math.max(0, (products.find(p => p.id === adjustId)?.current_stock || 0) + adjustQty)}</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setAdjustQty(q => q - 1)} className={`w-10 h-10 rounded-xl font-bold text-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}>−</button>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))}
                className={`flex-1 text-center px-3 py-2 rounded-xl border text-sm font-bold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
              <button onClick={() => setAdjustQty(q => q + 1)} className={`w-10 h-10 rounded-xl font-bold text-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}>+</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAdjustId(null)} className={`flex-1 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={adjustStock} className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={input} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>SKU</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className={input}>
                    <option value="">Uncategorized</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="mt-2">
                    {!showInlineCategory ? (
                      <button type="button" onClick={() => setShowInlineCategory(true)} className="text-xs text-rose-600 hover:underline">+ Add category</button>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <input ref={inlineInputRef} value={inlineCategoryName} onChange={e => setInlineCategoryName(e.target.value)} placeholder="New category name" className={`px-2 py-1 rounded-xl text-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`} />
                        <button type="button" onClick={async () => {
                          if (!inlineCategoryName.trim()) return;
                          setInlineCreating(true);
                          const newId = await createCategory(inlineCategoryName.trim());
                          setInlineCreating(false);
                          setInlineCategoryName(''); setShowInlineCategory(false);
                          if (newId) setForm(f => ({ ...f, category_id: newId }));
                        }} disabled={inlineCreating} className="px-3 py-1 rounded-xl bg-rose-500 text-white text-sm">{inlineCreating ? 'Adding…' : 'Add'}</button>
                        <button type="button" onClick={() => { setShowInlineCategory(false); setInlineCategoryName(''); }} className="text-xs text-gray-500">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Cost Price ({businessProfile?.currency || 'PHP'})</label>
                  <input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: Number(e.target.value) }))} className={input} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Retail Price ({businessProfile?.currency || 'PHP'})</label>
                  <input type="number" value={form.retail_price} onChange={e => setForm(f => ({ ...f, retail_price: Number(e.target.value) }))} className={input} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Stock</label>
                  <input type="number" value={form.current_stock} onChange={e => setForm(f => ({ ...f, current_stock: Number(e.target.value) }))} className={input} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Min Stock</label>
                  <input type="number" value={form.min_stock_level} onChange={e => setForm(f => ({ ...f, min_stock_level: Number(e.target.value) }))} className={input} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Unit</label>
                  <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={input} />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Supplier</label>
                <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className={input} />
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                <Check className="w-4 h-4" /> {editing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Category</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Add a new product category.</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className={`p-2 rounded-xl ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Name</label>
                <input value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} className={input} />
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowCategoryModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={() => createCategory()} disabled={categorySaving || !categoryForm.name.trim()} className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold disabled:opacity-50">{categorySaving ? 'Saving…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}