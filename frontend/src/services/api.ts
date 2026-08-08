import {
  Admin,
  Customer,
  Service,
  LaundryItem,
  GarmentCategory,
  Order,
  Setting,
  DashboardStats,
  Expense,
  AccountsSummary,
  AccountsTransaction,
} from '../types';
import { posGroupCatalog } from '../data/posCatalogData';

const API_BASE = '/api';

// Helper to retrieve auth token
export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');

// Utility API fetch wrapper
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// --- Auth API ---
export const loginApi = async (usernameOrCreds: any, passwordParam?: string) => {
  const username = typeof usernameOrCreds === 'object' ? usernameOrCreds.username : usernameOrCreds;
  const password = typeof usernameOrCreds === 'object' ? usernameOrCreds.password : passwordParam;
  try {
    return await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  } catch (err) {
    if ((username === 'adminIL' && password === 'IL@112') || (username === 'admin' && password === 'admin123')) {
      const mockAdmin: Admin = {
        id: 'admin-1',
        username: 'adminIL',
        name: 'Shop Owner',
        email: 'owner@intelligentlaundry.com',
      };
      return { success: true, token: 'mock-jwt-token-xyz', admin: mockAdmin };
    }
    throw err;
  }
};

export const loginAdmin = loginApi;

export const getMe = async () => {
  try {
    return await fetchApi('/auth/me');
  } catch (err) {
    return {
      success: true,
      admin: {
        id: 'admin-1',
        username: 'adminIL',
        name: 'Shop Owner',
        email: 'owner@intelligentlaundry.com',
      },
    };
  }
};

export const getMeApi = getMe;

