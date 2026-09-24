import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  Smartphone,
  CheckCircle,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building2,
  Download,
  Eye,
  Edit3,
  Loader2,
  Trash2,
  Plus,
} from 'lucide-react';
import { sendStaffPayslipWhatsAppApi, downloadStaffPayslipPdfApi } from '../../services/api';

export interface IWeeklyPayout {
  id: string;
  date: string;
  amount: number;
}

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any | null;
  staffList: any[];
  attendanceSummary?: any[];
  shopSettings?: any;
}

// Convert numbers to English currency words
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const formatTens = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
  };

  let str = '';
  if (Math.floor(num / 10000000) > 0) {
    str += formatTens(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    str += formatTens(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    str += formatTens(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    str += formatTens(Math.floor(num / 100)) + 'Hundred ';
    num %= 100;
  }
  if (num > 0) {
    str += formatTens(num);
  }
  return str.trim() + ' Rupees Only';
};

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  staff,
  staffList,
  attendanceSummary = [],
  shopSettings,
}) => {
  if (!isOpen) return null;

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff?._id || staffList[0]?._id || '');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const selectedStaff = staffList.find((s) => s._id === selectedStaffId) || staff || staffList[0];
  const summary = attendanceSummary.find((s) => s._id === selectedStaff?._id || s.staffName === selectedStaff?.name);

  // Editable Form States
  const [payPeriod, setPayPeriod] = useState<string>(
    new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  );
  const [presentDays, setPresentDays] = useState<number>(summary?.presentDays || 26);
  const [absentDays, setAbsentDays] = useState<number>(summary?.absentDays || 0);

  // Salary Components (Default amount: 5000)
  const [baseSalary, setBaseSalary] = useState<number>(
    selectedStaff?.dailyWage && selectedStaff?.dailyWage > 0
      ? selectedStaff.dailyWage * (summary?.presentDays || 26)
      : 5000
  );
  const [overtimeBonus, setOvertimeBonus] = useState<number>(0);
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(0);
  const [otherDeduction, setOtherDeduction] = useState<number>(0);

  // Weekly Salary Payout Log
  const [weeklyPayouts, setWeeklyPayouts] = useState<IWeeklyPayout[]>([
    { id: '1', date: new Date().toISOString().split('T')[0], amount: 1250 },
    { id: '2', date: new Date().toISOString().split('T')[0], amount: 1250 },
    { id: '3', date: new Date().toISOString().split('T')[0], amount: 1250 },
    { id: '4', date: new Date().toISOString().split('T')[0], amount: 1250 },
  ]);

  // Payment Details
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Partial'>('Paid');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI / GPay' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Editable Staff Mobile Number
  const [staffMobile, setStaffMobile] = useState<string>(selectedStaff?.mobile || '');

  // Update defaults when staff selection changes
  useEffect(() => {
    if (selectedStaff) {
      setStaffMobile(selectedStaff.mobile || '');
      const s = attendanceSummary.find((sum) => sum._id === selectedStaff._id || sum.staffName === selectedStaff.name);
      const pres = s?.presentDays !== undefined ? s.presentDays : 26;
      const abs = s?.absentDays !== undefined ? s.absentDays : 0;
      setPresentDays(pres);
      setAbsentDays(abs);
      if (selectedStaff.dailyWage && selectedStaff.dailyWage > 0) {
        const totalW = selectedStaff.dailyWage * pres;
        setBaseSalary(totalW);
        const weeklyShare = Math.round(totalW / 4);
        setWeeklyPayouts([
          { id: '1', date: new Date().toISOString().split('T')[0], amount: weeklyShare },
          { id: '2', date: new Date().toISOString().split('T')[0], amount: weeklyShare },
          { id: '3', date: new Date().toISOString().split('T')[0], amount: weeklyShare },
          { id: '4', date: new Date().toISOString().split('T')[0], amount: totalW - weeklyShare * 3 },
        ]);
      } else {
        setBaseSalary(5000);
        setWeeklyPayouts([
          { id: '1', date: new Date().toISOString().split('T')[0], amount: 1250 },
          { id: '2', date: new Date().toISOString().split('T')[0], amount: 1250 },
          { id: '3', date: new Date().toISOString().split('T')[0], amount: 1250 },
          { id: '4', date: new Date().toISOString().split('T')[0], amount: 1250 },
        ]);
      }
    }
  }, [selectedStaffId]);

  // Calculations
  const grossEarnings = Number(baseSalary || 0) + Number(overtimeBonus || 0);
  const totalDeductions = Number(otherDeduction || 0);
  const netPayable = grossEarnings - totalDeductions;
  const totalWeeklyPaid = weeklyPayouts.reduce((sum: number, p: IWeeklyPayout) => sum + Number(p.amount || 0), 0);
  const balanceDue = Math.max(0, netPayable - totalWeeklyPaid);

  const shopName = shopSettings?.storeName || shopSettings?.companyName || 'INTELLIGENT LAUNDRY & DRY CLEANERS';
  const shopAddress = shopSettings?.address || '123 Commercial Main Road, City Plaza, Sector 4';
  const shopPhone = shopSettings?.mobile || shopSettings?.phone || '+91 98765 43210';
  const shopEmail = shopSettings?.email || 'contact@intelligentlaundry.com';

  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState<boolean>(false);

  // Handle WhatsApp Direct PDF Download & Launching WhatsApp to Contact
  const handleSendWhatsApp = async () => {
    let mob = staffMobile ? staffMobile.replace(/\D/g, '') : '';
    if (!mob) {
      alert('Please enter a valid mobile number to share the payslip via WhatsApp!');
      return;
    }
    if (mob.length === 10) mob = '91' + mob;

    setIsSendingWhatsApp(true);
    const payslipData = {
      mobile: staffMobile,
      staffName: selectedStaff?.name || 'Staff',
      role: selectedStaff?.role || 'Staff',
      payPeriod,
      presentDays,
      absentDays,
      baseSalary,
      overtimeBonus,
      advanceDeduction,
      weeklyPayouts,
      totalWeeklyPaid,
      otherDeduction,
      grossEarnings,
      totalDeductions,
      netPayable,
      paymentStatus: balanceDue === 0 ? 'Paid' : paymentStatus,
      paymentMode,
      paymentDate,
    };

    try {
      // 1. Generate & download readymade PDF directly
      const pdfBlob = await downloadStaffPayslipPdfApi(payslipData);
      const url = window.URL.createObjectURL(pdfBlob);
      const cleanStaffName = (selectedStaff?.name || 'Staff').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanPeriod = (payPeriod || 'Payslip').replace(/[^a-zA-Z0-9]/g, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${cleanStaffName}_${cleanPeriod}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 2. Open WhatsApp chat directly to the staff number
      window.open(`https://wa.me/${mob}`, '_blank');
    } catch (err: any) {
      console.error('PDF download error:', err);
      // Fallback: Open WhatsApp anyway
      window.open(`https://wa.me/${mob}`, '_blank');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Handle Print / PDF Download
  const handlePrint = () => {
    const printContent = document.getElementById('printable-payslip-area');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${selectedStaff?.name} - ${payPeriod}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; padding: 20px; }
              @page { size: A4 portrait; margin: 15mm; }
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 font-sans p-6">
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="max-w-4xl w-full glass-card bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 gap-3 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-brand-600 text-white shadow-xs shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Staff Payslip Generator</h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-semibold line-clamp-1">
                  Weekly salary log, preview, print PDF, or send payslip via WhatsApp
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
                  viewMode === 'edit'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Details
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
                  viewMode === 'preview'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {viewMode === 'edit' ? (
            /* EDIT FORM MODE */
            <div className="space-y-4 sm:space-y-6 text-xs">
              {/* Select Staff & Pay Period */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Select Staff Member:</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-xs"
                  >
                    {staffList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.role || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Pay Period (Month & Year):</label>
                  <input
                    type="text"
                    value={payPeriod}
                    onChange={(e) => setPayPeriod(e.target.value)}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-xs"
                    placeholder="e.g. August 2026"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Mobile Number (WhatsApp):</label>
                  <input
                    type="text"
                    value={staffMobile}
                    onChange={(e) => setStaffMobile(e.target.value)}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-xs"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              {/* Attendance & Wage Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column: Earnings */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                  <h3 className="font-black text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2 pb-2 border-b border-emerald-200 dark:border-emerald-800">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Earnings Breakdown (+)
                  </h3>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Total Working Days:</label>
                    <input
                      type="number"
                      min="0"
                      value={presentDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPresentDays(val);
                        if (selectedStaff?.dailyWage && selectedStaff?.dailyWage > 0) {
                          setBaseSalary(selectedStaff.dailyWage * val);
                        }
                      }}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Base Monthly Salary (₹):</label>
                    <input
                      type="number"
                      min="0"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Daily Batta / Allowance (₹):</label>
                    <input
                      type="number"
                      min="0"
                      value={overtimeBonus}
                      onChange={(e) => setOvertimeBonus(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between font-black text-emerald-900 dark:text-emerald-200 text-xs">
                    <span>Total Gross Monthly Earnings:</span>
                    <span>₹{grossEarnings.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Right Column: Deductions */}
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                  <h3 className="font-black text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2 pb-2 border-b border-rose-200 dark:border-rose-800">
                    <DollarSign className="w-4 h-4 text-rose-600" /> Deductions (-)
                  </h3>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Total Leave / Absent Days:</label>
                    <input
                      type="number"
                      min="0"
                      value={absentDays}
                      onChange={(e) => setAbsentDays(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Other Deductions / LOP (₹):</label>
                    <input
                      type="number"
                      min="0"
                      value={otherDeduction}
                      onChange={(e) => setOtherDeduction(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div className="pt-2 border-t border-rose-200 dark:border-rose-800 flex justify-between font-black text-rose-900 dark:text-rose-200 text-xs">
                    <span>Total Deductions:</span>
                    <span>₹{totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Salary Payout Log Manager */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-blue-900 dark:text-blue-200 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> Weekly Salary Payouts / Disbursements (₹)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Log weekly payouts paid to worker during the month (e.g. 4 weekly payments)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newEntry = {
                        id: Date.now().toString(),
                        date: new Date().toISOString().split('T')[0],
                        amount: 0,
                      };
                      setWeeklyPayouts([...weeklyPayouts, newEntry]);
                    }}
                    className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Weekly Payout Line
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {weeklyPayouts.map((payout: IWeeklyPayout, idx: number) => (
                    <div key={payout.id} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-blue-100 dark:border-slate-800">
                      <span className="font-black text-slate-500 text-[11px] shrink-0 w-14">Week {idx + 1}:</span>
                      <input
                        type="date"
                        value={payout.date}
                        onChange={(e) => {
                          const updated = weeklyPayouts.map((item: IWeeklyPayout) =>
                            item.id === payout.id ? { ...item, date: e.target.value } : item
                          );
                          setWeeklyPayouts(updated);
                        }}
                        className="w-1/2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Payout (₹)"
                        value={payout.amount || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = weeklyPayouts.map((item: IWeeklyPayout) =>
                            item.id === payout.id ? { ...item, amount: val } : item
                          );
                          setWeeklyPayouts(updated);
                        }}
                        className="w-1/2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      />
                      {weeklyPayouts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = weeklyPayouts.filter((item: IWeeklyPayout) => item.id !== payout.id);
                            setWeeklyPayouts(updated);
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer shrink-0"
                          title="Remove payout line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-blue-200 dark:border-blue-900 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Total Weekly Salary Disbursed:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{totalWeeklyPaid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Details & Summary Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/40 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Settlement Status:</label>
                    <select
                      value={balanceDue === 0 ? 'Paid' : paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold"
                    >
                      <option value="Paid">🟢 Fully Paid (Weekly)</option>
                      <option value="Partial">🟡 Partially Paid</option>
                      <option value="Pending">🔴 Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Payment Mode:</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold"
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="UPI / GPay">📱 UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">🏦 Bank Transfer</option>
                      <option value="Cheque">📜 Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Settlement Date:</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 shadow-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NET PAYABLE SALARY</p>
                    <p className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400">
                      ₹{netPayable.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 italic mt-0.5">
                      ({numberToWords(netPayable)})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Eye className="w-4 h-4" /> Preview & Print Payslip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW & PRINTABLE PAYSLIP MODE */
            <div className="space-y-4 sm:space-y-6">
              {/* Printable Payslip Card */}
              <div
                id="printable-payslip-area"
                className="p-4 sm:p-8 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-lg space-y-4 sm:space-y-6 max-w-3xl mx-auto text-xs"
              >
                {/* Payslip Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-800 pb-4 sm:pb-5 gap-3">
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-brand-600" /> {shopName}
                    </h1>
                    <p className="text-xs text-slate-600 mt-1 max-w-md">{shopAddress}</p>
                    <p className="text-xs text-slate-600">Phone: {shopPhone} • Email: {shopEmail}</p>
                  </div>

                  <div className="text-left sm:text-right border-l-2 sm:border-l-0 border-brand-600 pl-3 sm:pl-0">
                    <span className="px-3 py-1 bg-slate-900 text-white font-black text-xs rounded-md uppercase tracking-wider inline-block">
                      SALARY PAYSLIP
                    </span>
                    <p className="text-xs font-extrabold text-slate-800 mt-1.5">Period: {payPeriod}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Date: {new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Staff Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Employee Name</span>
                    <p className="font-extrabold text-slate-900 truncate">{selectedStaff?.name || 'Staff'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Role / Designation</span>
                    <p className="font-extrabold text-slate-800 truncate">{selectedStaff?.role || 'Staff'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</span>
                    <p className="font-extrabold text-slate-800 truncate">{staffMobile || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Working & Leave Days</span>
                    <p className="font-extrabold text-emerald-700">Working: {presentDays}d | Abs: {absentDays}d</p>
                  </div>
                </div>

                {/* Financial Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-2 bg-slate-800 text-white font-bold py-2 px-3 sm:px-4 uppercase text-[11px]">
                    <div>Earnings (+)</div>
                    <div className="text-right">Amount (₹)</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    <div className="grid grid-cols-2 py-2 px-3 sm:px-4">
                      <span>Basic / Monthly Salary</span>
                      <span className="text-right font-bold">₹{baseSalary.toLocaleString('en-IN')}</span>
                    </div>
                    {overtimeBonus > 0 && (
                      <div className="grid grid-cols-2 py-2 px-3 sm:px-4">
                        <span>Daily Batta / Allowance</span>
                        <span className="text-right font-bold text-emerald-700">+ ₹{overtimeBonus.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 py-2 px-3 sm:px-4 bg-slate-50 font-black">
                      <span>GROSS EARNINGS</span>
                      <span className="text-right text-emerald-800">₹{grossEarnings.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 bg-slate-800 text-white font-bold py-2 px-3 sm:px-4 uppercase text-[11px] border-t border-slate-300">
                    <div>Deductions (-)</div>
                    <div className="text-right">Amount (₹)</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {otherDeduction > 0 ? (
                      <div className="grid grid-cols-2 py-2 px-3 sm:px-4">
                        <span>Other Deductions / LOP</span>
                        <span className="text-right font-bold text-rose-600">- ₹{otherDeduction.toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 py-2 px-3 sm:px-4 text-slate-400 italic">
                        <span>Nil Deductions</span>
                        <span className="text-right">₹0</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 py-2 px-3 sm:px-4 bg-slate-50 font-black">
                      <span>TOTAL DEDUCTIONS</span>
                      <span className="text-right text-rose-800">₹{totalDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Salary Payout Log Box */}
                {weeklyPayouts.some((p: IWeeklyPayout) => Number(p.amount || 0) > 0) && (
                  <div className="border border-blue-200 rounded-xl overflow-hidden text-xs bg-blue-50/40">
                    <div className="flex items-center justify-between bg-blue-900 text-white font-bold py-2 px-3 sm:px-4 text-[11px]">
                      <span>WEEKLY SALARY PAYOUT LOG (DISBURSED)</span>
                      <span>Total Disbursed: ₹{totalWeeklyPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="divide-y divide-blue-100 p-2 sm:p-3 space-y-1">
                      {weeklyPayouts
                        .filter((p: IWeeklyPayout) => Number(p.amount || 0) > 0)
                        .map((payout: IWeeklyPayout, idx: number) => (
                          <div key={payout.id} className="flex justify-between items-center px-2 py-1 text-slate-700 font-semibold">
                            <span>
                              Week {idx + 1} ({payout.date ? new Date(payout.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Weekly'})
                            </span>
                            <span className="font-bold text-emerald-700">₹{Number(payout.amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Net Settlement Summary Box */}
                <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NET PAYABLE SALARY</span>
                    <h2 className="text-xl sm:text-2xl font-black text-emerald-400">₹{netPayable.toLocaleString('en-IN')}</h2>
                    <p className="text-[11px] text-slate-300 italic font-semibold">{numberToWords(netPayable)}</p>
                  </div>

                  <div className="text-left sm:text-right text-xs border-l sm:border-l-0 sm:border-r border-slate-700 pl-3 sm:pl-0 sm:pr-4">
                    <span className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-black text-[11px] uppercase inline-block">
                      STATUS: {paymentStatus.toUpperCase()}
                    </span>
                    <p className="text-[11px] text-slate-300 font-bold mt-1">Payment Mode: {paymentMode}</p>
                  </div>
                </div>

                {/* Appreciation & Thank You Footer */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <p className="font-extrabold text-brand-700 text-xs sm:text-sm">
                    Thank you for your valuable contribution & dedication to our team! 🙏
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold italic">
                    We truly appreciate your hard work, efficiency, and commitment.
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 text-center italic border-t border-slate-100 pt-2">
                  This is a computer generated payslip document issued by {shopName}.
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Edit Details
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    disabled={isSendingWhatsApp}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    {isSendingWhatsApp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending PDF...
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" /> Send PDF via WhatsApp
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print / Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
