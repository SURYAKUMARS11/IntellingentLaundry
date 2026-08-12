import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';

dotenv.config();

const checkDeliveredDates = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);
    const deliveredOrders = await Order.find({ status: { $regex: /^delivered$/i } }).lean();

    deliveredOrders.forEach((ord: any, idx: number) => {
      console.log(`[Order ${idx + 1}] #${ord.orderNumber}: orderDate=${ord.orderDate ? new Date(ord.orderDate).toISOString() : 'NULL'}, totalAmount=${ord.totalAmount}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

checkDeliveredDates();
