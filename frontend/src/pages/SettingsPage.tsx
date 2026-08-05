import React, { useState, useEffect } from 'react';
import { fetchSettings, updateSettingsApi, updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Setting } from '../types';
import { Settings, Store, Receipt, Lock, CheckCircle, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { admin, updateAdminState } = useAuth();
  const [setting, setSetting] = useState<Setting>({
    shopName: 'IntelligentLaundry & Dry Cleaners',
    shopTagline: 'Smart & Premium Laundry Management',
    logoUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=200&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
    email: 'contact@intelligentlaundry.com',
    address: '123 Sparkle Avenue, Suite 4B, Commercial Hub',
    gstNumber: '27AABCU9603R1ZM',
    gstPercentage: 18,
    currencySymbol: '₹',
    currencyCode: 'INR',
    invoicePrefix: 'ORD-',
    termsAndConditions: 'Items not collected within 30 days are subject to storage charges.',
  });

  const [activeTab, setActiveTab] = useState<'shop' | 'invoice' | 'account'>('shop');
  const [isSaved, setIsSaved] = useState(false);

  // Admin account state
  const [adminName, setAdminName] = useState(admin?.name || '');
  const [adminEmail, setAdminEmail] = useState(admin?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchSettings();
        if (res.success && res.setting) {
          setSetting(res.setting);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    load();
  }, []);

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateSettingsApi(setting);
      if (res.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg('');
    try {
      const res = await updateProfile({
        name: adminName,
        email: adminEmail,
        currentPassword,
        newPassword,
      });
      if (res.success) {
        updateAdminState(res.admin);
        setAccountMsg('Account updated successfully');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      setAccountMsg(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" /> Shop Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500">
          Manage shop branding, logo, tax rules, invoice formatting & admin security
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'shop'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" /> Shop Profile
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'invoice'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" /> Invoice & Taxes
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'account'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" /> Admin Account
        </button>
      </div>

      {isSaved && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Shop configuration updated successfully!</span>
        </div>
      )}

      {/* Shop Profile Tab */}
      {activeTab === 'shop' && (
        <form onSubmit={handleSaveShopSettings} className="glass-card p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Store Identity Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                required
                value={setting.shopName}
                onChange={(e) => setSetting({ ...setting, shopName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Tagline
              </label>
              <input
                type="text"
                value={setting.shopTagline}
                onChange={(e) => setSetting({ ...setting, shopTagline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Phone Number *
              </label>
              <input
                type="text"
                required
                value={setting.phone}
                onChange={(e) => setSetting({ ...setting, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Support Email *
              </label>
              <input
                type="email"
                required
                value={setting.email}
                onChange={(e) => setSetting({ ...setting, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shop Address *
            </label>
            <input
              type="text"
              required
              value={setting.address}
              onChange={(e) => setSetting({ ...setting, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Logo Image URL
            </label>
            <input
              type="text"
              value={setting.logoUrl}
              onChange={(e) => setSetting({ ...setting, logoUrl: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Shop Profile
            </button>
          </div>
        </form>
      )}

      {/* Invoice & Tax Settings */}
      {activeTab === 'invoice' && (
        <form onSubmit={handleSaveShopSettings} className="glass-card p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Invoice & Tax Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={setting.currencySymbol}
                onChange={(e) => setSetting({ ...setting, currencySymbol: e.target.value })}
                placeholder="₹ or $"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={setting.invoicePrefix}
                onChange={(e) => setSetting({ ...setting, invoicePrefix: e.target.value })}
                placeholder="ORD- or INV-"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GST / Tax Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={setting.gstPercentage}
                onChange={(e) => setSetting({ ...setting, gstPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GSTIN / Tax Number (Optional)
            </label>
            <input
              type="text"
              value={setting.gstNumber}
              onChange={(e) => setSetting({ ...setting, gstNumber: e.target.value })}
              placeholder="e.g. 27AAAAA0000A1Z5"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Receipt Terms & Conditions
            </label>
            <textarea
              rows={4}
              value={setting.termsAndConditions}
              onChange={(e) => setSetting({ ...setting, termsAndConditions: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none leading-relaxed"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Invoice Config
            </button>
          </div>
        </form>
      )}

      {/* Admin Account Settings */}
      {activeTab === 'account' && (
        <form onSubmit={handleSaveAccount} className="glass-card p-6 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Administrator Credentials
          </h3>

          {accountMsg && (
            <div className="p-3 rounded-xl bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-semibold">
              {accountMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password (required to change)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Update Admin Profile
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
