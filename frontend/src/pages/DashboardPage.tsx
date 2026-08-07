import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchDashboardStats,
  fetchSettings,
  updateOrderStatusApi,
} from '../services/api';
import { DashboardStats, Order, OrderStatus, Setting } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { InvoiceView } from '../components/invoice/InvoiceView';
import { PaymentModal } from '../components/orders/PaymentModal';
import {
  ShoppingBag,
  Clock,
  WashingMachine,
  CheckCircle,
  PackageCheck,
  DollarSign,
  TrendingUp,
  Users,
  PlusCircle,
  UserPlus,
  ArrowRight,
  BellRing,
  RefreshCw,
  Filter,
  X,
  CreditCard,
  Printer,
  Smartphone,
  Edit,
  Eye,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingReminders, setPendingReminders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [preset, setPreset] = useState<string>('today');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [dateType, setDateType] = useState<string>('orderDate');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, setRes] = await Promise.all([
        fetchDashboardStats({
          preset,
          paymentStatus,
          status: orderStatus,
          dateType,
          dateFrom,
          dateTo,
        }),
        fetchSettings(),
      ]);

      if (dashRes.success) {
        setStats(dashRes.stats);
        setPendingReminders(dashRes.pendingReminders || []);
        setRecentOrders(dashRes.recentOrders || []);
      }
      if (setRes.success) {
        setSetting(setRes.setting);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preset, paymentStatus, orderStatus, dateType, dateFrom, dateTo]);

  const currencySymbol = setting?.currencySymbol || '₹';

  const handleQuickStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusApi(orderId, newStatus);
      loadData();
    } catch (err) {
      console.error('Failed to bump status:', err);
    }
  };

  const handlePresetSelect = (p: string) => {
    setPreset(p);
    setDateFrom('');
    setDateTo('');
  };

  const handleClearFilters = () => {
    setPreset('');
    setPaymentStatus('');
    setOrderStatus('');
    setDateType('orderDate');
    setDateFrom('');
    setDateTo('');
  };

  const handleWhatsAppShare = (ord: Order) => {
    const mobile = ord.customerSnapshot.mobile.replace(/\D/g, '');
    const text = `Hello ${ord.customerSnapshot.name}, your laundry order #${ord.orderNumber} status: ${ord.status}.\nTotal: ${currencySymbol}${ord.totalAmount}\nAdvance Paid: ${currencySymbol}${ord.advancePaid}\nRemaining Balance: ${currencySymbol}${ord.remainingBalance}\nExpected Delivery: ${new Date(ord.expectedDeliveryDate).toLocaleDateString('en-GB')}.\nThank you for choosing ${setting?.shopName || 'IntelligentLaundry'}!`;
    const url = `https://wa.me/${mobile.length === 10 ? '91' + mobile : mobile}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Combine pending reminders and recent orders into a single unique array
  const combinedOrdersMap = new Map<string, Order>();
  pendingReminders.forEach((o) => combinedOrdersMap.set(o._id, o));
  recentOrders.forEach((o) => combinedOrdersMap.set(o._id, o));
  const combinedOrders = Array.from(combinedOrdersMap.values());

  const presetOptions = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'current_week', label: 'Current Week' },
    { id: 'current_month', label: 'Current Month' },
    { id: 'current_year', label: 'Current Year' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'last_365_days', label: 'Last 365 Days' },
    { id: '', label: 'All Time' },
  ];

  const statusOptions: OrderStatus[] = [
    'Received',
    'Washing',
    'Drying',
    'Ironing',
    'Packing',
    'Ready for Pickup',
    'Delivered',
    'Cancelled',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl shadow-brand-600/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 mt-1">
            Welcome back! Monitor live shop activity, orders & performance metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/orders/new')}
            className="px-4 py-2.5 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 text-xs font-extrabold shadow-md flex items-center gap-2 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>New POS Order</span>
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh Dashboard"
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* DASHBOARD FILTERS SECTION */}
      <div className="glass-card p-5 space-y-4 border-l-4 border-l-brand-600">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Dashboard Analytics Filters
            </h2>
          </div>
          {(preset || paymentStatus || orderStatus || dateFrom || dateTo) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Quick Date Presets Scrollable Bar */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Quick Date Presets
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {presetOptions.map((p) => {
              const active = preset === p.id && !dateFrom && !dateTo;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Controls Grid: Payment Status, Order Status, Date Type, From Date, To Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Payment Status Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Order Status Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Order Status
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Order Statuses</option>
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Date Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Date Filter Type
            </label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="orderDate">Order Date</option>
              <option value="expectedDeliveryDate">Expected Delivery Date</option>
            </select>
          </div>

          {/* Custom From Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPreset('');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Custom To Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPreset('');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* 8 Key Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Filtered Orders */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.todayOrders ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Matching filter criteria</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats?.pendingOrders ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting completion</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Progress</span>
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
              <WashingMachine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {stats?.inProgress ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Washing/Ironing</p>
          </div>
        </div>

        {/* Ready for Pickup */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ready for Pickup</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.readyForPickup ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cleaned & packed</p>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Delivered Orders</span>
            <div className="p-2 rounded-xl bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.deliveredOrders ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Completed</p>
          </div>
        </div>

        {/* Today / Filtered Revenue */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Period Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {currencySymbol}{stats?.periodRevenue ?? stats?.todayRevenue ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Selected date range</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Revenue</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {currencySymbol}{stats?.monthlyRevenue ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">This month total</p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Customers</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.totalCustomers ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered accounts</p>
          </div>
        </div>
      </div>

      {/* COMBINED UNIFIED ORDERS & REMINDERS CONTAINER */}
      <div className="glass-card p-6 border-t-4 border-t-brand-600 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-500 animate-pulse" />
              Active Orders & Pending Deliveries ({combinedOrders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Manage live status via dropdown, view amounts, payment status & quick actions (WhatsApp, Print, Edit)
            </p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Orders Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {combinedOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No orders match the selected dashboard filters.
          </div>
        ) : (
          <div>
            {/* Desktop & Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Order Status (Dropdown)</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {combinedOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="hover:underline"
                        >
                          #{ord.orderNumber}
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold">{ord.customerSnapshot.name}</p>
                        <p className="text-[10px] text-slate-400">+91 {ord.customerSnapshot.mobile}</p>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-slate-900 dark:text-white">{currencySymbol}{ord.totalAmount}</p>
                        {ord.remainingBalance > 0 ? (
                          <p className="text-[10px] text-rose-500 font-semibold">
                            Bal: {currencySymbol}{ord.remainingBalance}
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 font-medium">Fully Paid</p>
                        )}
                      </td>

                      {/* Order Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleQuickStatusUpdate(ord._id, e.target.value as OrderStatus)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {statusOptions.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={ord.paymentStatus} size="sm" />
                      </td>

                      {/* Actions: WhatsApp, Print, Edit */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Share Button */}
                          <button
                            onClick={() => handleWhatsAppShare(ord)}
                            title="Share Receipt on WhatsApp"
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                          >
                            <Smartphone className="w-4 h-4" />
                          </button>

                          {/* Print Receipt Button */}
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setShowInvoiceModal(true);
                            }}
                            title="Print Digital Receipt"
                            className="p-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit / View Details Button */}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            title="Edit / View Details"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {combinedOrders.map((ord) => (
                <div key={ord._id} className="py-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="font-black text-sm text-brand-600 dark:text-brand-400"
                      >
                        #{ord.orderNumber}
                      </button>
                      <p className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">
                        {ord.customerSnapshot.name}
                      </p>
                      <p className="text-[11px] text-slate-500">+91 {ord.customerSnapshot.mobile}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-slate-900 dark:text-white">{currencySymbol}{ord.totalAmount}</p>
                      <StatusBadge status={ord.paymentStatus} size="sm" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 text-[11px]">Status:</span>
                    <select
                      value={ord.status}
                      onChange={(e) => handleQuickStatusUpdate(ord._id, e.target.value as OrderStatus)}
                      className="text-xs font-semibold px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                    >
                      {statusOptions.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleWhatsAppShare(ord)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold flex items-center gap-1"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> WhatsApp
                    </button>

                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setShowInvoiceModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-brand-50 text-brand-600 text-xs font-semibold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>

                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedOrder && !showInvoiceModal && !showPaymentModal && (
        <OrderDetailModal
          order={selectedOrder}
          setting={setting}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={async (newSt) => {
            await handleQuickStatusUpdate(selectedOrder._id, newSt);
            setSelectedOrder((prev) => (prev ? { ...prev, status: newSt } : null));
          }}
          onRecordPayment={() => setShowPaymentModal(true)}
          onOpenInvoice={() => setShowInvoiceModal(true)}
        />
      )}

      {showPaymentModal && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          setting={setting}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={async () => {
            setShowPaymentModal(false);
            loadData();
            setSelectedOrder(null);
          }}
        />
      )}

      {showInvoiceModal && selectedOrder && (
        <InvoiceView
          order={selectedOrder}
          setting={setting}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
};
