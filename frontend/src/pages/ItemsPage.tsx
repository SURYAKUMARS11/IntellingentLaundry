import React, { useState, useEffect } from 'react';
import {
  fetchItems,
  createItemApi,
  updateItemApi,
  deleteItemApi,
  fetchSettings,
} from '../services/api';
import { LaundryItem, Setting } from '../types';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { getItemPriceForService, mainServicesList, posGroupCatalog } from '../data/posCatalogData';
import { Shirt, Plus, Edit, Trash2, X, Tag, Search, Sparkles, Check } from 'lucide-react';

export const ItemsPage: React.FC = () => {
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LaundryItem | null>(null);

  // Active Service Category Filter (Default: 'Wash and Fold')
  const [selectedService, setSelectedService] = useState<string>('Wash and Fold');

  // Active Garment Category Filter (Default: 'All')
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    defaultPrice: 15,
    category: 'Regular',
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
    setFormData({ name: '', defaultPrice: 15, category: 'Regular', icon: 'Shirt', isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (item: LaundryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      defaultPrice: item.defaultPrice,
      category: item.category || 'Regular',
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

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const confirmDeleteItem = async () => {
    if (!deleteItemId) return;
    try {
      await deleteItemApi(deleteItemId);
      loadData();
    } catch (err) {
      console.error('Failed to delete item', err);
    } finally {
      setDeleteItemId(null);
    }
  };

  const categories = ['All', 'Regular', 'Men', 'Women', 'Kids', 'Household', 'Others'];

  // Build exact catalog item order map matching New Order page sequence
  const catalogOrderIds: string[] = [];
  const catalogOrderNames: string[] = [];

  posGroupCatalog.forEach((group) => {
    group.subCategories.forEach((sub) => {
      sub.items.forEach((item) => {
        catalogOrderIds.push(item.id);
        catalogOrderNames.push(item.name.toLowerCase());
      });
    });
  });

  const getItemRank = (item: LaundryItem) => {
    const idIndex = catalogOrderIds.indexOf(item._id);
    if (idIndex !== -1) return idIndex;
    const nameIndex = catalogOrderNames.indexOf(item.name.toLowerCase());
    if (nameIndex !== -1) return nameIndex;
    return 9999;
  };

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => getItemRank(a) - getItemRank(b));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shirt className="w-6 h-6 text-brand-600" /> Clothing & Item Price Catalog
          </h1>
          <p className="hidden sm:block text-xs text-slate-500">
            Select service & garment category to view and edit service-specific prices ({items.length} items catalog)
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

      {/* SERVICE CATEGORIES FILTER BAR AT TOP */}
      <div className="glass-card p-4 space-y-2">
        <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Select Service Category for Price Lookup
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-1.5">
          {mainServicesList.map((sName) => {
            const active = selectedService === sName;
            return (
              <button
                key={sName}
                type="button"
                onClick={() => setSelectedService(sName)}
                className={`px-2.5 py-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 text-center truncate ${
                  active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {active && <Check className="w-3 h-3 shrink-0" />}
                <span className="truncate">{sName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH & GARMENT CATEGORY FILTER BAR */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search garment item by name (e.g. Shirt, Blazer, Saree, Hoodie)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div className="text-xs font-bold text-slate-500 shrink-0">
            Active Service: <span className="text-brand-600 dark:text-brand-400 font-black">{selectedService}</span> ({filteredItems.length} items)
          </div>
        </div>

        {/* Garment Category Pills */}
        <div>
          <span className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
            Garment Category Groups
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="glass-card p-8 text-center text-xs text-slate-500">
          No garment items found matching your search or category filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const activeServicePrice = getItemPriceForService(
              { name: item.name, price: item.defaultPrice, category: item.category },
              selectedService
            );
            return (
              <div
                key={item._id}
                className="glass-card p-5 space-y-3 flex items-center justify-between hover:border-brand-500 transition-all group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900">
                      {item.category || 'Regular'}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400">
                      {selectedService}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5">
                    {item.name}
                  </h3>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Service Price:</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {currencySymbol}{activeServicePrice}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Item & Pricing"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-600 hover:text-white transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteItemId(item._id)}
                    title="Delete Item"
                    className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingItem ? 'Edit Laundry Item & Base Rate' : 'Add New Laundry Item'}
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
                  Garment Category Group *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold"
                >
                  {categories.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Base Wash & Fold Price ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold text-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Updating base price scales all 11 service prices (Ironing, Dry Cleaning, Laundry, etc.) proportionally.
                </p>
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

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteItemId}
        title="Delete Garment Item"
        message="Are you sure you want to delete this clothing item?"
        confirmText="Delete Item"
        variant="danger"
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteItemId(null)}
      />
    </div>
  );
};
