import React, { useState, useEffect } from 'react';
import {
  fetchCustomers,
  createCustomerApi,
  updateCustomerApi,
  deleteCustomerApi,
  fetchCustomerById,
  fetchSettings,
} from '../services/api';
import { Customer, Order, Setting } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Mail,
  History,
  X,
  CheckCircle,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    email: '',
    notes: '',
  });

  // History Drawer State
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const [custRes, setRes] = await Promise.all([
        fetchCustomers(search),
        fetchSettings(),
      ]);
      if (custRes.success) setCustomers(custRes.customers);
      if (setRes.success) setSetting(setRes.setting);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const currencySymbol = setting?.currencySymbol || '₹';

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', mobile: '', address: '', email: '', notes: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      mobile: cust.mobile,
      address: cust.address,
      email: cust.email || '',
      notes: cust.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomerApi(editingCustomer._id, formData);
      } else {
        await createCustomerApi(formData);
      }
      setShowModal(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await deleteCustomerApi(id);
      if (res.success) {
        loadCustomers();
      }
    } catch (err: any) {
      alert(err.message || 'Could not delete customer');
    }
  };

  const handleViewHistory = async (cust: Customer) => {
    setHistoryCustomer(cust);
    try {
      const res = await fetchCustomerById(cust._id);
      if (res.success) {
        setCustomerOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Failed to load customer order history', err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" /> Customer Management
          </h1>
          <p className="text-xs text-slate-500">
            View customer details, order statistics & add new profiles
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-card p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, mobile or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((cust) => (
          <div
            key={cust._id}
            className="glass-card p-5 space-y-4 flex flex-col justify-between hover:border-brand-500 transition-all"
          >
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {cust.name}
                  </h3>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5" /> +91 {cust.mobile}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(cust)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cust._id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <p className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{cust.address}</span>
                </p>
                {cust.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cust.email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs">
                <p className="text-slate-400 font-medium">Orders</p>
                <p className="font-bold text-slate-900 dark:text-white">{cust.totalOrders || 0}</p>
              </div>

              <div className="text-xs text-right">
                <p className="text-slate-400 font-medium">Total Spent</p>
                <p className="font-black text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{cust.totalSpent || 0}
                </p>
              </div>

              <button
                onClick={() => handleViewHistory(cust)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <History className="w-3.5 h-3.5" /> History
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street / Apartment address"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@domain.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Regular customer, prefers starch"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Order History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {historyCustomer.name} - Order History
                </h3>
                <p className="text-xs text-slate-500">Mobile: +91 {historyCustomer.mobile}</p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {customerOrders.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">No order history found for this customer.</p>
              ) : (
                customerOrders.map((ord) => (
                  <div
                    key={ord._id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">#{ord.orderNumber}</p>
                      <p className="text-[11px] text-slate-400">
                        Date: {new Date(ord.orderDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={ord.status} size="sm" />
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900 dark:text-white">{currencySymbol}{ord.totalAmount}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">{ord.paymentStatus}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
