import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';
import Payment from './models/Payment';

dotenv.config();

const check = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);

    const allOrders = await Order.find();
    const deliveredOrders = allOrders.filter(o => o.status.toLowerCase() === 'delivered');
    const activeOrders = allOrders.filter(o => o.status.toLowerCase() !== 'delivered');

    console.log(`Total Orders: ${allOrders.length}`);
    console.log(`Delivered Orders: ${deliveredOrders.length}`);
    console.log(`Active Orders: ${activeOrders.length}`);

    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const deliveredAdvancePaid = deliveredOrders.reduce((sum, o) => sum + (o.advancePaid || 0), 0);

    const activeTotalAmount = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const activeAdvancePaid = activeOrders.reduce((sum, o) => sum + (o.advancePaid || 0), 0);

    const paymentsList = await Payment.find();
    const totalPaymentsCollection = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);

    console.log('--- NUMBERS BREAKDOWN ---');
    console.log(`Delivered Orders Total Revenue (Delivered Income): ₹${deliveredRevenue}`);
    console.log(`Delivered Orders Advance/Paid Collected: ₹${deliveredAdvancePaid}`);
    console.log(`Active Orders Total Value: ₹${activeTotalAmount}`);
    console.log(`Active Orders Advance Money Collected: ₹${activeAdvancePaid}`);
    console.log(`Total Payments Collected in Register: ₹${totalPaymentsCollection}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

check();
