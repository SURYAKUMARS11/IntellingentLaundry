import React, { useState, useEffect } from 'react';
import { fetchRevenueReport, fetchSettings } from '../services/api';
import { Customer, Setting } from '../types';
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
import { BarChart3, Download, TrendingUp, Users, Award, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState('30days');
  const [chartData, setChartData] = useState<any[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const [reportRes, setRes] = await Promise.all([
        fetchRevenueReport(period),
        fetchSettings(),
      ]);
      if (reportRes.success) {
        setChartData(reportRes.chartData || []);
        setServiceBreakdown(reportRes.serviceBreakdown || []);
        setTopCustomers(reportRes.topCustomers || []);
      }
      if (setRes.success) setSetting(setRes.setting);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  const currencySymbol = setting?.currencySymbol || '₹';

  const handleExportCSV = (type: 'orders' | 'customers') => {
    window.open(`/api/reports/export?type=${type}`, '_blank');
  };

  const COLORS = ['#0284c7', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" /> Business Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Export data, revenue trends, top customer performance & service insights
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCSV('orders')}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Orders CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV('customers')}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Customers CSV</span>
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="flex items-center gap-2 glass-card p-1.5 max-w-xs">
        {[
          { id: '7days', label: '7 Days' },
          { id: '30days', label: '30 Days' },
          { id: '12months', label: '12 Months' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setPeriod(t.id)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === t.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Revenue Chart (lg:col-span-8) */}
        <div className="glass-card p-6 lg:col-span-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" /> Revenue Collection Chart
              </h3>
              <p className="text-xs text-slate-500">Historical financial breakdown</p>
            </div>
          </div>

          <div className="h-72 w-full">
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

        {/* Service Revenue Distribution (lg:col-span-4) */}
        <div className="glass-card p-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
              Revenue by Service
            </h3>
            <p className="text-xs text-slate-500 mb-4">Service category distribution</p>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceBreakdown}
                    dataKey="amount"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
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
            {serviceBreakdown.map((s, idx) => (
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

      {/* Top Customers Ranking Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Top Customer Ranking
            </h3>
            <p className="text-xs text-slate-500">Highest spending customers</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {topCustomers.map((cust, idx) => (
            <div key={cust._id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-extrabold flex items-center justify-center text-[11px]">
                  #{idx + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{cust.name}</p>
                  <p className="text-[10px] text-slate-400">Mobile: +91 {cust.mobile}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-black text-slate-900 dark:text-white">{currencySymbol}{cust.totalSpent}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{cust.totalOrders} total orders</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