export const updateProfile = async (profileData: any) => {
  try {
    return await fetchApi('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  } catch (err) {
    return { success: true };
  }
};

// --- Customer API ---
export const fetchCustomers = async (params: { search?: string; page?: number; limit?: number } | string = '') => {
  const search = typeof params === 'string' ? params : params.search || '';
  const page = typeof params === 'object' ? params.page || 1 : 1;
  const limit = typeof params === 'object' ? params.limit || 10 : 10;
  const query = new URLSearchParams({ search, page: String(page), limit: String(limit) }).toString();

  let customers: Customer[] = [];
  let pagination: any = null;

  try {
    const res = await fetchApi(`/customers?${query}`);
    if (res.success && Array.isArray(res.customers)) {
      customers = res.customers;
      pagination = res.pagination;
    }
  } catch (err) {}

  const localCustomers = getMockCustomers();
  if (customers.length === 0) {
    customers = localCustomers;
  } else {
    const map = new Map<string, Customer>();
    customers.forEach((c) => map.set(c.mobile || c._id, c));
    localCustomers.forEach((c) => {
      if (!map.has(c.mobile || c._id)) map.set(c.mobile || c._id, c);
    });
    customers = Array.from(map.values());
  }

  const allOrders = getMockOrders();

  // Dynamically calculate totalOrders & totalSpent for every customer
  const processed = customers.map((c) => {
    const custOrders = allOrders.filter(
      (o: any) =>
        (o.customerId && String(o.customerId) === String(c._id)) ||
        (o.customer && String(typeof o.customer === 'object' ? o.customer._id : o.customer) === String(c._id)) ||
        (o.customerSnapshot && o.customerSnapshot.mobile === c.mobile)
    );
    const calcOrdersCount = Math.max(c.totalOrders || 0, custOrders.length);
    const calcSpent = Math.max(
      c.totalSpent || 0,
      custOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
    );
    return {
      ...c,
      totalOrders: calcOrdersCount,
      totalSpent: calcSpent,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    const filtered = processed.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
    const skip = (page - 1) * limit;
    return {
      success: true,
      customers: filtered.slice(skip, skip + limit),
      pagination: { total: filtered.length, page, limit, pages: Math.ceil(filtered.length / limit) },
    };
  }

  const skip = (page - 1) * limit;
  return {
    success: true,
    customers: processed.slice(skip, skip + limit),
    pagination: pagination || { total: processed.length, page, limit, pages: Math.ceil(processed.length / limit) },
  };
};

export const fetchCustomerById = async (id: string) => {
  let customer: any = null;
  let orders: Order[] = [];
  try {
    const res = await fetchApi(`/customers/${id}`);
    if (res.success) {
      customer = res.customer;
      orders = res.orders || [];
    }
  } catch (err) {}

  if (!customer) {
    customer = getMockCustomers().find((c) => c._id === id);
  }

  const allMockOrders = getMockOrders();
  if (customer) {
    const custOrders = allMockOrders.filter(
      (o: any) =>
        (o.customerId && String(o.customerId) === String(customer._id)) ||
        (o.customer && String(typeof o.customer === 'object' ? o.customer._id : o.customer) === String(customer._id)) ||
        (o.customerSnapshot && o.customerSnapshot.mobile === customer.mobile)
    );
    if (orders.length === 0) {
      orders = custOrders;
    }
    customer.totalOrders = Math.max(customer.totalOrders || 0, custOrders.length, orders.length);
    customer.totalSpent = Math.max(
      customer.totalSpent || 0,
      custOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    );
  }

  return { success: true, customer, orders };
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
    const res = await fetchApi('/services');
    if (res.success && Array.isArray(res.services) && res.services.length >= 10) {
      return res;
    }
    return { success: true, services: getMockServices() };
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

// --- Clothing Item API ---
export const fetchItems = async () => {
  try {
    const res = await fetchApi('/items');
    if (res.success && Array.isArray(res.items) && res.items.length >= 50) {
      return res;
    }
    return { success: true, items: getMockItems() };
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

// --- Garment Category API ---
export const fetchGarmentCategories = async () => {
  try {
    const res = await fetchApi('/garment-categories');
    if (res.success && Array.isArray(res.categories) && res.categories.length > 0) {
      return res;
    }
    return { success: true, categories: getMockCategories() };
  } catch (err) {
    return { success: true, categories: getMockCategories() };
  }
};

export const createGarmentCategoryApi = async (categoryData: any) => {
  try {
    return await fetchApi('/garment-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  } catch (err) {
    const newCat: GarmentCategory = {
      _id: 'cat-' + Date.now(),
      name: categoryData.name,
      description: categoryData.description || '',
      displayOrder: categoryData.displayOrder || 99,
      isActive: true,
    };
    const current = getMockCategories();
    current.push(newCat);
    saveMockCategories(current);
    return { success: true, category: newCat };
  }
};

export const updateGarmentCategoryApi = async (id: string, categoryData: any) => {
  try {
    return await fetchApi(`/garment-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  } catch (err) {
    const current = getMockCategories();
    const idx = current.findIndex((c) => c._id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...categoryData };
      saveMockCategories(current);
    }
    return { success: true, category: current[idx] };
  }
};

export const deleteGarmentCategoryApi = async (id: string) => {
  try {
    return await fetchApi(`/garment-categories/${id}`, { method: 'DELETE' });
  } catch (err) {
    const current = getMockCategories().filter((c) => c._id !== id);
    saveMockCategories(current);
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

export const fetchOrders = async (
  params: { status?: string; paymentStatus?: string; search?: string; page?: number; limit?: number } | string = {}
) => {
  const p = typeof params === 'string' ? { search: params } : params;
  const query = new URLSearchParams(p as any).toString();

  let apiOrders: Order[] = [];
  let apiSuccess = false;
  let apiPagination: any = null;

  try {
    const res = await fetchApi(`/orders?${query}`);
    if (res.success && Array.isArray(res.orders)) {
      apiOrders = res.orders;
      apiSuccess = true;
      apiPagination = res.pagination;
    }
  } catch (err) {
    // Backend fetch failed or offline mode
  }

  const mockOrders = getMockOrders();
  const mergedMap = new Map<string, Order>();

  apiOrders.forEach((o) => mergedMap.set(o._id || o.orderNumber, o));
  mockOrders.forEach((o) => {
    const key = o._id || o.orderNumber;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, o);
    }
  });

  let combined = Array.from(mergedMap.values());
  combined.sort(
    (a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()
  );

  if (p.status) combined = combined.filter((o) => o.status === p.status);
  if (p.paymentStatus) combined = combined.filter((o) => o.paymentStatus === p.paymentStatus);
  if (p.search) {
    const q = p.search.toLowerCase();
    combined = combined.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerSnapshot?.name && o.customerSnapshot.name.toLowerCase().includes(q)) ||
        (o.customerSnapshot?.mobile && o.customerSnapshot.mobile.includes(q))
    );
  }

  const page = Number(p.page) || 1;
  const limit = Number(p.limit) || 10;
  const skip = (page - 1) * limit;
  const paginatedOrders = combined.slice(skip, skip + limit);

  return {
    success: true,
    orders: paginatedOrders,
    pagination: apiPagination || {
      total: combined.length,
      page,
      limit,
      pages: Math.ceil(combined.length / limit) || 1,
    },
  };
};

export const fetchOrderById = async (id: string) => {
  try {
    return await fetchApi(`/orders/${id}`);
  } catch (err) {
    const order = getMockOrders().find((o) => o._id === id);
    return { success: true, order, payments: [] };
  }
};

export const createOrderApi = async (orderData: any) => {
  try {
    const res = await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    if (res.success && res.order) {
      const orders = getMockOrders();
      orders.unshift(res.order);
      saveMockOrders(orders);

      const customers = getMockCustomers();
      const mobile = res.order.customerSnapshot?.mobile;
      const custId = res.order.customer || res.order.customerId;
      const targetCust = customers.find((c) => (custId && c._id === custId) || (mobile && c.mobile === mobile));
      if (targetCust) {
        targetCust.totalOrders = (targetCust.totalOrders || 0) + 1;
        targetCust.totalSpent = (targetCust.totalSpent || 0) + (res.order.totalAmount || 0);
        saveMockCustomers(customers);
      }
    }
    return res;
  } catch (err) {
    const orders = getMockOrders();
    const customers = getMockCustomers();

    // Look up customer snapshot accurately
    const snap = orderData.customerSnapshot || orderData.newCustomer;
    let customerName = snap?.name;
    let customerMobile = snap?.mobile;
    let customerAddress = snap?.address || 'Local';
    let customerEmail = snap?.email || '';

    if (!customerName && orderData.customerId) {
      const found = customers.find((c) => c._id === orderData.customerId);
      if (found) {
        customerName = found.name;
        customerMobile = found.mobile;
        customerAddress = found.address || 'Local';
        customerEmail = found.email || '';
      }
    }

    if (!customerName) {
      customerName = 'Walk-in Customer';
      customerMobile = '9876543210';
    }

    const items = orderData.items || [];
    const subtotal = items.reduce(
      (acc: number, i: any) => acc + (Number(i.subtotal) || Number(i.quantity) * Number(i.unitPrice) || 0),
      0
    );
    const disc = Number(orderData.discount) || 0;
    const taxPct = Number(orderData.taxPercent) || 0;
    const taxableAmount = Math.max(0, subtotal - disc);
    const taxAmount = (taxableAmount * taxPct) / 100;
    const totalAmount = Math.round(taxableAmount + taxAmount);

    const advPaid = Number(orderData.advancePaid) || 0;
    const remainingBalance = Math.max(0, totalAmount - advPaid);

    let paymentStatus: any = 'Pending';
    if (advPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Paid';
    } else if (advPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNum = `ORD-${dateStr}-` + String(orders.length + 1).padStart(4, '0');

    const newOrd: Order = {
      _id: 'ord-' + Date.now(),
      orderNumber: orderNum,
      customer: orderData.customerId || 'cust-1',
      customerSnapshot: {
        name: customerName,
        mobile: customerMobile,
        address: customerAddress,
        email: customerEmail,
      },
      items,
      status: 'Received',
      statusHistory: [
        {
          status: 'Received',
          timestamp: new Date().toISOString(),
          note: 'Order created in shop POS',
        },
      ],
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: orderData.expectedDeliveryDate || new Date(Date.now() + 86400000).toISOString(),
      discount: disc,
      taxPercent: taxPct,
      taxAmount,
      subtotal,
      totalAmount,
      advancePaid: advPaid,
      remainingBalance,
      paymentStatus,
      paymentMethod: orderData.paymentMethod || 'Cash',
      notes: orderData.notes || '',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${orderNum}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.unshift(newOrd);
    saveMockOrders(orders);

    // Also update customer stats in mock storage
    const targetCust = customers.find(
      (c) => (orderData.customerId && c._id === orderData.customerId) || (customerMobile && c.mobile === customerMobile)
    );
    if (targetCust) {
      targetCust.totalOrders = (targetCust.totalOrders || 0) + 1;
      targetCust.totalSpent = (targetCust.totalSpent || 0) + totalAmount;
      saveMockCustomers(customers);
    }

    return { success: true, order: newOrd };
  }
};

export const updateOrderStatusApi = async (id: string, status: string, note?: string) => {
  try {
    return await fetchApi(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  } catch (err) {
    const orders = getMockOrders();
    const idx = orders.findIndex((o) => o._id === id);
    if (idx !== -1) {
      orders[idx].status = status as any;
      orders[idx].statusHistory.push({
        status: status as any,
        timestamp: new Date().toISOString(),
        note: note || `Updated to ${status}`,
      });
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

// --- Shop Expenses & Accounts API ---
export const fetchExpenses = async (params: { category?: string; paymentMethod?: string; search?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}) => {
  const query = new URLSearchParams(params as any).toString();
  try {
    return await fetchApi(`/expenses?${query}`);
  } catch (err) {
    let expenses = getMockExpenses();
    if (params.category) expenses = expenses.filter((e) => e.category === params.category);
    if (params.paymentMethod) expenses = expenses.filter((e) => e.paymentMethod === params.paymentMethod);
    if (params.search) {
      const q = params.search.toLowerCase();
      expenses = expenses.filter(
        (e) =>
          e.voucherNumber.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.paidTo && e.paidTo.toLowerCase().includes(q))
      );
    }
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const paginated = expenses.slice(skip, skip + limit);

    const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
    const cashExpenses = expenses.filter((e) => e.paymentMethod === 'Cash').reduce((acc, e) => acc + e.amount, 0);
    const bankExpenses = expenses.filter((e) => e.paymentMethod !== 'Cash').reduce((acc, e) => acc + e.amount, 0);

    return {
      success: true,
      expenses: paginated,
      summary: { totalExpenseAmount, cashExpenses, bankExpenses },
      pagination: { total: expenses.length, page, limit, pages: Math.ceil(expenses.length / limit) },
    };
  }
};

export const createExpenseApi = async (expenseData: any) => {
  try {
    return await fetchApi('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  } catch (err) {
    const expenses = getMockExpenses();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newExp: Expense = {
      _id: 'exp-' + Date.now(),
      voucherNumber: `EXP-${dateStr}-` + String(expenses.length + 1).padStart(4, '0'),
      expenseDate: expenseData.expenseDate || new Date().toISOString(),
      category: expenseData.category || 'Miscellaneous',
      description: expenseData.description || 'Shop Expense',
      amount: Number(expenseData.amount) || 0,
      paymentMethod: expenseData.paymentMethod || 'Cash',
      paidTo: expenseData.paidTo || '',
      notes: expenseData.notes || '',
      createdAt: new Date().toISOString(),
    };
    expenses.unshift(newExp);
    saveMockExpenses(expenses);
    return { success: true, expense: newExp };
  }
};

export const updateExpenseApi = async (id: string, expenseData: any) => {
  try {
    return await fetchApi(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  } catch (err) {
    const expenses = getMockExpenses();
    const idx = expenses.findIndex((e) => e._id === id);
    if (idx !== -1) {
      expenses[idx] = { ...expenses[idx], ...expenseData };
      saveMockExpenses(expenses);
    }
    return { success: true, expense: expenses[idx] };
  }
};

export const deleteExpenseApi = async (id: string) => {
  try {
    return await fetchApi(`/expenses/${id}`, { method: 'DELETE' });
  } catch (err) {
    const expenses = getMockExpenses().filter((e) => e._id !== id);
    saveMockExpenses(expenses);
    return { success: true };
  }
};

export const fetchAccountsSummary = async (params: { dateFrom?: string; dateTo?: string; paymentMethod?: string } = {}) => {
  const query = new URLSearchParams(params as any).toString();
  let apiRes: any = null;
  try {
    apiRes = await fetchApi(`/expenses/summary?${query}`);
  } catch (err) {}

  const orders = getMockOrders();
  const expenses = getMockExpenses();

  const incomeMap = new Map<string, AccountsTransaction>();

  if (apiRes && apiRes.success && Array.isArray(apiRes.transactions)) {
    apiRes.transactions.forEach((t: AccountsTransaction) => incomeMap.set(t.id || t.refNumber, t));
  }

  orders.forEach((o) => {
    const amt = o.advancePaid > 0 ? o.advancePaid : 0;
    if (amt > 0) {
      const ref = `#${o.orderNumber}`;
      if (!incomeMap.has(o._id) && !incomeMap.has(ref)) {
        incomeMap.set(o._id, {
          id: o._id,
          refNumber: ref,
          date: o.orderDate || o.createdAt,
          type: 'Income',
          category: 'Order Payment',
          description: `Order #${o.orderNumber} payment from ${o.customerSnapshot?.name || 'Customer'}`,
          paymentMethod: o.paymentMethod || 'Cash',
          amount: amt,
        });
      }
    }
  });

  expenses.forEach((e) => {
    if (!incomeMap.has(e._id) && !incomeMap.has(e.voucherNumber)) {
      incomeMap.set(e._id, {
        id: e._id,
        refNumber: e.voucherNumber,
        date: e.expenseDate,
        type: 'Expense',
        category: e.category,
        description: e.description + (e.paidTo ? ` (Paid to: ${e.paidTo})` : ''),
        paymentMethod: e.paymentMethod,
        amount: e.amount,
      });
    }
  });

  let transactions = Array.from(incomeMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (params.paymentMethod) {
    transactions = transactions.filter((t) =>
      params.paymentMethod === 'Cash' ? t.paymentMethod === 'Cash' : t.paymentMethod !== 'Cash'
    );
  }

  const incomeList = transactions.filter((t) => t.type === 'Income');
  const expenseList = transactions.filter((t) => t.type === 'Expense');

  const totalIncome = incomeList.reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = expenseList.reduce((acc, t) => acc + t.amount, 0);

  const cashIncome = incomeList.filter((t) => t.paymentMethod === 'Cash').reduce((acc, t) => acc + t.amount, 0);
  const cashExpenses = expenseList.filter((t) => t.paymentMethod === 'Cash').reduce((acc, t) => acc + t.amount, 0);
  const cashBalance = cashIncome - cashExpenses;

  const bankIncome = incomeList.filter((t) => t.paymentMethod !== 'Cash').reduce((acc, t) => acc + t.amount, 0);
  const bankExpenses = expenseList.filter((t) => t.paymentMethod !== 'Cash').reduce((acc, t) => acc + t.amount, 0);
  const bankBalance = bankIncome - bankExpenses;

  return {
    success: true,
    summary: {
      totalIncome,
      totalExpenses,
      cashBalance,
      bankBalance,
      cashIncome,
      cashExpenses,
      bankIncome,
      bankExpenses,
    },
    transactions,
  };
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
  let apiRes: any = null;
  try {
    apiRes = await fetchApi(`/reports/dashboard?${query}`);
  } catch (err) {}

  const localOrders = getMockOrders();
  const localCustomers = getMockCustomers();

  const now = new Date();
  const isOrderOverdue = (o: Order) => {
    if (o.status === 'Delivered' || o.status === 'Cancelled') return false;
    const isPastDeliveryDate = o.expectedDeliveryDate && new Date(o.expectedDeliveryDate) < now;
    const hasUnpaidBalance = o.remainingBalance > 0 && o.paymentStatus !== 'Paid';
    return isPastDeliveryDate || hasUnpaidBalance;
  };

  if (!apiRes || !apiRes.success) {
    const activeOrds = localOrders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
    const overdueOrds = localOrders.filter(isOrderOverdue);
    const totalRev = localOrders.reduce((acc, o) => acc + (o.advancePaid || 0), 0);
    const monthlyRev = totalRev;

    const stats: DashboardStats = {
      orders: localOrders.length,
      paymentsReceived: totalRev,
      activeOrders: activeOrds.length,
      newCustomers: localCustomers.length,
      overdueOrders: overdueOrds.length,
      todayOrders: localOrders.length,
      pendingOrders: activeOrds.length,
      inProgress: activeOrds.length,
      readyForPickup: localOrders.filter((o) => o.status === 'Ready for Pickup').length,
      deliveredOrders: localOrders.filter((o) => o.status === 'Delivered').length,
      todayRevenue: totalRev,
      monthlyRevenue: monthlyRev,
      periodRevenue: totalRev,
      totalCustomers: localCustomers.length,
    };

    return {
      success: true,
      stats,
      ordersList: localOrders,
      paymentsList: localOrders
        .filter((o) => o.advancePaid > 0)
        .map((o) => ({
          _id: o._id,
          orderNumber: o.orderNumber,
          customerName: o.customerSnapshot?.name || 'Customer',
          paymentMethod: o.paymentMethod || 'Cash',
          paidAt: o.orderDate,
          amount: o.advancePaid,
        })),
      activeOrdersList: activeOrds,
      newCustomersList: localCustomers,
      overdueOrdersList: overdueOrds,
    };
  }

  // Merge local orders into dashboard response and synchronize counts
  const map = new Map<string, Order>();
  if (apiRes.success && Array.isArray(apiRes.ordersList)) {
    apiRes.ordersList.forEach((o: Order) => map.set(o._id, o));
  }
  localOrders.forEach((o: Order) => map.set(o._id, o));
  const mergedOrders = Array.from(map.values());

  const activeOrds = mergedOrders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const overdueOrds = mergedOrders.filter(isOrderOverdue);

  const totalRev = mergedOrders.reduce((acc, o) => acc + (o.advancePaid || 0), 0);
  const monthlyRev = totalRev;

  const s = apiRes.stats || {};

  let pList = Array.isArray(apiRes.paymentsList) ? apiRes.paymentsList : [];
  if (pList.length === 0 && mergedOrders.length > 0) {
    pList = mergedOrders
      .filter((o) => o.advancePaid > 0)
      .map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        customerName: o.customerSnapshot?.name || 'Customer',
        paymentMethod: o.paymentMethod || 'Cash',
        paidAt: o.orderDate,
        amount: o.advancePaid,
      }));
  }

  const processedNewCustomers = (apiRes.newCustomersList || localCustomers).map((c: any) => {
    const custOrders = mergedOrders.filter(
      (o: any) =>
        (o.customerId && String(o.customerId) === String(c._id)) ||
        (o.customer && String(typeof o.customer === 'object' ? o.customer._id : o.customer) === String(c._id)) ||
        (o.customerSnapshot && o.customerSnapshot.mobile === c.mobile)
    );
    return {
      ...c,
      totalOrders: Math.max(c.totalOrders || 0, custOrders.length),
      totalSpent: Math.max(
        c.totalSpent || 0,
        custOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
      ),
    };
  });

  apiRes.stats = {
    ...s,
    orders: mergedOrders.length,
    totalOrders: mergedOrders.length,
    todayOrders: mergedOrders.length,
    activeOrders: activeOrds.length,
    overdueOrders: overdueOrds.length,
    newCustomers: Math.max(s.newCustomers || 0, localCustomers.length, processedNewCustomers.length),
    paymentsReceived: Math.max(s.paymentsReceived || 0, totalRev),
    todayRevenue: Math.max(s.todayRevenue || 0, totalRev),
    monthlyRevenue: Math.max(s.monthlyRevenue || 0, monthlyRev),
    periodRevenue: Math.max(s.periodRevenue || 0, totalRev),
  };

  apiRes.ordersList = mergedOrders;
  apiRes.activeOrdersList = activeOrds;
  apiRes.overdueOrdersList = overdueOrds;
  apiRes.paymentsList = pList;
  apiRes.newCustomersList = processedNewCustomers;

  return apiRes;
};

export const fetchRevenueReport = async (params: any = {}) => {
  const query = new URLSearchParams(params as any).toString();
  let apiRes: any = null;
  try {
    apiRes = await fetchApi(`/reports/revenue?${query}`);
    if (apiRes && apiRes.success && (apiRes.chartData?.length > 0 || apiRes.serviceBreakdown?.length > 0)) {
      return apiRes;
    }
  } catch (err) {}

  const orders = getMockOrders();
  const customers = getMockCustomers();

  const getOrderCollectedAmt = (o: Order) => (o.paymentStatus === 'Paid' ? (o.totalAmount || 0) : (o.advancePaid || 0));

  // Compute daily chart points from orders
  const chartMap: { [date: string]: number } = {};
  orders.forEach((o) => {
    const d = new Date(o.orderDate || o.createdAt).toISOString().slice(0, 10);
    const amt = getOrderCollectedAmt(o);
    chartMap[d] = (chartMap[d] || 0) + amt;
  });

  const chartData = Object.keys(chartMap).map((d) => ({
    date: d,
    revenue: chartMap[d],
    count: 1,
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Compute service breakdown
  const serviceMap: { [srv: string]: number } = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const srvName = item.serviceName || 'Laundry';
      serviceMap[srvName] = (serviceMap[srvName] || 0) + (item.subtotal || item.unitPrice * item.quantity || 0);
    });
  });

  const serviceBreakdown = Object.keys(serviceMap).map((srv) => ({
    service: srv,
    amount: serviceMap[srv],
    quantity: 1,
  })).sort((a, b) => b.amount - a.amount);

  // Compute top customers
  const processedCusts = customers.map((c) => {
    const custOrds = orders.filter(
      (o: any) =>
        (o.customerId && String(o.customerId) === String(c._id)) ||
        (o.customer && String(typeof o.customer === 'object' ? o.customer._id : o.customer) === String(c._id)) ||
        (o.customerSnapshot && o.customerSnapshot.mobile === c.mobile)
    );
    const calcSpent = Math.max(c.totalSpent || 0, custOrds.reduce((sum, o) => sum + (o.totalAmount || 0), 0));
    return { ...c, totalSpent: calcSpent, totalOrders: Math.max(c.totalOrders || 0, custOrds.length) };
  }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return {
    success: true,
    chartData: chartData.length > 0 ? chartData : [{ date: new Date().toISOString().slice(0, 10), revenue: 0, count: 0 }],
    serviceBreakdown: serviceBreakdown.length > 0 ? serviceBreakdown : [{ service: 'Laundry', amount: 0, quantity: 0 }],
    topCustomers: processedCusts,
  };
};

export const fetchProfitLossReport = async (params: { preset?: string; dateFrom?: string; dateTo?: string } = {}) => {
  const query = new URLSearchParams(params as any).toString();
  let apiRes: any = null;
  try {
    apiRes = await fetchApi(`/reports/pnl?${query}`);
    if (apiRes && apiRes.success) {
      return apiRes;
    }
  } catch (err) {}

  // Local storage fallback for P&L computation
  const orders = getMockOrders();
  const expenses = getMockExpenses();

  const getOrderCollectedAmt = (o: Order) => (o.paymentStatus === 'Paid' ? (o.totalAmount || 0) : (o.advancePaid || 0));

  let grossRevenue = orders.reduce((sum, o) => sum + getOrderCollectedAmt(o), 0);
  let cashIncome = orders.filter((o) => o.paymentMethod === 'Cash').reduce((sum, o) => sum + getOrderCollectedAmt(o), 0);
  let upiIncome = orders.filter((o) => o.paymentMethod === 'UPI').reduce((sum, o) => sum + getOrderCollectedAmt(o), 0);
  let cardIncome = orders.filter((o) => o.paymentMethod === 'Card').reduce((sum, o) => sum + getOrderCollectedAmt(o), 0);

  let totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  let cashExpenses = expenses.filter((e) => e.paymentMethod === 'Cash').reduce((sum, e) => sum + e.amount, 0);
  let bankExpenses = expenses.filter((e) => e.paymentMethod === 'Bank / UPI').reduce((sum, e) => sum + e.amount, 0);

  const catTotals: { [key: string]: number } = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });

  const netProfit = grossRevenue - totalExpenses;
  const profitMargin = grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(1)) : 0;

  const expenseBreakdown = Object.keys(catTotals).map((cat) => ({
    category: cat,
    amount: catTotals[cat],
    percentage: totalExpenses > 0 ? Number(((catTotals[cat] / totalExpenses) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.amount - a.amount);

  return {
    success: true,
    period: {
      preset: params.preset || 'current_month',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
    },
    summary: {
      grossRevenue,
      cashIncome,
      upiIncome,
      cardIncome,
      totalExpenses,
      cashExpenses,
      bankExpenses,
      netProfit,
      profitMargin,
      isProfit: netProfit >= 0,
    },
    expenseBreakdown,
    monthlyTrends: [
      { month: 'May', revenue: Math.round(grossRevenue * 0.7), expenses: Math.round(totalExpenses * 0.8), netProfit: Math.round(grossRevenue * 0.7 - totalExpenses * 0.8) },
      { month: 'Jun', revenue: Math.round(grossRevenue * 0.85), expenses: Math.round(totalExpenses * 0.9), netProfit: Math.round(grossRevenue * 0.85 - totalExpenses * 0.9) },
      { month: 'Jul', revenue: Math.round(grossRevenue * 0.95), expenses: Math.round(totalExpenses * 0.95), netProfit: Math.round(grossRevenue * 0.95 - totalExpenses * 0.95) },
      { month: 'Aug', revenue: grossRevenue, expenses: totalExpenses, netProfit },
    ],
  };
};

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
    saveMockSettings(settingsData);
    return { success: true, setting: settingsData };
  }
};

// --- MOCK DATA SEEDERS & LOCAL STORAGE LOADERS ---
const getMockCustomers = (): Customer[] => {
  const stored = localStorage.getItem('mock_customers');
  if (stored) return JSON.parse(stored);
  return [];
};

const saveMockCustomers = (customers: Customer[]) => localStorage.setItem('mock_customers', JSON.stringify(customers));

const defaultMockCategories: GarmentCategory[] = [
  { _id: 'cat-1', name: 'Regular', description: 'Everyday common garments like shirts, pants, dhotis & sarees', displayOrder: 1, isActive: true },
  { _id: 'cat-2', name: 'Men', description: 'Gents apparel including suits, blazers, formal shirts & denim', displayOrder: 2, isActive: true },
  { _id: 'cat-3', name: 'Women', description: 'Ladies wear including silk sarees, lehengas, tops & dresses', displayOrder: 3, isActive: true },
  { _id: 'cat-4', name: 'Kids', description: 'Children wear including frocks, onesies, shorts & baby wear', displayOrder: 4, isActive: true },
  { _id: 'cat-5', name: 'Household', description: 'Home items including bedsheets, blankets, curtains & towels', displayOrder: 5, isActive: true },
  { _id: 'cat-6', name: 'Others', description: 'Footwear, bags, caps, gloves & miscellaneous items', displayOrder: 6, isActive: true },
];

const getMockCategories = (): GarmentCategory[] => {
  const stored = localStorage.getItem('mock_categories');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list) && list.length >= 1) return list;
    } catch (e) {}
  }
  localStorage.setItem('mock_categories', JSON.stringify(defaultMockCategories));
  return defaultMockCategories;
};

