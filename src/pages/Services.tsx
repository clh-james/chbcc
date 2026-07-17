import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, X, Edit2, Trash2, ClipboardList, DollarSign, Clock, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { formatCurrencySimple } from '../lib/currency';

type ServiceCategory = {
  id: string;
  name: string;
  color?: string;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  duration_minutes: number;
  price: number;
  commission_rate: number;
  is_active: boolean;
};

const EMPTY: Partial<Service> = {
  name: '',
  description: '',
  category_id: null,
  duration_minutes: 60,
  price: 0,
  commission_rate: 0,
  is_active: true,
};

export default function Services() {
  const { isDarkMode: isDark, selectedBranchId, businessProfile } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Service>>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{ name: string; color?: string }>({ name: '', color: '#ec4899' });
  const [categorySaving, setCategorySaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [svcRes, catRes] = await Promise.all([
      supabase
        .from('services')
        .select('id, name, description, duration_minutes, price, commission_rate, is_active, category_id')
        .eq('branch_id', selectedBranchId)
        .order('name'),
      supabase
        .from('service_categories')
        .select('id, name, color')
        .eq('is_active', true)
        .order('name'),
    ]);

    setServices((svcRes.data as Service[]) || []);
    setCategories((catRes.data as ServiceCategory[]) || []);
    setLoading(false);
  }, [selectedBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function save() {
    if (!form.name?.trim()) return;
    setSaving(true);

    const payload = {
      branch_id: selectedBranchId,
      name: form.name?.trim(),
      description: form.description || null,
      category_id: form.category_id || null,
      duration_minutes: Number(form.duration_minutes) || 60,
      price: Number(form.price) || 0,
      commission_rate: Number(form.commission_rate) || 0,
      is_active: form.is_active ?? true,
    };

    if (editing) {
      await supabase.from('services').update(payload).eq('id', editing);
    } else {
      await supabase.from('services').insert(payload);
    }

    setShowModal(false);
    setEditing(null);
    setForm({ ...EMPTY });
    await loadData();
    setSaving(false);
  }

  async function createCategory() {
    if (!categoryForm.name.trim()) return;
    setCategorySaving(true);
    await supabase.from('service_categories').insert({ name: categoryForm.name.trim(), color: categoryForm.color || '#ec4899', is_active: true });
    setCategorySaving(false);
    setShowCategoryModal(false);
    setCategoryForm({ name: '', color: '#ec4899' });
    await loadData();
  }

  async function deactivate(id: string) {
    if (!confirm('Are you sure you want to remove this service?')) return;
    await supabase.from('services').update({ is_active: false }).eq('id', id);
    setServices(prev => prev.filter(service => service.id !== id));
  }

  function openEdit(service: Service) {
    setForm({
      id: service.id,
      name: service.name,
      description: service.description,
      category_id: service.category_id,
      duration_minutes: service.duration_minutes,
      price: service.price,
      commission_rate: service.commission_rate,
      is_active: service.is_active,
    });
    setEditing(service.id);
    setShowModal(true);
  }

  const filteredServices = services.filter(service => {
    const query = search.toLowerCase().trim();
    const matchesText = !query || service.name.toLowerCase().includes(query) || (service.description?.toLowerCase().includes(query) ?? false);
    const matchesCategory = filterCategory === 'all' || service.category_id === filterCategory;
    return matchesText && matchesCategory;
  });

  const activeCount = services.filter(service => service.is_active).length;
  const avgPrice = services.length ? services.reduce((sum, service) => sum + Number(service.price), 0) / services.length : 0;

  const card = `rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex items-center gap-2 flex-1 max-w-xl px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services…"
            className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200 text-gray-700'}`}>
          <option value="all">All categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowCategoryModal(true)}
          title="Create category"
          className={`px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-200 text-gray-700'}`}
        >
          <Tag className="w-4 h-4 inline-block mr-2" /> Category
        </button>

        <button
          onClick={() => { setShowModal(true); setEditing(null); setForm({ ...EMPTY }); }}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Services', value: services.length },
          { label: 'Active', value: activeCount },
          { label: 'Avg Price', value: formatCurrencySimple(avgPrice, businessProfile?.currency) },
          { label: 'Categories', value: categories.length },
        ].map(item => (
          <div key={item.label} className={`${card} p-4 text-center`}>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</p>
          </div>
        ))}
      </div>

      <div className={card}>
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(index => (
              <div key={index} className={`h-14 rounded-xl animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <ClipboardList className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm font-medium">No services found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className={`${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'} text-xs font-semibold uppercase tracking-wide`}>
                  {['Service', 'Category', 'Duration', 'Price', 'Commission', 'Status', 'Actions'].map(header => (
                    <th key={header} className="px-4 py-3 text-left">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: isDark ? '#374151' : '#f3f4f6' }}>
                {filteredServices.map(service => {
                  const categoryName = categories.find(category => category.id === service.category_id)?.name || 'Uncategorized';
                  const isInactive = !service.is_active;
                  return (
                    <tr key={service.id} className={`${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-sm text-ellipsis overflow-hidden whitespace-nowrap" style={{ maxWidth: '260px' }}>{service.name}</div>
                        {service.description && <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{service.description}</div>}
                      </td>
                      <td className={`px-4 py-4 text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{categoryName}</td>
                      <td className={`px-4 py-4 text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{service.duration_minutes} min</td>
                      <td className={`px-4 py-4 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrencySimple(service.price, businessProfile?.currency)}</td>
                      <td className={`px-4 py-4 text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{service.commission_rate}%</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-semibold ${isInactive ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          <span>{isInactive ? 'Inactive' : 'Active'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right space-x-2">
                        <button onClick={() => openEdit(service)} className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deactivate(service.id)} className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editing ? 'Edit Service' : 'Add Service'}</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage salon service offerings and rates.</p>
              </div>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-xl ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Service Name</label>
                  <input
                    value={form.name || ''}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className={input}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Category</label>
                  <select
                    value={form.category_id || ''}
                    onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value || null }))}
                    className={input}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className={`${input} resize-none`}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Duration (minutes)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={form.duration_minutes ?? 60}
                      onChange={e => setForm(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                      className={input}
                    />
                    <Clock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Price</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price ?? 0}
                      onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className={input}
                    />
                    <DollarSign className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Commission (%)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.commission_rate ?? 0}
                    onChange={e => setForm(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                    className={input}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  id="service-active"
                  className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="service-active" className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Active service
                </label>
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name?.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Category</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Add a new service category.</p>
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
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Color</label>
                <input type="color" value={categoryForm.color} onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))} className="w-16 h-10 p-0 border-0" />
              </div>
            </div>
            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowCategoryModal(false)} className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={createCategory} disabled={categorySaving || !categoryForm.name.trim()} className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold disabled:opacity-50">{categorySaving ? 'Saving…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
