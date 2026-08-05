import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Users,
  WashingMachine,
  Shirt,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Order', path: '/orders/new', icon: PlusCircle, highlight: true },
    { label: 'Orders', path: '/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Services', path: '/services', icon: WashingMachine },
    { label: 'Clothing Items', path: '/items', icon: Shirt },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Shop Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <WashingMachine className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            IntelligentLaundry <Sparkles className="w-3.5 h-3.5 text-brand-500 fill-brand-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Laundry Admin POS</p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? item.highlight
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-semibold'
                    : item.highlight
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 m-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300">IntelligentLaundry v1.0</p>
        <p className="mt-0.5">Express Laundry & Dry Clean</p>
      </div>
    </aside>
  );
};
