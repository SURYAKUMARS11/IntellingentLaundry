import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';
import Customer from './models/Customer';
import Payment from './models/Payment';

dotenv.config();

const testDashboard = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas...');

    const preset = 'current_month';
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const orderQuery: any = {
      orderDate: { $gte: startDate, $lte: endDate }
    };

    const deliveredQuery: any = {
      ...orderQuery,
      status: { $regex: /^delivered$/i },
    };

    const deliveredOrdersCount = await Order.countDocuments(deliveredQuery);
    const deliveredOrdersList = await Order.find(deliveredQuery).sort({ deliveredAt: -1, orderDate: -1 }).lean();
    const deliveredRevenue = deliveredOrdersList.reduce((sum, ord: any) => sum + Number(ord.totalAmount || 0), 0);

    console.log('Delivered Count:', deliveredOrdersCount);
    console.log('Delivered Revenue:', deliveredRevenue);
    console.log('Delivered List Length:', deliveredOrdersList.length);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

testDashboard();
