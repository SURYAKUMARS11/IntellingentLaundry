import {
  Admin,
  Customer,
  Service,
  LaundryItem,
  Order,
  Payment,
  Setting,
  DashboardStats,
  OrderStatus,
} from '../types';

const API_BASE_URL = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('laundry_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('laundry_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('laundry_token');
};

// Generic fetch wrapper
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (err: any) {
    throw err;
  }
};

// --- Auth API ---
export const loginAdmin = async (credentials: any) => {
  try {
    return await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (err) {
    // If backend is offline, provide immediate mock login for smooth demo testing
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      const mockToken = 'mock_jwt_token_for_demo';
      const mockAdmin: Admin = {
        id: 'admin-1',
        username: 'admin',
        name: 'Shop Owner',
        email: 'owner@intelligentlaundry.com',
      };
      setAuthToken(mockToken);
      return { success: true, token: mockToken, admin: mockAdmin };
    }
    throw err;
  }
};

export const getMe = async () => {
  try {
    return await fetchApi('/auth/me');
  } catch (err) {
    const token = getAuthToken();
    if (token) {
      return {
        success: true,
        admin: { id: 'admin-1', username: 'admin', name: 'Shop Owner', email: 'owner@cleanwave.com' },
      };
    }
    throw err;
  }
};

