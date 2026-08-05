import React, { useState, useEffect } from 'react';
import {
  fetchItems,
  createItemApi,
  updateItemApi,
  deleteItemApi,
  fetchSettings,
} from '../services/api';
import { LaundryItem, Setting } from '../types';
import { Shirt, Plus, Edit, Trash2, X, Tag } from 'lucide-react';

export const ItemsPage: React.FC = () => {
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LaundryItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    defaultPrice: 40,
    category: 'Clothes',
    icon: 'Shirt',
    isActive: true,
  });

  const loadData = async () => {
    try {
      const [itemRes, setRes] = await Promise.all([fetchItems(), fetchSettings()]);
      if (itemRes.success) setItems(itemRes.items);
      if (setRes.success) setSetting(setRes.setting);
    } catch (err) {
      console.error('Failed to load laundry items', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currencySymbol = setting?.currencySymbol || '₹';

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', defaultPrice: 40, category: 'Clothes', icon: 'Shirt', isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (item: LaundryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      defaultPrice: item.defaultPrice,
      category: item.category,
      icon: item.icon || 'Shirt',
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateItemApi(editingItem._id, formData);
      } else {
        await createItemApi(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save laundry item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this clothing item?')) return;
    try {
      await deleteItemApi(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const categories = ['Clothes', 'Household', 'Dry Clean', 'Footwear', 'Others'];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shirt className="w-6 h-6 text-brand-600" /> Clothing & Item Categories
          </h1>
          <p className="text-xs text-slate-500">
            Manage garment types, default price lists & category groupings
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Laundry Item</span>
        </button>
      </div>

      {/* Items Table & Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item._id}
            className="glass-card p-5 space-y-3 flex items-center justify-between hover:border-brand-500 transition-all"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900">
                {item.category}
              </span>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Default Rate: <span className="text-slate-900 dark:text-white font-bold">{currencySymbol}{item.defaultPrice}</span>
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingItem ? 'Edit Laundry Item' : 'Add New Laundry Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Saree (Silk) or Leather Jacket"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Base Price ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-md"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
