import { Request, Response } from 'express';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Service from '../models/Service';
import Payment from '../models/Payment';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const {
      preset,
      paymentStatus,
      status,
      dateType = 'orderDate',
      dateFrom,
      dateTo,
    } = req.query;

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (preset === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (preset === 'current_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (preset === 'current_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (preset === 'current_year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (preset === 'last_7_days') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (preset === 'last_30_days') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (preset === 'last_365_days') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFrom || dateTo) {
      if (dateFrom) {
        startDate = new Date(dateFrom as string);
        startDate.setHours(0, 0, 0, 0);
      }
      if (dateTo) {
        endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Build filter query for orders
    let orderQuery: any = {};

    if (paymentStatus) {
      orderQuery.paymentStatus = paymentStatus;
    }

    if (status) {
      orderQuery.status = status;
    }

    const field = dateType === 'expectedDeliveryDate' ? 'expectedDeliveryDate' : 'orderDate';
    if (startDate || endDate) {
      orderQuery[field] = {};
      if (startDate) orderQuery[field].$gte = startDate;
      if (endDate) orderQuery[field].$lte = endDate;
    }

    // 1. Total Orders List & Count
    const totalOrdersCount = await Order.countDocuments(orderQuery);
    const ordersList = await Order.find(orderQuery).sort({ createdAt: -1 }).limit(20);

    // 2. Payments Received List & Total
    let paymentMatch: any = {};
    if (startDate || endDate) {
      paymentMatch.paidAt = {};
      if (startDate) paymentMatch.paidAt.$gte = startDate;
      if (endDate) paymentMatch.paidAt.$lte = endDate;
    }
    const paymentsList = await Payment.find(paymentMatch).sort({ paidAt: -1 }).limit(20);
    const periodPayments = await Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const periodRevenue = periodPayments[0]?.total || 0;

    // 3. Active Orders List & Count
    const activeQuery = {
      ...orderQuery,
      status: { $in: ['Received', 'Washing', 'Drying', 'Ironing', 'Packing', 'Ready for Pickup'] },
    };
    const activeOrdersCount = await Order.countDocuments(activeQuery);
    const activeOrdersList = await Order.find(activeQuery).sort({ orderDate: -1 }).limit(20);

    // 4. New Customers List & Count
    let customerQuery: any = {};
    if (startDate || endDate) {
      customerQuery.createdAt = {};
      if (startDate) customerQuery.createdAt.$gte = startDate;
      if (endDate) customerQuery.createdAt.$lte = endDate;
    }
    const newCustomersCount = await Customer.countDocuments(customerQuery);
    const newCustomersList = await Customer.find(customerQuery).sort({ createdAt: -1 }).limit(20);

    // 5. Overdue / Pending Balance Orders List & Count
    const overdueQuery = {
      ...orderQuery,
      status: { $nin: ['Delivered', 'Cancelled'] },
      $or: [
        { expectedDeliveryDate: { $lt: now } },
        { remainingBalance: { $gt: 0 } },
      ],
    };
    const overdueOrdersCount = await Order.countDocuments(overdueQuery);
    const overdueOrdersList = await Order.find(overdueQuery).sort({ expectedDeliveryDate: 1 }).limit(20);

    // Legacy values for fallback compatibility
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todayPayments = await Payment.aggregate([
      { $match: { paidAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayRevenue = todayPayments[0]?.total || 0;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthPayments = await Payment.aggregate([
      { $match: { paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyRevenue = monthPayments[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalOrders: totalOrdersCount,
        paymentsReceived: periodRevenue,
        activeOrders: activeOrdersCount,
        newCustomers: newCustomersCount,
        overdueOrders: overdueOrdersCount,
        // legacy
        todayOrders: totalOrdersCount,
        pendingOrders: overdueOrdersCount,
        inProgress: activeOrdersCount,
        readyForPickup: activeOrdersCount,
        deliveredOrders: totalOrdersCount - activeOrdersCount,
        todayRevenue,
        monthlyRevenue,
        periodRevenue,
        totalCustomers: newCustomersCount,
      },
      ordersList,
      paymentsList,
      activeOrdersList,
      newCustomersList,
      overdueOrdersList,
      pendingReminders: overdueOrdersList,
      recentOrders: ordersList,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { period = '30days' } = req.query;
    let startDate = new Date();

    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '12months') {
      startDate.setMonth(startDate.getMonth() - 12);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    const chartData = await Payment.aggregate([
      { $match: { paidAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const serviceBreakdown = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.serviceName',
          totalAmount: { $sum: '$items.subtotal' },
          itemCount: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const topCustomers = await Customer.find().sort({ totalSpent: -1 }).limit(5);

    res.json({
      success: true,
      chartData: chartData.map((d) => ({ date: d._id, revenue: d.revenue, count: d.count })),
      serviceBreakdown: serviceBreakdown.map((s) => ({
        service: s._id || 'Standard Wash',
        amount: s.totalAmount,
        quantity: s.itemCount,
      })),
      topCustomers,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
  try {
    const { type = 'orders' } = req.query;

    if (type === 'orders') {
      const orders = await Order.find().sort({ createdAt: -1 });

      let csv = 'Order Number,Customer Name,Customer Mobile,Order Date,Expected Delivery,Status,Payment Status,Total Amount,Advance Paid,Remaining Balance\n';
      orders.forEach((o) => {
        const orderDate = new Date(o.orderDate).toISOString().slice(0, 10);
        const delivDate = new Date(o.expectedDeliveryDate).toISOString().slice(0, 10);
        csv += `"${o.orderNumber}","${o.customerSnapshot?.name || ''}","${o.customerSnapshot?.mobile || ''}","${orderDate}","${delivDate}","${o.status}","${o.paymentStatus}",${o.totalAmount},${o.advancePaid},${o.remainingBalance}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="laundry_orders.csv"');
      return res.send(csv);
    } else if (type === 'customers') {
      const customers = await Customer.find().sort({ name: 1 });
      let csv = 'Name,Mobile,Address,Email,Total Orders,Total Spent,Created At\n';
      customers.forEach((c) => {
        csv += `"${c.name}","${c.mobile}","${c.address}","${c.email || ''}",${c.totalOrders},${c.totalSpent},"${new Date(c.createdAt).toISOString().slice(0, 10)}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="laundry_customers.csv"');
      return res.send(csv);
    }

    return res.status(400).json({ success: false, message: 'Invalid export type' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
