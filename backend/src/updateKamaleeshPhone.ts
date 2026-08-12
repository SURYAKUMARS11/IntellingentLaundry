import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';
import Customer from './models/Customer';

dotenv.config();

const updateKamaleesh = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas...');

    const realMobile = '8428606013';

    // 1. Update ORD-416/26
    const ord416 = await Order.findOne({ orderNumber: 'ORD-416/26' });
    if (ord416) {
      ord416.customerSnapshot.mobile = realMobile;
      await ord416.save();
      console.log('Updated ORD-416/26 mobile to:', realMobile);
    }

    // 2. Update ORD-383/26
    const ord383 = await Order.findOne({ orderNumber: 'ORD-383/26' });
    if (ord383) {
      ord383.customerSnapshot.mobile = realMobile;
      await ord383.save();
      console.log('Updated ORD-383/26 mobile to:', realMobile);
    }

    // 3. Update Customer profile
    const cust1 = await Customer.findById('6a7a93a159cdaed7bdd3d945');
    if (cust1) {
      cust1.mobile = realMobile;
      await cust1.save();
      console.log('Updated Customer profile mobile to:', realMobile);
    }

    await mongoose.disconnect();
    console.log('Kamaleesh mobile update complete!');
    process.exit(0);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

updateKamaleesh();
