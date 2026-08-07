import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Plus,
  Users,
  BarChart3,
  Settings,
  MoreHorizontal,
  Wallet,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  return (
    <>
      {/* Slide up More Menu */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed bottom-16 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl p-4 shadow-xl space-y-2 animate-in slide-in-from-bottom duration-200 z-50">
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
              More Options
            </h3>

            <NavLink
              to="/accounts"
              onClick={() => setShowMoreMenu(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Accounts & Expenses</p>
                <p className="text-xs text-slate-500">Order incomes, EB bills & wages</p>
              </div>
            </NavLink>

            <NavLink
              to="/services"
              onClick={() => setShowMoreMenu(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Services Management</p>
                <p className="text-xs text-slate-500">Wash, Iron, Dry Clean pricing</p>
              </div>
            </NavLink>

            <NavLink
              to="/items"
              onClick={() => setShowMoreMenu(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Clothing Items</p>
                <p className="text-xs text-slate-500">Shirts, Pants, Suits, Blankets</p>
              </div>
            </NavLink>

            <NavLink
              to="/reports"
              onClick={() => setShowMoreMenu(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Reports & Analytics</p>
                <p className="text-xs text-slate-500">Revenue, Charts, CSV Export</p>
              </div>
            </NavLink>

            <NavLink
              to="/settings"
              onClick={() => setShowMoreMenu(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200"
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Shop Settings</p>
                <p className="text-xs text-slate-500">Logo, Address, Tax, Receipt Prefix</p>
              </div>
            </NavLink>
          </div>
        </div>
      )}

      {/* Fixed Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-30 px-2 shadow-lg">
        <NavLink
          to="/dashboard"
          onClick={() => setShowMoreMenu(false)}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
              isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </NavLink>

        <NavLink
          to="/orders"
          onClick={() => setShowMoreMenu(false)}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
              isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Orders</span>
        </NavLink>

        {/* Center Floating POS New Order Button */}
        <NavLink
          to="/orders/new"
          onClick={() => setShowMoreMenu(false)}
          className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/40 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </NavLink>

        <NavLink
          to="/customers"
          onClick={() => setShowMoreMenu(false)}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
              isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Customers</span>
        </NavLink>

        <button
          onClick={() => setShowMoreMenu((prev) => !prev)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
            showMoreMenu ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};
