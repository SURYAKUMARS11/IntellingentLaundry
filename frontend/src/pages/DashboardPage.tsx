import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchDashboardStats,
  fetchRevenueReport,
  fetchSettings,
  updateOrderStatusApi,
} from '../services/api';
import { DashboardStats, Order, OrderStatus, Setting } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { InvoiceView } from '../components/invoice/InvoiceView';
import { PaymentModal } from '../components/orders/PaymentModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
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
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingReminders, setPendingReminders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<any[]>([]);
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, revRes, setRes] = await Promise.all([
        fetchDashboardStats(),
        fetchRevenueReport('30days'),
        fetchSettings(),
      ]);

      if (dashRes.success) {
        setStats(dashRes.stats);
        setPendingReminders(dashRes.pendingReminders || []);
        setRecentOrders(dashRes.recentOrders || []);
      }
      if (revRes.success) {
        setChartData(revRes.chartData || []);
        setServiceBreakdown(revRes.serviceBreakdown || []);
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
  }, []);

  const currencySymbol = setting?.currencySymbol || '₹';

  const handleQuickStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusApi(orderId, newStatus);
      loadData();
    } catch (err) {
      console.error('Failed to bump status:', err);
    }
  };

  const COLORS = ['#0284c7', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl shadow-brand-600/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 mt-1">
            Welcome back! Here is today's live business summary.
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

      {/* 8 Required Key Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Orders */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Orders</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.todayOrders ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Created today</p>
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
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting processing</p>
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

        {/* Today's Revenue */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {currencySymbol}{stats?.todayRevenue ?? 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Payments collected</p>
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

      {/* Pending Delivery Reminders Bar */}
      {pendingReminders.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-500 animate-bounce" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pending Delivery Reminders ({pendingReminders.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">Due today or upcoming</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingReminders.map((ord) => (
              <div
                key={ord._id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="font-bold text-xs text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      #{ord.orderNumber}
                    </button>
                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {ord.customerSnapshot.name}
                    </p>
                    <p className="text-[11px] text-slate-500">Mobile: +91 {ord.customerSnapshot.mobile}</p>
                  </div>
                  <StatusBadge status={ord.status} size="sm" />
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Due: <strong>{new Date(ord.expectedDeliveryDate).toLocaleDateString('en-GB')}</strong>
                  </span>

                  {/* 1-click status bump */}
                  {ord.status === 'Received' && (
                    <button
                      onClick={() => handleQuickStatusUpdate(ord._id, 'Washing')}
                      className="px-2 py-1 rounded-lg bg-cyan-600 text-white text-[10px] font-bold"
                    >
                      Mark Washing
                    </button>
                  )}
                  {ord.status === 'Washing' && (
                    <button
                      onClick={() => handleQuickStatusUpdate(ord._id, 'Ironing')}
                      className="px-2 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold"
                    >
                      Mark Ironing
                    </button>
                  )}
                  {ord.status === 'Ironing' && (
                    <button
                      onClick={() => handleQuickStatusUpdate(ord._id, 'Ready for Pickup')}
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                    >
                      Mark Ready
                    </button>
                  )}
                  {ord.status === 'Ready for Pickup' && (
                    <button
                      onClick={() => handleQuickStatusUpdate(ord._id, 'Delivered')}
                      className="px-2 py-1 rounded-lg bg-green-600 text-white text-[10px] font-bold"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Revenue Trend
              </h3>
              <p className="text-xs text-slate-500">Daily collections overview</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              Last 30 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${currencySymbol}${val}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
              Revenue by Service
            </h3>
            <p className="text-xs text-slate-500 mb-4">Popular laundry services</p>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceBreakdown}
                    dataKey="amount"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                  >
                    {serviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${currencySymbol}${val}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {serviceBreakdown.slice(0, 4).map((s, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {s.service}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{currencySymbol}{s.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Recent Orders
            </h3>
            <p className="text-xs text-slate-500">Latest active laundry orders</p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {recentOrders.map((ord) => (
                <tr key={ord._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {ord.orderNumber}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold">{ord.customerSnapshot.name}</p>
                    <p className="text-[10px] text-slate-400">+91 {ord.customerSnapshot.mobile}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(ord.orderDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ord.status} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ord.paymentStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                    {currencySymbol}{ord.totalAmount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
