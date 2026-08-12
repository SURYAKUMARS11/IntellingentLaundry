import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';
import Customer from './models/Customer';

dotenv.config();

const inspectAndFix = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas...');

    // 1. Inspect ORD-382/26
    const ord382 = await Order.findOne({ orderNumber: 'ORD-382/26' });
    if (ord382) {
      console.log('BEFORE ORD-382/26:', ord382.customerSnapshot);
      ord382.customerSnapshot.name = 'Ladha';
      await ord382.save();
      console.log('AFTER ORD-382/26:', ord382.customerSnapshot);

      if (ord382.customer) {
        const cust = await Customer.findById(ord382.customer);
        if (cust) {
          cust.name = 'Ladha';
          await cust.save();
          console.log('Updated Customer profile name for ORD-382 to Ladha');
        }
      }
    } else {
      console.log('ORD-382/26 not found!');
    }

    // 2. Inspect ORD-416/26
    const ord416 = await Order.findOne({ orderNumber: 'ORD-416/26' });
    if (ord416) {
      console.log('BEFORE ORD-416/26:', ord416.customerSnapshot);
      if (ord416.customer) {
        const cust416 = await Customer.findById(ord416.customer);
        console.log('Linked Customer profile for ORD-416:', cust416);
      }
    } else {
      console.log('ORD-416/26 not found!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

inspectAndFix();