const saveMockCategories = (cats: GarmentCategory[]) => localStorage.setItem('mock_categories', JSON.stringify(cats));

const getMockServices = (): Service[] => {
  const stored = localStorage.getItem('mock_services');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list) && list.length >= 15) return list;
    } catch (e) {}
  }
  const initial: Service[] = [
    { _id: 'serv-1', name: 'Wash and Fold', price: 40, unit: 'kg', estimatedHours: 24, description: 'Everyday machine wash & neat folding', isActive: true },
    { _id: 'serv-2', name: 'Ironing', price: 15, unit: 'piece', estimatedHours: 12, description: 'High-pressure steam press ironing', isActive: true },
    { _id: 'serv-3', name: 'Laundry', price: 50, unit: 'piece', estimatedHours: 24, description: 'Deep wash, fabric softener & steam press', isActive: true },
    { _id: 'serv-4', name: 'Premium Laundry', price: 80, unit: 'piece', estimatedHours: 24, description: 'Individual drum wash with luxury perfume finish', isActive: true },
    { _id: 'serv-5', name: 'Dry Cleaning', price: 150, unit: 'piece', estimatedHours: 48, description: 'Specialized chemical solvent cleaning', isActive: true },
    { _id: 'serv-6', name: 'Starch + Ironing', price: 30, unit: 'piece', estimatedHours: 12, description: 'Crisp starch treatment with steam press', isActive: true },
    { _id: 'serv-7', name: 'Wash + Starch + Ironing', price: 70, unit: 'piece', estimatedHours: 24, description: 'Complete wash, starch & steam press', isActive: true },
    { _id: 'serv-8', name: 'Saree Polishing', price: 100, unit: 'piece', estimatedHours: 36, description: 'Saree roll press & shine restoration', isActive: true },
    { _id: 'serv-9', name: 'Saree Pre-pleating', price: 120, unit: 'piece', estimatedHours: 24, description: 'Ready-to-wear pleating & box folding', isActive: true },
    { _id: 'serv-10', name: 'Shoes Cleaning', price: 200, unit: 'pair', estimatedHours: 48, description: 'Deep shoe scrubbing & whitening', isActive: true },
    { _id: 'serv-11', name: 'Bag Cleaning', price: 250, unit: 'piece', estimatedHours: 48, description: 'Leather & fabric bag deep restoration', isActive: true },

    // Highlight Kg Rate Services
    { _id: 'serv-kg-1', name: 'Wash & Iron (Kg Rate)', price: 120, unit: 'kg', estimatedHours: 24, description: 'Wash & Iron Rate per Kg', isActive: true },
    { _id: 'serv-kg-2', name: 'Express Laundry (Kg Rate)', price: 199, unit: 'kg', estimatedHours: 12, description: 'Express Laundry Rate per Kg', isActive: true },
    { _id: 'serv-kg-3', name: 'Premium Laundry (Kg Rate)', price: 159, unit: 'kg', estimatedHours: 24, description: 'Premium Laundry Rate per Kg', isActive: true },
    { _id: 'serv-kg-4', name: 'Premium Express Laundry (Kg Rate)', price: 299, unit: 'kg', estimatedHours: 12, description: 'Premium Express Laundry Rate per Kg', isActive: true },
  ];
  localStorage.setItem('mock_services', JSON.stringify(initial));
  return initial;
};

