import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';
import Payment from './models/Payment';
import Customer from './models/Customer';

dotenv.config();

const cleanData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas...');

    const allOrders = await Order.find().sort({ createdAt: 1 });
    console.log(`Total orders found in database: ${allOrders.length}`);

    // Filter orders to keep: Order numbers starting from 337 or ORD-337 onwards, or created in August 2026 from #337
    const ordersToDelete: any[] = [];
    const ordersToKeep: any[] = [];

    allOrders.forEach((ord) => {
      // Extract numeric part from orderNumber e.g. ORD-337/26 -> 337
      const match = ord.orderNumber.match(/ORD-(\d+)/i) || ord.orderNumber.match(/(\d+)/);
      const num = match ? parseInt(match[1], 10) : 0;

      // Keep if number >= 337 or created in August 2026 starting from #337
      if (num >= 337) {
        ordersToKeep.push(ord);
      } else {
        ordersToDelete.push(ord);
      }
    });

    console.log(`Orders to KEEP (>= #337): ${ordersToKeep.length}`);
    ordersToKeep.forEach((o) => console.log(`  - KEEP: ${o.orderNumber} (${o.customerSnapshot?.name}) - Date: ${new Date(o.orderDate).toLocaleDateString()}`));

    console.log(`Orders to DELETE (< #337): ${ordersToDelete.length}`);
    ordersToDelete.forEach((o) => console.log(`  - DELETE: ${o.orderNumber} (${o.customerSnapshot?.name}) - Date: ${new Date(o.orderDate).toLocaleDateString()}`));

    if (ordersToDelete.length > 0) {
      const deleteIds = ordersToDelete.map((o) => o._id);
      const deleteOrderNumbers = ordersToDelete.map((o) => o.orderNumber);

      // Delete payments associated with deleted orders
      const delPaymentsRes = await Payment.deleteMany({
        $or: [{ orderId: { $in: deleteIds } }, { orderNumber: { $in: deleteOrderNumbers } }],
      });
      console.log(`Deleted ${delPaymentsRes.deletedCount} associated payments.`);

      // Delete the orders
      const delOrdersRes = await Order.deleteMany({ _id: { $in: deleteIds } });
      console.log(`Deleted ${delOrdersRes.deletedCount} old orders.`);
    } else {
      console.log('No old orders found to delete.');
    }

    // Recalculate customer totalOrders & totalSpent for remaining orders
    const remainingOrders = await Order.find();
    const customers = await Customer.find();

    for (const cust of customers) {
      const custOrders = remainingOrders.filter((o) => o.customer?.toString() === cust._id.toString());
      const totalSpent = custOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      cust.totalOrders = custOrders.length;
      cust.totalSpent = totalSpent;
      await cust.save();
    }
    console.log('Customer order counts and totals recalculated successfully.');

    await mongoose.disconnect();
    console.log('Data cleanup completed successfully!');
    process.exit(0);
  } catch (err: any) {
    console.error('Error during data cleanup:', err.message);
    process.exit(1);
  }
};

cleanData();
