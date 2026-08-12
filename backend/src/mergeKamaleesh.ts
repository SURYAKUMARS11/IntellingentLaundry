import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';
import Customer from './models/Customer';

dotenv.config();

const mergeKamaleesh = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);

    const mainCustomer = await Customer.findById('6a7a989e79beeedbb8996ccf'); // mobile: 8428606013
    const dupCustomer = await Customer.findById('6a7a93a159cdaed7bdd3d945'); // mobile: 9

    if (mainCustomer) {
      mainCustomer.name = 'KAMALEESH';
      mainCustomer.address = 'MMP, Coimbatore';
      
      // Update all orders linked to dupCustomer to point to mainCustomer
      await Order.updateMany(
        { customer: new mongoose.Types.ObjectId('6a7a93a159cdaed7bdd3d945') },
        {
          $set: {
            customer: mainCustomer._id,
            'customerSnapshot.name': 'KAMALEESH',
            'customerSnapshot.mobile': '8428606013',
            'customerSnapshot.address': 'MMP',
          }
        }
      );

      // Recalculate main customer stats
      const kamOrders = await Order.find({
        $or: [
          { customer: mainCustomer._id },
          { 'customerSnapshot.mobile': '8428606013' }
        ]
      });

      mainCustomer.totalOrders = kamOrders.length;
      mainCustomer.totalSpent = kamOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      await mainCustomer.save();
      console.log(`Updated main Kamaleesh customer profile with ${kamOrders.length} orders and total spent ₹${mainCustomer.totalSpent}`);
    }

    if (dupCustomer) {
      await Customer.deleteOne({ _id: dupCustomer._id });
      console.log('Removed duplicate Kamaleesh customer profile with mobile: 9');
    }

    await mongoose.disconnect();
    console.log('Kamaleesh profile merge completed successfully!');
    process.exit(0);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

mergeKamaleesh();