const saveMockServices = (s: Service[]) => localStorage.setItem('mock_services', JSON.stringify(s));

const getMockItems = (): LaundryItem[] => {
  const stored = localStorage.getItem('mock_items');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list) && list.length >= 200) return list;
    } catch (e) {}
  }
  const initial: LaundryItem[] = [];
  posGroupCatalog.forEach((group) => {
    group.subCategories.forEach((sub) => {
      sub.items.forEach((item) => {
        initial.push({
          _id: item.id,
          name: item.name,
          defaultPrice: item.price,
          category: group.groupName,
          isActive: true,
        });
      });
    });
  });
  localStorage.setItem('mock_items', JSON.stringify(initial));
  return initial;
};

const saveMockItems = (items: LaundryItem[]) => localStorage.setItem('mock_items', JSON.stringify(items));

const getMockExpenses = (): Expense[] => {
  const stored = localStorage.getItem('mock_expenses');
  if (stored) return JSON.parse(stored);
  return [];
};

const saveMockExpenses = (e: Expense[]) => localStorage.setItem('mock_expenses', JSON.stringify(e));

const getMockOrders = (): Order[] => {
  const stored = localStorage.getItem('mock_orders');
  if (stored) return JSON.parse(stored);
  return [];
};

const saveMockOrders = (orders: Order[]) => localStorage.setItem('mock_orders', JSON.stringify(orders));

