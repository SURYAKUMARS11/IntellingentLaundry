import React, { useState } from 'react';
import { Order, OrderStatus, Setting } from '../../types';
import { updateOrderApi } from '../../services/api';
import { X, Save, Edit, RefreshCw, Calendar, DollarSign, Tag, FileText, CheckCircle } from 'lucide-react';

interface EditOrderModalProps {
  order: Order;
  setting?: Setting;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  setting,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const currencySymbol = setting?.currencySymbol || '₹';

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<any>(order.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState<string>(order.paymentMethod || 'Cash');
  const [advancePaid, setAdvancePaid] = useState<number>(order.advancePaid || 0);
  const [discount, setDiscount] = useState<number>(order.discount || 0);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    order.expectedDeliveryDate
      ? new Date(order.expectedDeliveryDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>(order.notes || '');
  const [items, setItems] = useState<any[]>(order.items || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const statusOptions: OrderStatus[] = [
    'Received',
    'Washing',
    'Drying',
    'Ironing',
    'Packing',
    'Ready for Delivery',
    'Delivered',
    'Cancelled',
  ];

  // Math calculations
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.subtotal) || Number(item.price || 0) * Number(item.quantity || 1)),
    0
  );
  const totalAmount = Math.max(0, subtotal - Number(discount || 0));
  const remainingBalance = Math.max(0, totalAmount - Number(advancePaid || 0));

  const handleItemQuantityChange = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    const updated = [...items];
    const item = { ...updated[index] };
    item.quantity = qty;
    item.subtotal = (Number(item.price) || 0) * qty;
    updated[index] = item;
    setItems(updated);
  };

  const handleItemPriceChange = (index: number, newPrice: number) => {
    const price = Math.max(0, newPrice);
    const updated = [...items];
    const item = { ...updated[index] };
    item.price = price;
    item.subtotal = price * (Number(item.quantity) || 1);
    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('An order must have at least 1 item.');
      return;
    }
    setErrorMsg('');
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let finalPayStatus = paymentStatus;
      if (remainingBalance === 0 && totalAmount > 0) {
        finalPayStatus = 'Paid';
      } else if (advancePaid > 0 && remainingBalance > 0) {
        finalPayStatus = 'Partially Paid';
      }

      const updatePayload = {
        status,
        paymentStatus: finalPayStatus,
        paymentMethod,
        advancePaid: Number(advancePaid),
        discount: Number(discount),
        expectedDeliveryDate,
        notes,
        items,
      };

      const res = await updateOrderApi(order._id, updatePayload);
      if (res.success) {
        onSave();
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to update order');
      }
    } catch (err: any) {
      console.error('Failed to update order', err);
      setErrorMsg(err.message || 'Error saving changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Edit Order #{order.orderNumber}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Customer: {order.customerSnapshot?.name || 'Customer'} (+91 {order.customerSnapshot?.mobile})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 font-bold text-xs">
              {errorMsg}
            </div>
          )}

          {/* Status & Delivery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Order Progress Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Expected Delivery Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Status & Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Advance Paid ({currencySymbol})</label>
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
              />
            </div>
          </div>

          {/* Discount & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Flat Discount ({currencySymbol})</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Order Notes / Instructions</label>
              <input
                type="text"
                placeholder="Special washing remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Items List Table */}
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span>Order Items ({items.length})</span>
            </h3>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Item / Service</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <p className="font-bold text-slate-900 dark:text-white">{item.garmentName || item.serviceName || 'Item'}</p>
                        <p className="text-[10px] text-slate-400">{item.serviceName}</p>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                          className="w-14 text-center px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                          className="w-20 text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {currencySymbol}{item.subtotal || item.price * item.quantity}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold">Subtotal:</span>{' '}
              <strong className="text-slate-800 dark:text-slate-200">{currencySymbol}{subtotal}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Discount:</span>{' '}
              <strong className="text-rose-600">-{currencySymbol}{discount}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Total Amount:</span>{' '}
              <strong className="text-slate-900 dark:text-white text-sm">{currencySymbol}{totalAmount}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Remaining Bal:</span>{' '}
              <strong className={remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {currencySymbol}{remainingBalance}
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md shadow-amber-600/30 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Order Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
