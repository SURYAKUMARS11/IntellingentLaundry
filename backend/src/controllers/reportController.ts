import { Request, Response } from 'express';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Service from '../models/Service';
import Payment from '../models/Payment';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Counts
    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const pendingOrdersCount = await Order.countDocuments({
      status: { $in: ['Received', 'Washing', 'Drying', 'Ironing', 'Packing'] },
    });

    const inProgressCount = await Order.countDocuments({
      status: { $in: ['Washing', 'Drying', 'Ironing'] },
    });

    const readyForPickupCount = await Order.countDocuments({
      status: 'Ready for Pickup',
    });

    const deliveredOrdersCount = await Order.countDocuments({
      status: 'Delivered',
    });

    const totalCustomersCount = await Customer.countDocuments();

    // Today's Revenue (payments collected today)
    const todayPayments = await Payment.aggregate([
      { $match: { paidAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayRevenue = todayPayments[0]?.total || 0;

    // Monthly Revenue (payments collected this month)
    const monthPayments = await Payment.aggregate([
      { $match: { paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyRevenue = monthPayments[0]?.total || 0;

    // Pending Delivery Reminders (Overdue or expected today/tomorrow and not delivered/cancelled)
    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const pendingReminders = await Order.find({
      status: { $nin: ['Delivered', 'Cancelled'] },
      expectedDeliveryDate: { $lte: tomorrowEnd },
    })
      .sort({ expectedDeliveryDate: 1 })
      .limit(10);

    // Recent 5 Orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        todayOrders: todayOrdersCount,
        pendingOrders: pendingOrdersCount,
        inProgress: inProgressCount,
        readyForPickup: readyForPickupCount,
        deliveredOrders: deliveredOrdersCount,
        todayRevenue,
        monthlyRevenue,
        totalCustomers: totalCustomersCount,
      },
      pendingReminders,
      recentOrders,
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

    // Aggregate payments group by date YYYY-MM-DD
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

    // Service Breakdown
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

    // Top Customers
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