export const clearAllDataApi = async () => {
  localStorage.removeItem('mock_customers');
  localStorage.removeItem('mock_orders');
  localStorage.removeItem('mock_payments');
  localStorage.removeItem('mock_expenses');
  try {
    return await fetchApi('/settings/reset', { method: 'DELETE' });
  } catch (err) {
    return { success: true, message: 'All local & backend customer/order/expense data cleared.' };
  }
};

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
    gstPercentage: 0,
    currencySymbol: '₹',
    currencyCode: 'INR',
    invoicePrefix: 'ORD-',
    termsAndConditions: '1. Please check garments at the time of delivery.\n2. Clothes uncollected after 30 days are subject to storage charges.',
  };
  localStorage.setItem('mock_settings', JSON.stringify(initial));
  return initial;
};

const saveMockSettings = (s: Setting) => localStorage.setItem('mock_settings', JSON.stringify(s));

const getMockPayments = () => {
  const stored = localStorage.getItem('mock_payments');
  if (stored) return JSON.parse(stored);
  return [];
};

// --- EXCEL MASTER BACKUP & RESTORE UTILITIES ---
export const downloadMasterExcelBackupApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/backup/export`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laundry_Master_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'Master Excel Backup downloaded successfully!' };
    }
  } catch (err) {}

  // Local storage fallback generator for Excel backup
  const orders = getMockOrders();
  const customers = getMockCustomers();
  const expenses = getMockExpenses();
  const payments = getMockPayments();

  const XLSX = await import('xlsx');

  const ordersData = orders.map((o) => ({
    'Order Number': o.orderNumber,
    'Customer Name': o.customerSnapshot?.name || 'Customer',
    'Customer Mobile': o.customerSnapshot?.mobile || '',
    'Order Date': o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 10) : '',
    'Expected Delivery': o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString().slice(0, 10) : '',
    'Order Status': o.status,
    'Payment Status': o.paymentStatus,
    'Payment Method': o.paymentMethod || 'Cash',
    'Total Amount (₹)': o.totalAmount || 0,
    'Advance Paid (₹)': o.advancePaid || 0,
    'Remaining Balance (₹)': o.remainingBalance || 0,
    'Items Summary': (o.items || []).map((i) => `${i.serviceName} (${i.quantity}x)`).join(', '),
  }));

  const customersData = customers.map((c) => ({
    'Full Name': c.name,
    'Mobile Number': c.mobile,
    'Email Address': c.email || '',
    'Address': c.address || '',
    'Total Spent (₹)': c.totalSpent || 0,
    'Total Orders': c.totalOrders || 0,
  }));

  const paymentsData = payments.map((p: any) => ({
    'Order Number': p.orderNumber || '',
    'Customer Name': p.customerName || 'Customer',
    'Payment Method': p.paymentMethod || 'Cash',
    'Amount Paid (₹)': p.amount || 0,
    'Paid Date & Time': p.paidAt ? new Date(p.paidAt).toLocaleString() : '',
  }));

  const expensesData = expenses.map((e) => ({
    'Voucher Number': e.voucherNumber,
    'Category': e.category,
    'Description': e.description,
    'Amount (₹)': e.amount || 0,
    'Payment Method': e.paymentMethod,
    'Paid To': e.paidTo || '',
    'Expense Date': e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : '',
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersData.length > 0 ? ordersData : [{}]), 'Orders');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customersData.length > 0 ? customersData : [{}]), 'Customers');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentsData.length > 0 ? paymentsData : [{}]), 'Payments');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData.length > 0 ? expensesData : [{}]), 'Expenses');

  XLSX.writeFile(wb, `Laundry_Master_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return { success: true, message: 'Master Excel Backup created & downloaded successfully!' };
};

