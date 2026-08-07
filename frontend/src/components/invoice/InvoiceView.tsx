import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order, Setting } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { Printer, Download, Smartphone, X, CheckCircle, Sparkles, Building2, Phone, Mail, MapPin } from 'lucide-react';

interface InvoiceViewProps {
  order: Order;
  setting?: Setting;
  onClose?: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ order, setting, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const currencySymbol = setting?.currencySymbol || '₹';

  // Handle standard browser printing
  const handlePrint = () => {
    window.print();
  };

  // Handle High-Resolution PDF Export
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${order.orderNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF invoice', err);
    }
  };

  // Handle WhatsApp Receipt Link + Trigger PDF Download
  const handleWhatsAppShare = async () => {
    // 1. Download PDF file for sending
    await handleDownloadPDF();

    // 2. Open WhatsApp Web / App with message & direct site receipt link
    const mobile = order.customerSnapshot.mobile.replace(/\D/g, '');
    const receiptUrl = `${window.location.origin}/receipt/${order.orderNumber}`;
    const text = `Hello *${order.customerSnapshot.name}*,\n\nYour official laundry invoice & receipt for Order *#${order.orderNumber}* from *${setting?.shopName || 'IntelligentLaundry'}* is ready!\n\n📋 *Invoice Summary*:\n• Order Date: ${new Date(order.orderDate).toLocaleDateString('en-GB')}\n• Status: ${order.status}\n• Payment: ${order.paymentStatus}\n• Total Amount: ${currencySymbol}${order.totalAmount}\n• Advance Paid: ${currencySymbol}${order.advancePaid}\n• Remaining Balance: ${currencySymbol}${order.remainingBalance}\n\n🔗 *View / Print / Download PDF Invoice Directly*:\n${receiptUrl}\n\nThank you for choosing ${setting?.shopName || 'IntelligentLaundry'}!`;
    const url = `https://wa.me/${mobile.length === 10 ? '91' + mobile : mobile}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Action Header Bar (Hidden during window.print()) */}
        <div className="no-print p-4 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Official Tax Invoice & Receipt
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              title="Download PDF & Share via WhatsApp"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              title="Download PDF Invoice"
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              title="Print Receipt"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Professional Invoice Area */}
        <div
          className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans"
          id="printable-invoice"
          ref={receiptRef}
        >
          {/* Header Banner */}
          <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand-700 font-black text-xl tracking-tight">
                <Sparkles className="w-5 h-5 text-brand-600 fill-brand-600" />
                <span>{setting?.shopName || 'IntelligentLaundry & Dry Cleaners'}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {setting?.shopTagline || 'Smart & Premium Laundry Management'}
              </p>

              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{setting?.address || '123 Sparkle Avenue, Suite 4B, Commercial Hub'}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{setting?.phone || '+91 98765 43210'}</span>
                  <span className="text-slate-300 mx-1">•</span>
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{setting?.email || 'contact@intelligentlaundry.com'}</span>
                </p>
                {setting?.gstNumber && (
                  <p className="text-[11px] font-bold text-slate-700 pt-1">
                    GSTIN: <span className="font-mono text-slate-900">{setting.gstNumber}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Invoice Meta Pill & Status */}
            <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-black text-sm tracking-wider shadow-sm mb-2">
                INVOICE #{order.orderNumber}
              </div>
              <p className="text-xs text-slate-500">
                Order Date: <strong className="text-slate-800">{new Date(order.orderDate).toLocaleDateString('en-GB')}</strong>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Date: <strong className="text-slate-800">{new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')}</strong>
              </p>
              <div className="mt-2.5">
                <StatusBadge status={order.paymentStatus} size="sm" />
              </div>
            </div>
          </div>

          {/* Customer & Order Status Box */}
          <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Billed To Customer
              </p>
              <h3 className="font-extrabold text-base text-slate-900">{order.customerSnapshot.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">Mobile: +91 {order.customerSnapshot.mobile}</p>
              {order.customerSnapshot.address && (
                <p className="text-xs text-slate-600 mt-0.5">{order.customerSnapshot.address}</p>
              )}
            </div>

            <div className="sm:text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Current Order Status
              </p>
              <div className="mt-1">
                <StatusBadge status={order.status} size="md" />
              </div>
            </div>
          </div>

          {/* Laundry Items Table */}
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Item & Service Description</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-3 px-3 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{item.itemName}</p>
                      <p className="text-[11px] text-brand-600 font-semibold">{item.serviceName}</p>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-700 font-medium">
                      {currencySymbol}{item.unitPrice}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {currencySymbol}{item.subtotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Breakdown & QR Verification */}
          <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row justify-between items-start gap-6">
            {/* QR Verification Badge */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <QRCodeSVG
                value={JSON.stringify({
                  orderNumber: order.orderNumber,
                  customer: order.customerSnapshot.name,
                  total: order.totalAmount,
                })}
                size={75}
              />
              <div className="text-[11px]">
                <p className="font-bold text-slate-900">Digital QR Verification</p>
                <p className="text-slate-500 mt-0.5">Scan to verify order receipt</p>
                <p className="text-brand-600 font-extrabold font-mono mt-1">#{order.orderNumber}</p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-64 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">{currencySymbol}{order.subtotal}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount:</span>
                  <span>-{currencySymbol}{order.discount}</span>
                </div>
              )}

              {order.taxPercent > 0 ? (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({order.taxPercent}% GST):</span>
                  <span>+{currencySymbol}{order.taxAmount}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Tax (0% GST):</span>
                  <span>{currencySymbol}0</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-b border-slate-200 py-2">
                <span>Total Amount:</span>
                <span className="text-brand-700 text-base">{currencySymbol}{order.totalAmount}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Advance Paid:</span>
                <span className="font-bold text-emerald-700">{currencySymbol}{order.advancePaid}</span>
              </div>

              <div className="flex justify-between text-slate-900 font-black text-xs pt-1">
                <span>Remaining Balance:</span>
                <span className={order.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {currencySymbol}{order.remainingBalance}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Thank You */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-[10px] text-slate-500 text-center leading-relaxed">
            <p className="font-bold text-slate-800 mb-1">
              Thank you for choosing {setting?.shopName || 'IntelligentLaundry'}!
            </p>
            <p className="whitespace-pre-line">{setting?.termsAndConditions}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
