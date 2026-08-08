import React, { useState, useEffect } from 'react';
import {
  fetchServices,
  createServiceApi,
  updateServiceApi,
  toggleServiceStatusApi,
  deleteServiceApi,
  fetchSettings,
} from '../services/api';
import { Service, Setting } from '../types';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  WashingMachine,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 50,
    unit: 'piece',
    estimatedHours: 24,
    description: '',
    isActive: true,
  });

  const loadData = async () => {
    try {
      const [servRes, setRes] = await Promise.all([fetchServices(), fetchSettings()]);
      if (servRes.success) setServices(servRes.services);
      if (setRes.success) setSetting(setRes.setting);
    } catch (err) {
      console.error('Failed to load services', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currencySymbol = setting?.currencySymbol || '₹';

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({ name: '', price: 50, unit: 'piece', estimatedHours: 24, description: '', isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (s: Service) => {
    setEditingService(s);
    setFormData({
      name: s.name,
      price: s.price,
      unit: s.unit || 'piece',
      estimatedHours: s.estimatedHours || 24,
      description: s.description || '',
      isActive: s.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateServiceApi(editingService._id, formData);
      } else {
        await createServiceApi(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save service');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleServiceStatusApi(id);
      loadData();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const [deleteServId, setDeleteServId] = useState<string | null>(null);

  const confirmDeleteService = async () => {
    if (!deleteServId) return;
    try {
      await deleteServiceApi(deleteServId);
      loadData();
    } catch (err) {
      console.error('Failed to delete service', err);
    } finally {
      setDeleteServId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <WashingMachine className="w-6 h-6 text-brand-600" /> Laundry Services
          </h1>
          <p className="hidden sm:block text-xs text-slate-500">
            Configure offered laundry processes, rates & turnaround times
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Service</span>
        </button>
      </div>

      {/* Services Row-by-Row Table List View */}
      <div className="glass-card overflow-hidden">
        {services.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No laundry services configured. Click "New Service" to add one.
          </div>
        ) : (
          <div>
            {/* Desktop / Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-12">#</th>
                    <th className="py-3.5 px-4">Service Name & Description</th>
                    <th className="py-3.5 px-4">Rate & Unit</th>
                    <th className="py-3.5 px-4">Turnaround Time</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {services.map((serv, idx) => (
                    <tr
                      key={serv._id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                        !serv.isActive ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-4 px-4">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {serv.name}
                        </h3>
                        {serv.description && (
                          <p className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-1">
                            {serv.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-black text-sm text-brand-600 dark:text-brand-400">
                          {currencySymbol}{serv.price}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 ml-1">
                          / {serv.unit}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          ~{serv.estimatedHours} Hours
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(serv._id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 transition-all ${
                            serv.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          }`}
                        >
                          {serv.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{serv.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(serv)}
                            title="Edit Service"
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-600 hover:text-white transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteServId(serv._id)}
                            title="Delete Service"
                            className="p-1.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Row View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {services.map((serv, idx) => (
                <div
                  key={serv._id}
                  className={`p-4 space-y-2.5 ${!serv.isActive ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-400">#{idx + 1}</span>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {serv.name}
                        </h3>
                      </div>
                      {serv.description && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {serv.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-brand-600 dark:text-brand-400">
                        {currencySymbol}{serv.price}
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">/{serv.unit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5" /> ~{serv.estimatedHours} Hours
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(serv._id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          serv.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {serv.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{serv.isActive ? 'Active' : 'Inactive'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(serv)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteServId(serv._id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Steam Ironing"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pricing Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="piece">Per Piece</option>
                    <option value="kg">Per Kg</option>
                    <option value="pair">Per Pair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Turnaround (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief service process details..."
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
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteServId}
        title="Delete Service Category"
        message="Are you sure you want to delete this service category?"
        confirmText="Delete Service"
        variant="danger"
        onConfirm={confirmDeleteService}
        onCancel={() => setDeleteServId(null)}
      />
    </div>
  );
};
