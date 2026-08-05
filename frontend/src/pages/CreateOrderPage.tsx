import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCustomers,
  fetchServices,
  fetchItems,
  createOrderApi,
  fetchSettings,
  createCustomerApi,
} from '../services/api';
import { Customer, Service, LaundryItem, Order, Setting } from '../types';
import { InvoiceView } from '../components/invoice/InvoiceView';
import {
  User,
  Search,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  ShoppingBag,
  Sparkles,
  Percent,
} from 'lucide-react';

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();

  // Data lists
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [itemsList, setItemsList] = useState<LaundryItem[]>([]);
  const [setting, setSetting] = useState<Setting | undefined>(undefined);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showNewCustModal, setShowNewCustModal] = useState(false);

  // New inline customer form
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Selected Order Line Items
  const [orderItems, setOrderItems] = useState<
    Array<{
      itemId: string;
      itemName: string;
      serviceId: string;
      serviceName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>
  >([]);

  // Category filter for item catalog
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Pricing & Discounts
  const [discount, setDiscount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>('');

  // Final Generated Order & Invoice Modal
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [custRes, servRes, itemRes, setRes] = await Promise.all([
          fetchCustomers(),
          fetchServices(),
          fetchItems(),
          fetchSettings(),
        ]);

        if (custRes.success) setCustomers(custRes.customers);
        if (servRes.success) setServices(servRes.services);
        if (itemRes.success) setItemsList(itemRes.items);
        if (setRes.success) {
          setSetting(setRes.setting);
          if (setRes.setting?.gstPercentage) {
            setTaxPercent(setRes.setting.gstPercentage);
          }
        }
      } catch (err) {
        console.error('Failed to load POS reference data', err);
      }
    };
    loadInitial();
  }, []);

  const currencySymbol = setting?.currencySymbol || '₹';

  // Add Item to Cart
  const addItemToCart = (item: LaundryItem, service: Service) => {
    const unitPrice = service.price || item.defaultPrice;
    setOrderItems((prev) => {
      const existingIdx = prev.findIndex(
        (line) => line.itemId === item._id && line.serviceId === service._id
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx].quantity = newQty;
        updated[existingIdx].subtotal = newQty * updated[existingIdx].unitPrice;
        return updated;
      }
      return [
        ...prev,
        {
          itemId: item._id,
          itemName: item.name,
          serviceId: service._id,
          serviceName: service.name,
          quantity: 1,
          unitPrice,
          subtotal: unitPrice,
        },
      ];
    });
  };

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      updated[index].subtotal = newQty * updated[index].unitPrice;
      return updated;
    });
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index].unitPrice = Math.max(0, newPrice);
      updated[index].subtotal = updated[index].quantity * Math.max(0, newPrice);
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Inline Create Customer
  const handleCreateInlineCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustMobile) return;
    try {
      const res = await createCustomerApi({
        name: newCustName,
        mobile: newCustMobile,
        address: newCustAddress || 'Local Address',
        email: newCustEmail,
      });
      if (res.success && res.customer) {
        setCustomers((prev) => [res.customer, ...prev]);
        setSelectedCustomerId(res.customer._id);
        setShowNewCustModal(false);
        setNewCustName('');
        setNewCustMobile('');
        setNewCustAddress('');
        setNewCustEmail('');
      }
    } catch (err) {
      console.error('Failed to create customer', err);
    }
  };

  // Calculations
  const subtotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const totalAmount = Math.round(taxableAmount + taxAmount);
  const remainingBalance = Math.max(0, totalAmount - advancePaid);

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert('Please select a customer or add a new customer.');
      return;
    }
    if (orderItems.length === 0) {
      alert('Please add at least one laundry item to the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createOrderApi({
        customerId: selectedCustomerId,
        items: orderItems,
        expectedDeliveryDate,
        discount,
        taxPercent,
        advancePaid,
        paymentMethod,
        notes,
      });

      if (res.success && res.order) {
        setCreatedOrder(res.order);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Categories list
  const categories = ['All', ...Array.from(new Set(itemsList.map((i) => i.category)))];
  const filteredItems = itemsList.filter(
    (item) => activeCategory === 'All' || item.category === activeCategory
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.mobile.includes(customerSearch)
  );

  const selectedCustomerObj = customers.find((c) => c._id === selectedCustomerId);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-600" /> Express POS Order Builder
          </h1>
          <p className="text-xs text-slate-500">
            Create new laundry order & generate instant digital receipt
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer & Cart Summary (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer Selection */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-500" /> Step 1: Select Customer
              </span>
              <button
                type="button"
                onClick={() => setShowNewCustModal(true)}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Customer
              </button>
            </div>

            {/* Selected Customer Card or Search Selector */}
            {selectedCustomerObj ? (
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-brand-900 dark:text-brand-100">
                    {selectedCustomerObj.name}
                  </h3>
                  <p className="text-xs text-brand-700 dark:text-brand-300">
                    Mobile: +91 {selectedCustomerObj.mobile} | {selectedCustomerObj.address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId('')}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type customer name or mobile number..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {filteredCustomers.slice(0, 5).map((cust) => (
                    <button
                      key={cust._id}
                      type="button"
                      onClick={() => setSelectedCustomerId(cust._id)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{cust.name}</p>
                        <p className="text-slate-500 text-[11px]">+91 {cust.mobile}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Selected Order Items Table */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-brand-500" /> Step 2: Selected Items ({orderItems.length})
              </span>
              {orderItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOrderItems([])}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {orderItems.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-medium">Cart is empty</p>
                <p className="text-[11px] text-slate-400">Select clothing items & services from the catalog below</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {orderItems.map((line, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">{line.itemName}</p>
                      <p className="text-[11px] text-brand-600 dark:text-brand-400">{line.serviceName}</p>
                    </div>

                    {/* Unit Price Editable */}
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">{currencySymbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) => updateItemPrice(idx, Number(e.target.value))}
                        className="w-16 px-1.5 py-1 text-center font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Qty Stepper */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => updateItemQty(idx, line.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-200"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-slate-900 dark:text-white">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQty(idx, line.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-16 text-right font-extrabold text-slate-900 dark:text-white">
                      {currencySymbol}{line.subtotal}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalog Picker: Categories & Items Grid */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Item & Service Catalog
            </h3>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Item Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between hover:border-brand-500 transition-all"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-400">Default: {currencySymbol}{item.defaultPrice}</p>
                  </div>

                  <div className="mt-3 flex flex-col gap-1">
                    {services.map((serv) => (
                      <button
                        key={serv._id}
                        type="button"
                        onClick={() => addItemToCart(item, serv)}
                        className="w-full text-[10px] font-semibold py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-colors flex justify-between items-center"
                      >
                        <span>{serv.name}</span>
                        <span>{currencySymbol}{serv.price || item.defaultPrice}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Calculation & Payment Summary (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <div className="glass-card p-6 space-y-5 sticky top-20">
            <h3 className="font-black text-base text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" /> Order Summary & Payment
            </h3>

            {/* Schedule & Dates */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-500" /> Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Subtotal ({orderItems.reduce((acc, i) => acc + i.quantity, 0)} items):</span>
                <span className="font-bold text-slate-900 dark:text-white">{currencySymbol}{subtotal}</span>
              </div>

              {/* Discount Input */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400">Discount ({currencySymbol}):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2 py-1 text-right font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                />
              </div>

              {/* Tax Input */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  Tax GST (%):
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2 py-1 text-right font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                />
              </div>

              {/* Total Box */}
              <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex justify-between items-center my-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Total Amount</span>
                <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                  {currencySymbol}{totalAmount}
                </span>
              </div>

              {/* Advance Paid & Payment Method */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Advance Paid ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between text-xs font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Remaining Balance:</span>
                <span className={remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {currencySymbol}{remainingBalance}
                </span>
              </div>
            </div>

            {/* Special Instructions Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes / Special Instructions (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Remove stain on collar, steam press heavy"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-brand-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Creating Order...' : 'Save Order & Print Receipt'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Inline Customer Modal */}
      {showNewCustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Add New Customer</h3>
            <form onSubmit={handleCreateInlineCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Customer Full Name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="10-digit mobile number"
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Street / House address"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewCustModal(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-md"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Digital Receipt Modal after saving */}
      {createdOrder && (
        <InvoiceView
          order={createdOrder}
          setting={setting}
          onClose={() => {
            setCreatedOrder(null);
            navigate('/orders');
          }}
        />
      )}
    </div>
  );
};
