import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';
import Customer from './models/Customer';

dotenv.config();

const searchKamaleesh = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);

    const custs = await Customer.find({ name: { $regex: /kamaleesh/i } });
    console.log('Customers matching KAMALEESH:', custs);

    const ords = await Order.find({ 'customerSnapshot.name': { $regex: /kamaleesh/i } });
    console.log('Orders matching KAMALEESH:', ords.map(o => ({
      orderNumber: o.orderNumber,
      name: o.customerSnapshot.name,
      mobile: o.customerSnapshot.mobile,
      address: o.customerSnapshot.address
    })));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

searchKamaleesh();