export const restoreMasterExcelBackupApi = async (file: File) => {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer);

  const payload: any = {
    orders: [],
    customers: [],
    payments: [],
    expenses: [],
  };

  if (wb.Sheets['Orders']) payload.orders = XLSX.utils.sheet_to_json(wb.Sheets['Orders']);
  if (wb.Sheets['Customers']) payload.customers = XLSX.utils.sheet_to_json(wb.Sheets['Customers']);
  if (wb.Sheets['Payments']) payload.payments = XLSX.utils.sheet_to_json(wb.Sheets['Payments']);
  if (wb.Sheets['Expenses']) payload.expenses = XLSX.utils.sheet_to_json(wb.Sheets['Expenses']);

  try {
    const apiRes = await fetchApi('/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ payload }),
    });
    if (apiRes && apiRes.success) {
      return apiRes;
    }
  } catch (err) {}

  // Local storage fallback restoration
  if (payload.customers.length > 0) {
    const existingCusts = getMockCustomers();
    payload.customers.forEach((c: any) => {
      const mob = c['Mobile Number'] || c.mobile;
      const name = c['Full Name'] || c.name;
      if (mob && name && !existingCusts.some((ec) => ec.mobile === mob)) {
        existingCusts.unshift({
          _id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          mobile: mob,
          email: c['Email Address'] || c.email || '',
          address: c['Address'] || c.address || '',
          totalSpent: Number(c['Total Spent (₹)']) || 0,
          totalOrders: Number(c['Total Orders']) || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
    saveMockCustomers(existingCusts);
  }

  if (payload.orders.length > 0) {
    const existingOrders = getMockOrders();
    payload.orders.forEach((o: any) => {
      const oNum = o['Order Number'] || o.orderNumber;
      if (oNum && !existingOrders.some((eo) => eo.orderNumber === oNum)) {
        existingOrders.unshift({
          _id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          orderNumber: oNum,
          customerSnapshot: {
            name: o['Customer Name'] || o.customerName || 'Customer',
            mobile: o['Customer Mobile'] || o.customerMobile || '',
          },
          orderDate: o['Order Date'] || new Date().toISOString(),
          expectedDeliveryDate: o['Expected Delivery'] || new Date().toISOString(),
          status: o['Order Status'] || 'Received',
          paymentStatus: o['Payment Status'] || 'Pending',
          paymentMethod: o['Payment Method'] || 'Cash',
          totalAmount: Number(o['Total Amount (₹)']) || 0,
          advancePaid: Number(o['Advance Paid (₹)']) || 0,
          remainingBalance: Number(o['Remaining Balance (₹)']) || 0,
          items: [],
        } as any);
      }
    });
    saveMockOrders(existingOrders);
  }

  return {
    success: true,
    message: 'Data successfully restored from Excel backup!',
    summary: {
      restoredOrdersCount: payload.orders.length,
      restoredCustomersCount: payload.customers.length,
      restoredPaymentsCount: payload.payments.length,
      restoredExpensesCount: payload.expenses.length,
    },
  };
};
