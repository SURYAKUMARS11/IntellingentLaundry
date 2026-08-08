import React, { useState, useEffect } from 'react';
import {
  fetchSettings,
  updateSettingsApi,
  updateProfile,
  clearAllDataApi,
  downloadMasterExcelBackupApi,
  restoreMasterExcelBackupApi,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Setting } from '../types';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Settings, Store, Receipt, Lock, CheckCircle, Save, Trash2, Upload, X, FileSpreadsheet, Download, UploadCloud, CheckCircle2 } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<'shop' | 'invoice' | 'account' | 'backup'>('shop');
  const [isSaved, setIsSaved] = useState(false);

  // Admin account state
  const [adminName, setAdminName] = useState(admin?.name || '');
  const [adminEmail, setAdminEmail] = useState(admin?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');

  // Backup & Restore state
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [restoreSummary, setRestoreSummary] = useState<any>(null);

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

  const [showResetModal, setShowResetModal] = useState(false);

  const confirmResetAllData = async () => {
    setShowResetModal(false);
    try {
      await clearAllDataApi();
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to reset data', err);
    }
  };

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    setBackupMsg('');
    try {
      const res = await downloadMasterExcelBackupApi();
      if (res.success) {
        setBackupMsg('Excel Master Backup downloaded successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to download backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    setBackupMsg('');
    setRestoreSummary(null);
    try {
      const res = await restoreMasterExcelBackupApi(file);
      if (res.success) {
        setRestoreSummary(res.summary);
        setBackupMsg(res.message || 'Data restored successfully from Excel!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restore backup from file');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" /> Shop Settings & Configuration
        </h1>
        <p className="hidden sm:block text-xs text-slate-500">
          Manage shop branding, logo, tax rules, invoice formatting, admin security & data backups
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'shop'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" /> Shop Profile
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'invoice'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" /> Invoice & Taxes
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'account'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" /> Admin Account
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'backup'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel Backup & Restore
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

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Shop Profile
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-950/50 dark:text-rose-400 font-extrabold text-xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Reset All Orders & Customers
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GPay / PhonePe Mobile Number
              </label>
              <input
                type="text"
                value={setting.gpayNumber || ''}
                onChange={(e) => setSetting({ ...setting, gpayNumber: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">Displayed on customer invoice for GPay / PhonePe transfers.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop UPI ID / VPA Address
              </label>
              <input
                type="text"
                value={setting.upiId || ''}
                onChange={(e) => setSetting({ ...setting, upiId: e.target.value })}
                placeholder="e.g. 9876543210@paytm or shopname@okicici"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold text-brand-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Generates instant UPI scan & pay QR code on invoice receipts.</p>
            </div>
          </div>

          {/* Custom Payment QR Image Upload Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Custom Payment QR Code Image (GPay / PhonePe Standee Image)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {setting.paymentQrUrl ? (
                <div className="relative group shrink-0">
                  <img
                    src={setting.paymentQrUrl}
                    alt="Custom Payment QR"
                    className="w-24 h-24 object-contain rounded-xl border border-slate-300 bg-white p-1 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setSetting({ ...setting, paymentQrUrl: '' })}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-all"
                    title="Remove custom QR image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-center p-2 bg-white dark:bg-slate-800 shrink-0">
                  <Upload className="w-6 h-6 mb-1 text-slate-400" />
                  <span className="text-[10px] font-bold">No Custom QR</span>
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Upload your shop's official GPay / PhonePe / Paytm standee QR image to show directly on customer invoices.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSetting({ ...setting, paymentQrUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <span className="text-xs text-slate-400 font-bold">OR</span>

                  <input
                    type="text"
                    placeholder="Paste image URL directly..."
                    value={setting.paymentQrUrl || ''}
                    onChange={(e) => setSetting({ ...setting, paymentQrUrl: e.target.value })}
                    className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>
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

      {/* Excel Backup & Restore Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {backupMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{backupMsg}</span>
            </div>
          )}

          {restoreSummary && (
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-xs space-y-1.5">
              <h4 className="font-extrabold text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-brand-600" /> Restoration Completed Summary:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-semibold text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Orders</span>
                  <span className="text-sm font-black text-brand-600">{restoreSummary.restoredOrdersCount || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Customers</span>
                  <span className="text-sm font-black text-indigo-600">{restoreSummary.restoredCustomersCount || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Payments</span>
                  <span className="text-sm font-black text-emerald-600">{restoreSummary.restoredPaymentsCount || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Expenses</span>
                  <span className="text-sm font-black text-amber-600">{restoreSummary.restoredExpensesCount || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* CARD 1: EXPORT BACKUP */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Download Master Excel Backup (.xlsx)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Export all your shop's Orders, Customer Directory, Payment Receipts, and Expenses into a multi-sheet Excel file. Keep a safe copy on your PC or Google Drive.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                Recommended Daily
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadBackup}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>{isExporting ? 'Generating Excel File...' : 'Download Master Backup (.xlsx)'}</span>
              </button>
              <span className="text-[11px] text-slate-400 font-medium">
                Includes Orders, Customers, Payments, & Expenses sheets
              </span>
            </div>
          </div>

          {/* CARD 2: RESTORE BACKUP */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-brand-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-brand-600" />
                  <span>Emergency Restore Database from Excel (.xlsx)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  If your computer crashed or server database was reset, upload your previously saved <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-mono">Laundry_Master_Backup.xlsx</code> file to automatically restore all orders, customers, and expenses in seconds.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="px-5 py-3 rounded-2xl border-2 border-dashed border-brand-300 dark:border-brand-700 hover:border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 text-xs font-black cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 transition-all">
                <Upload className={`w-5 h-5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Parsing & Restoring Data...' : 'Select & Upload Excel Backup File (.xlsx)'}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  disabled={isRestoring}
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* CARD 3: RESET ALL DATA */}
          <div className="glass-card p-6 space-y-3 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-500" /> Reset All Database Records
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wipe all customer profiles, orders, invoices, and expense records to test completely from scratch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Database Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset All Shop Database"
        message="Are you sure you want to delete ALL existing customers, orders, invoices, and expenses? This will wipe all data to test 100% from scratch."
        confirmText="Wipe & Reset Everything"
        variant="danger"
        onConfirm={confirmResetAllData}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
