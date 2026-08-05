import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order, Setting } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { Printer, Download, Share2, X, CheckCircle, Smartphone } from 'lucide-react';

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

  // Handle PDF Export
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
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

  // Handle WhatsApp Receipt Link
  const handleWhatsAppShare = () => {
    const mobile = order.customerSnapshot.mobile.replace(/\D/g, '');
    const text = `Hello ${order.customerSnapshot.name}, your laundry receipt #${order.orderNumber} is ready!\nTotal Amount: ${currencySymbol}${order.totalAmount}\nAdvance Paid: ${currencySymbol}${order.advancePaid}\nBalance: ${currencySymbol}${order.remainingBalance}\nStatus: ${order.status}\nThank you for choosing ${setting?.shopName || 'IntelligentLaundry'}!`;
    const url = `https://wa.me/${mobile.length === 10 ? '91' + mobile : mobile}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Action Header Bar (No print) */}
        <div className="no-print p-4 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Digital Invoice & Receipt
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              title="Share via WhatsApp"
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              title="Download PDF"
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handlePrint}
              title="Print Receipt"
              className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900" id="printable-invoice" ref={receiptRef}>
          {/* Receipt Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {setting?.shopName || 'IntelligentLaundry & Dry Cleaners'}
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {setting?.shopTagline || 'Premium Laundry & Express Dry Cleaning'}
              </p>
              <p className="text-xs text-slate-600 mt-2 max-w-sm leading-relaxed">
                {setting?.address || '123 Commercial Hub, Metro City'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Phone: {setting?.phone || '+91 98765 43210'} | Email: {setting?.email || 'info@cleanwave.com'}
              </p>
              {setting?.gstNumber && (
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  GSTIN: {setting.gstNumber}
                </p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block bg-brand-50 text-brand-700 font-extrabold text-sm px-3 py-1 rounded-lg border border-brand-200 mb-2">
                INVOICE #{order.orderNumber}
              </div>
              <p className="text-xs text-slate-500">
                Date: <span className="font-semibold text-slate-800">{new Date(order.orderDate).toLocaleDateString('en-GB')}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Expected: <span className="font-semibold text-slate-800">{new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')}</span>
              </p>
              <div className="mt-2">
                <StatusBadge status={order.paymentStatus} size="sm" />
              </div>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Billed To</p>
              <h3 className="font-bold text-base text-slate-900 mt-0.5">{order.customerSnapshot.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">Phone: +91 {order.customerSnapshot.mobile}</p>
              <p className="text-xs text-slate-600">{order.customerSnapshot.address}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Order Status</p>
              <div className="mt-1">
                <StatusBadge status={order.status} size="md" />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs mb-6">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <th className="py-2.5">#</th>
                <th className="py-2.5">Item & Service Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 font-medium text-slate-400">{idx + 1}</td>
                  <td className="py-3">
                    <p className="font-bold text-slate-900">{item.itemName}</p>
                    <p className="text-[11px] text-brand-600 font-medium">{item.serviceName}</p>
                  </td>
                  <td className="py-3 text-center font-semibold text-slate-800">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-700">
                    {currencySymbol}{item.unitPrice}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {currencySymbol}{item.subtotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations Summary & QR Code */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start gap-6">
            {/* QR Code & Verification */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <QRCodeSVG
                value={JSON.stringify({
                  orderNumber: order.orderNumber,
                  customer: order.customerSnapshot.name,
                  total: order.totalAmount,
                })}
                size={80}
              />
              <div className="text-[11px]">
                <p className="font-bold text-slate-900">Scan for Verification</p>
                <p className="text-slate-500 mt-0.5">Digital Order Receipt</p>
                <p className="text-brand-600 font-semibold mt-1"># {order.orderNumber}</p>
              </div>
            </div>

            {/* Subtotal / Tax / Total calculation table */}
            <div className="w-full sm:w-64 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium">{currencySymbol}{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>-{currencySymbol}{order.discount}</span>
                </div>
              )}
              {order.taxPercent > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({order.taxPercent}%):</span>
                  <span>+{currencySymbol}{order.taxAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-b border-slate-200 py-2 my-1">
                <span>Total Amount:</span>
                <span className="text-brand-700">{currencySymbol}{order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Advance Paid:</span>
                <span className="font-semibold text-emerald-700">{currencySymbol}{order.advancePaid}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-xs pt-1">
                <span>Remaining Balance:</span>
                <span className={order.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {currencySymbol}{order.remainingBalance}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Thank You */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-[10px] text-slate-500 text-center leading-relaxed">
            <p className="font-semibold text-slate-700 mb-1">
              Thank you for trusting {setting?.shopName || 'IntelligentLaundry'}!
            </p>
            <p className="whitespace-pre-line">{setting?.termsAndConditions}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