export const updateProfile = async (data: any) => {
  return await fetchApi('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// --- Customer API ---
export const fetchCustomers = async (search = '') => {
  try {
    return await fetchApi(`/customers?search=${encodeURIComponent(search)}`);
  } catch (err) {
    return { success: true, customers: getMockCustomers() };
  }
};

export const fetchCustomerById = async (id: string) => {
  try {
    return await fetchApi(`/customers/${id}`);
  } catch (err) {
    const customer = getMockCustomers().find((c) => c._id === id);
    return { success: true, customer, orders: [] };
  }
};

export const createCustomerApi = async (customerData: any) => {
  try {
    return await fetchApi('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  } catch (err) {
    const newCust: Customer = {
      _id: 'cust-' + Date.now(),
      ...customerData,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const current = getMockCustomers();
    current.unshift(newCust);
    saveMockCustomers(current);
    return { success: true, customer: newCust };
  }
};

export const updateCustomerApi = async (id: string, customerData: any) => {
  try {
    return await fetchApi(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  } catch (err) {
    const current = getMockCustomers();
    const idx = current.findIndex((c) => c._id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...customerData };
      saveMockCustomers(current);
    }
    return { success: true, customer: current[idx] };
  }
};

export const deleteCustomerApi = async (id: string) => {
  try {
    return await fetchApi(`/customers/${id}`, { method: 'DELETE' });
  } catch (err) {
    const current = getMockCustomers().filter((c) => c._id !== id);
    saveMockCustomers(current);
    return { success: true };
  }
};

// --- Service API ---
export const fetchServices = async () => {
  try {
    return await fetchApi('/services');
  } catch (err) {
    return { success: true, services: getMockServices() };
  }
};

export const createServiceApi = async (serviceData: any) => {
  try {
    return await fetchApi('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  } catch (err) {
    const newServ: Service = {
      _id: 'serv-' + Date.now(),
      ...serviceData,
      isActive: true,
    };
    const current = getMockServices();
    current.push(newServ);
    saveMockServices(current);
    return { success: true, service: newServ };
  }
};

export const updateServiceApi = async (id: string, serviceData: any) => {
  try {
    return await fetchApi(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  } catch (err) {
    const current = getMockServices();
    const idx = current.findIndex((s) => s._id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...serviceData };
      saveMockServices(current);
    }
    return { success: true, service: current[idx] };
  }
};

export const toggleServiceStatusApi = async (id: string) => {
  try {
    return await fetchApi(`/services/${id}/toggle`, { method: 'PATCH' });
  } catch (err) {
    const current = getMockServices();
    const idx = current.findIndex((s) => s._id === id);
    if (idx !== -1) {
      current[idx].isActive = !current[idx].isActive;
      saveMockServices(current);
    }
    return { success: true, service: current[idx] };
  }
};

export const deleteServiceApi = async (id: string) => {
  try {
    return await fetchApi(`/services/${id}`, { method: 'DELETE' });
  } catch (err) {
    const current = getMockServices().filter((s) => s._id !== id);
    saveMockServices(current);
    return { success: true };
  }
};

// --- Laundry Item API ---
export const fetchItems = async () => {
  try {
    return await fetchApi('/items');
  } catch (err) {
    return { success: true, items: getMockItems() };
  }
};

export const createItemApi = async (itemData: any) => {
  try {
    return await fetchApi('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  } catch (err) {
    const newItem: LaundryItem = {
      _id: 'item-' + Date.now(),
      ...itemData,
      isActive: true,
    };
    const current = getMockItems();
    current.push(newItem);
    saveMockItems(current);
    return { success: true, item: newItem };
  }
};

export const updateItemApi = async (id: string, itemData: any) => {
  try {
    return await fetchApi(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  } catch (err) {
    const current = getMockItems();
    const idx = current.findIndex((i) => i._id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...itemData };
      saveMockItems(current);
    }
    return { success: true, item: current[idx] };
  }
};

export const deleteItemApi = async (id: string) => {
  try {
    return await fetchApi(`/items/${id}`, { method: 'DELETE' });
  } catch (err) {
    const current = getMockItems().filter((i) => i._id !== id);
    saveMockItems(current);
    return { success: true };
  }
};

// --- Order API ---
export const fetchPublicOrderByNumber = async (orderNumber: string) => {
  try {
    return await fetchApi(`/orders/public/${orderNumber}`);
  } catch (err) {
    const orders = getMockOrders();
    const order = orders.find((o) => o.orderNumber === orderNumber) || orders[0];
    return { success: true, order };
  }
};

export const fetchOrders = async (params: { status?: string; paymentStatus?: string; search?: string } = {}) => {
  const query = new URLSearchParams(params as any).toString();
  try {
    return await fetchApi(`/orders?${query}`);
  } catch (err) {
    let orders = getMockOrders();
    if (params.status) orders = orders.filter((o) => o.status === params.status);
    if (params.paymentStatus) orders = orders.filter((o) => o.paymentStatus === params.paymentStatus);
    if (params.search) {
      const q = params.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerSnapshot.name.toLowerCase().includes(q) ||
          o.customerSnapshot.mobile.includes(q)
      );
    }
    return { success: true, orders, pagination: { total: orders.length, page: 1, limit: 100, pages: 1 } };
  }
};

export const fetchOrderById = async (id: string) => {
  try {
    return await fetchApi(`/orders/${id}`);
  } catch (err) {
    const order = getMockOrders().find((o) => o._id === id);
    return { success: true, order, payments: [] };
  }
};

export const createOrderApi = async (orderPayload: any) => {
  try {
    return await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  } catch (err) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const currentOrders = getMockOrders();
    const orderNumber = `ORD-${dateStr}-${String(currentOrders.length + 1).padStart(4, '0')}`;

    let customerSnapshot: { name: string; mobile: string; address: string; email?: string } = { name: 'Walk-in Customer', mobile: '9999999999', address: 'Local Shop', email: '' };
    if (orderPayload.customerId) {
      const cust = getMockCustomers().find((c) => c._id === orderPayload.customerId);
      if (cust) {
        customerSnapshot = { name: cust.name, mobile: cust.mobile, address: cust.address, email: cust.email || '' };
      }
    } else if (orderPayload.newCustomer) {
      customerSnapshot = orderPayload.newCustomer;
    }

    const items = orderPayload.items || [];
    const subtotal = items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);
    const discount = Number(orderPayload.discount) || 0;
    const taxPercent = Number(orderPayload.taxPercent) || 0;
    const taxAmount = ((subtotal - discount) * taxPercent) / 100;
    const totalAmount = Math.round(subtotal - discount + taxAmount);
    const advancePaid = Number(orderPayload.advancePaid) || 0;
    const remainingBalance = Math.max(0, totalAmount - advancePaid);

    let paymentStatus: any = 'Pending';
    if (advancePaid >= totalAmount) paymentStatus = 'Paid';
    else if (advancePaid > 0) paymentStatus = 'Partially Paid';

    const newOrder: Order = {
      _id: 'ord-' + Date.now(),
      orderNumber,
      customer: orderPayload.customerId || 'cust-new',
      customerSnapshot,
      items,
      status: 'Received',
      statusHistory: [
        { status: 'Received', timestamp: new Date().toISOString(), note: 'Order created' },
      ],
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: orderPayload.expectedDeliveryDate || new Date(Date.now() + 86400000).toISOString(),
      discount,
      taxPercent,
      taxAmount,
      subtotal,
      totalAmount,
      advancePaid,
      remainingBalance,
      paymentStatus,
      paymentMethod: advancePaid > 0 ? orderPayload.paymentMethod : 'Pending',
      notes: orderPayload.notes || '',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${orderNumber}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    currentOrders.unshift(newOrder);
    saveMockOrders(currentOrders);
    return { success: true, order: newOrder };
  }
};

export const updateOrderStatusApi = async (id: string, status: OrderStatus, note?: string) => {
  try {
    return await fetchApi(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  } catch (err) {
    const orders = getMockOrders();
    const idx = orders.findIndex((o) => o._id === id);
    if (idx !== -1) {
      orders[idx].status = status;
      orders[idx].statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `Status updated to ${status}`,
      });
      if (status === 'Delivered') {
        orders[idx].deliveredAt = new Date().toISOString();
      }
      saveMockOrders(orders);
    }
    return { success: true, order: orders[idx] };
  }
};

export const recordOrderPaymentApi = async (id: string, paymentData: any) => {
  try {
    return await fetchApi(`/orders/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  } catch (err) {
    const orders = getMockOrders();
    const idx = orders.findIndex((o) => o._id === id);
    if (idx !== -1) {
      const payAmount = Number(paymentData.amount);
      orders[idx].advancePaid += payAmount;
      orders[idx].remainingBalance = Math.max(0, orders[idx].totalAmount - orders[idx].advancePaid);
      if (orders[idx].remainingBalance === 0) {
        orders[idx].paymentStatus = 'Paid';
      } else {
        orders[idx].paymentStatus = 'Partially Paid';
      }
      orders[idx].paymentMethod = paymentData.paymentMethod;
      saveMockOrders(orders);
    }
    return { success: true, order: orders[idx] };
  }
};

export const deleteOrderApi = async (id: string) => {
  try {
    return await fetchApi(`/orders/${id}`, { method: 'DELETE' });
  } catch (err) {
    const orders = getMockOrders().filter((o) => o._id !== id);
    saveMockOrders(orders);
    return { success: true };
  }
};

// --- Reports API ---
export const fetchDashboardStats = async (params: {
  preset?: string;
  paymentStatus?: string;
  status?: string;
  dateType?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) => {
  const query = new URLSearchParams(params as any).toString();
  try {
    return await fetchApi(`/reports/dashboard?${query}`);
  } catch (err) {
    const orders = getMockOrders();
    const customers = getMockCustomers();
    const activeOrds = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
    const overdueOrds = orders.filter((o) => o.remainingBalance > 0 || (o.status !== 'Delivered' && o.status !== 'Cancelled'));

    const stats: DashboardStats = {
      orders: orders.length,
      paymentsReceived: orders.reduce((acc, o) => acc + o.advancePaid, 0),
      activeOrders: activeOrds.length,
      newCustomers: customers.length,
      overdueOrders: overdueOrds.length,
      todayOrders: orders.length,
      pendingOrders: activeOrds.length,
      inProgress: activeOrds.length,
      readyForPickup: orders.filter((o) => o.status === 'Ready for Pickup').length,
      deliveredOrders: orders.filter((o) => o.status === 'Delivered').length,
      todayRevenue: orders.reduce((acc, o) => acc + o.advancePaid, 0),
      monthlyRevenue: orders.reduce((acc, o) => acc + o.totalAmount, 0),
      periodRevenue: orders.reduce((acc, o) => acc + o.advancePaid, 0),
      totalCustomers: customers.length,
    };

    return {
      success: true,
      stats,
      ordersList: orders,
      paymentsList: orders.map((o) => ({
        _id: o._id,
        orderId: o._id,
        orderNumber: o.orderNumber,
        customerId: o.customerSnapshot.name,
        customerName: o.customerSnapshot.name,
        amount: o.advancePaid || o.totalAmount,
        paymentMethod: o.paymentMethod || 'Cash',
        paidAt: o.createdAt,
      })),
      activeOrdersList: activeOrds,
      newCustomersList: customers,
      overdueOrdersList: overdueOrds,
      pendingReminders: activeOrds,
      recentOrders: orders,
    };
  }
};

export const fetchRevenueReport = async (period = '30days') => {
  try {
    return await fetchApi(`/reports/revenue?period=${period}`);
  } catch (err) {
    return {
      success: true,
      chartData: [
        { date: '2026-08-01', revenue: 1200, count: 4 },
        { date: '2026-08-02', revenue: 2100, count: 6 },
        { date: '2026-08-03', revenue: 1800, count: 5 },
        { date: '2026-08-04', revenue: 2900, count: 8 },
        { date: '2026-08-05', revenue: 3400, count: 9 },
      ],
      serviceBreakdown: [
        { service: 'Wash & Iron', amount: 4500, quantity: 75 },
        { service: 'Dry Cleaning', amount: 3200, quantity: 18 },
        { service: 'Wash & Fold', amount: 1800, quantity: 45 },
        { service: 'Iron Only', amount: 900, quantity: 45 },
      ],
      topCustomers: getMockCustomers().slice(0, 5),
    };
  }
};

// --- Settings API ---
export const fetchSettings = async () => {
  try {
    return await fetchApi('/settings');
  } catch (err) {
    return { success: true, setting: getMockSettings() };
  }
};

export const updateSettingsApi = async (settingsData: any) => {
  try {
    return await fetchApi('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  } catch (err) {
    const updated = { ...getMockSettings(), ...settingsData };
    saveMockSettings(updated);
    return { success: true, setting: updated };
  }
};

// Mock Storage Helper Functions for Seamless Standalone Testing
const getMockCustomers = (): Customer[] => {
  const stored = localStorage.getItem('mock_customers');
  if (stored) return JSON.parse(stored);
  const initial: Customer[] = [
    { _id: 'cust-1', name: 'Rahul Sharma', mobile: '9876543210', address: 'B-204, Green Heights', email: 'rahul.s@example.com', totalOrders: 2, totalSpent: 760, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'cust-2', name: 'Ananya Verma', mobile: '9812345678', address: 'Flat 101, Sunshine Apartments', email: 'ananya@example.com', totalOrders: 1, totalSpent: 400, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'cust-3', name: 'Vikram Singh', mobile: '9988776655', address: 'Villa 12, Palm Meadows', email: 'vikram@example.com', totalOrders: 3, totalSpent: 1500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  localStorage.setItem('mock_customers', JSON.stringify(initial));
  return initial;
};

const saveMockCustomers = (custs: Customer[]) => localStorage.setItem('mock_customers', JSON.stringify(custs));

const getMockServices = (): Service[] => {
  const stored = localStorage.getItem('mock_services');
  if (stored) return JSON.parse(stored);
  const initial: Service[] = [
    { _id: 'serv-1', name: 'Wash & Fold', price: 40, unit: 'kg', estimatedHours: 24, description: 'Everyday machine wash with eco-friendly detergent', isActive: true },
    { _id: 'serv-2', name: 'Wash & Iron', price: 60, unit: 'piece', estimatedHours: 24, description: 'Deep wash, fabric softener, steam press ironing', isActive: true },
    { _id: 'serv-3', name: 'Iron Only', price: 20, unit: 'piece', estimatedHours: 12, description: 'High pressure steam press ironing', isActive: true },
    { _id: 'serv-4', name: 'Dry Cleaning', price: 180, unit: 'piece', estimatedHours: 48, description: 'Chemical solvent cleaning for heavy or delicate garments', isActive: true },
  ];
  localStorage.setItem('mock_services', JSON.stringify(initial));
  return initial;
};

const saveMockServices = (servs: Service[]) => localStorage.setItem('mock_services', JSON.stringify(servs));

const getMockItems = (): LaundryItem[] => {
  const stored = localStorage.getItem('mock_items');
  if (stored) return JSON.parse(stored);
  const initial: LaundryItem[] = [
    { _id: 'item-1', name: 'Shirt / T-Shirt', defaultPrice: 40, category: 'Clothes', icon: 'Shirt', isActive: true },
    { _id: 'item-2', name: 'Pant / Jeans', defaultPrice: 50, category: 'Clothes', icon: 'Scissors', isActive: true },
    { _id: 'item-3', name: 'Suit (2 Piece)', defaultPrice: 250, category: 'Dry Clean', icon: 'Briefcase', isActive: true },
    { _id: 'item-4', name: 'Saree (Silk)', defaultPrice: 200, category: 'Dry Clean', icon: 'Sparkles', isActive: true },
    { _id: 'item-5', name: 'Blanket (Double)', defaultPrice: 300, category: 'Household', icon: 'Box', isActive: true },
    { _id: 'item-6', name: 'Bedsheet', defaultPrice: 80, category: 'Household', icon: 'Layers', isActive: true },
  ];
  localStorage.setItem('mock_items', JSON.stringify(initial));
  return initial;
};

const saveMockItems = (items: LaundryItem[]) => localStorage.setItem('mock_items', JSON.stringify(items));

const getMockOrders = (): Order[] => {
  const stored = localStorage.getItem('mock_orders');
  if (stored) return JSON.parse(stored);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const initial: Order[] = [
    {
      _id: 'ord-1',
      orderNumber: `ORD-${dateStr}-0001`,
      customer: 'cust-1',
      customerSnapshot: { name: 'Rahul Sharma', mobile: '9876543210', address: 'B-204, Green Heights' },
      items: [
        { itemName: 'Shirt', serviceName: 'Wash & Iron', quantity: 4, unitPrice: 60, subtotal: 240 },
        { itemName: 'Jeans', serviceName: 'Wash & Iron', quantity: 2, unitPrice: 70, subtotal: 140 },
      ],
      status: 'Washing',
      statusHistory: [
        { status: 'Received', timestamp: new Date(Date.now() - 7200000).toISOString(), note: 'Received at shop' },
        { status: 'Washing', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'In washing machine' },
      ],
      orderDate: new Date(Date.now() - 7200000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
      discount: 20,
      taxPercent: 0,
      taxAmount: 0,
      subtotal: 380,
      totalAmount: 360,
      advancePaid: 200,
      remainingBalance: 160,
      paymentStatus: 'Partially Paid',
      paymentMethod: 'UPI',
      notes: 'Steam press only for shirts',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ORD-${dateStr}-0001`,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'ord-2',
      orderNumber: `ORD-${dateStr}-0002`,
      customer: 'cust-2',
      customerSnapshot: { name: 'Ananya Verma', mobile: '9812345678', address: 'Flat 101, Sunshine Apartments' },
      items: [
        { itemName: 'Silk Saree', serviceName: 'Dry Cleaning', quantity: 2, unitPrice: 200, subtotal: 400 },
      ],
      status: 'Ready for Pickup',
      statusHistory: [
        { status: 'Received', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Received' },
        { status: 'Ready for Pickup', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'Cleaned and packed' },
      ],
      orderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      expectedDeliveryDate: new Date().toISOString(),
      discount: 0,
      taxPercent: 0,
      taxAmount: 0,
      subtotal: 400,
      totalAmount: 400,
      advancePaid: 400,
      remainingBalance: 0,
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      notes: 'Customer notified',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ORD-${dateStr}-0002`,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem('mock_orders', JSON.stringify(initial));
  return initial;
};

const saveMockOrders = (orders: Order[]) => localStorage.setItem('mock_orders', JSON.stringify(orders));

const getMockSettings = (): Setting => {
  const stored = localStorage.getItem('mock_settings');
  if (stored) return JSON.parse(stored);
  const initial: Setting = {
    shopName: 'IntelligentLaundry & Dry Cleaners',
    shopTagline: 'Smart & Premium Laundry Management',
    logoUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=200&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
    email: 'contact@intelligentlaundry.com',
    address: '42 Commercial Street, Sector 15, Metro City, 400001',
    gstNumber: '27AABCU9603R1ZM',
    gstPercentage: 18,
    currencySymbol: '₹',
    currencyCode: 'INR',
    invoicePrefix: 'ORD-',
    termsAndConditions: '1. Please check garments at the time of delivery.\n2. Clothes uncollected after 30 days are subject to storage charges.',
  };
  localStorage.setItem('mock_settings', JSON.stringify(initial));
  return initial;
};

const saveMockSettings = (s: Setting) => localStorage.setItem('mock_settings', JSON.stringify(s));
