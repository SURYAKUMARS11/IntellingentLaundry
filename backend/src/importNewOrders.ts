import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from './models/Order';
import Customer from './models/Customer';

dotenv.config();

interface RawOrderInput {
  orderNumber: string;
  customerName: string;
  orderDateStr: string;
  totalAmount: number;
}

const rawOrdersData: RawOrderInput[] = [
  { orderNumber: 'ORD-439/26', customerName: 'SHERIN', orderDateStr: '2026-08-12T15:44:00', totalAmount: 100 },
  { orderNumber: 'ORD-438/26', customerName: 'sakthi', orderDateStr: '2026-08-12T15:42:00', totalAmount: 175 },
  { orderNumber: 'ORD-437/26', customerName: 'Deepika', orderDateStr: '2026-08-12T15:37:00', totalAmount: 760 },
  { orderNumber: 'ORD-436/26', customerName: 'KARTHIKEYAN', orderDateStr: '2026-08-12T15:32:00', totalAmount: 100 },
  { orderNumber: 'ORD-435/26', customerName: 'joseph', orderDateStr: '2026-08-12T15:19:00', totalAmount: 210 },
  { orderNumber: 'ORD-434/26', customerName: 'HARISH', orderDateStr: '2026-08-12T15:02:00', totalAmount: 715 },
  { orderNumber: 'ORD-433/26', customerName: 'THISHAN', orderDateStr: '2026-08-12T15:01:00', totalAmount: 100 },
  { orderNumber: 'ORD-432/26', customerName: 'ANANDHAKRISHNAN', orderDateStr: '2026-08-12T14:49:00', totalAmount: 175 },
  { orderNumber: 'ORD-431/26', customerName: 'AJAY', orderDateStr: '2026-08-12T14:47:00', totalAmount: 960 },
  { orderNumber: 'ORD-430/26', customerName: 'Dileepkumar', orderDateStr: '2026-08-12T14:41:00', totalAmount: 340 },
  { orderNumber: 'ORD-429/26', customerName: 'Murugesan', orderDateStr: '2026-08-12T14:38:00', totalAmount: 100 },
  { orderNumber: 'ORD-428/26', customerName: 'KARBACHEV', orderDateStr: '2026-08-12T14:37:00', totalAmount: 250 },
  { orderNumber: 'ORD-427/26', customerName: 'IMAYAM', orderDateStr: '2026-08-12T14:35:00', totalAmount: 135 },
  { orderNumber: 'ORD-426/26', customerName: 'PERUMAL', orderDateStr: '2026-08-12T14:34:00', totalAmount: 320 },
  { orderNumber: 'ORD-425/26', customerName: 'PRATHAP', orderDateStr: '2026-08-12T14:22:00', totalAmount: 1580 },
  { orderNumber: 'ORD-424/26', customerName: 'MURUGAVEL', orderDateStr: '2026-08-12T14:13:00', totalAmount: 480 },
  { orderNumber: 'ORD-423/26', customerName: 'MUKESHKANNAN', orderDateStr: '2026-08-12T14:09:00', totalAmount: 225 },
  { orderNumber: 'ORD-422/26', customerName: 'KALISHWARAN', orderDateStr: '2026-08-12T14:06:00', totalAmount: 935 },
  { orderNumber: 'ORD-421/26', customerName: 'Chithra', orderDateStr: '2026-08-12T14:01:00', totalAmount: 45 },
  { orderNumber: 'ORD-420/26', customerName: 'MADHAN', orderDateStr: '2026-08-12T13:59:00', totalAmount: 560 },
  { orderNumber: 'ORD-419/26', customerName: 'lakshmi', orderDateStr: '2026-08-12T13:52:00', totalAmount: 1460 },
  { orderNumber: 'ORD-418/26', customerName: 'Riyas', orderDateStr: '2026-08-11T20:22:00', totalAmount: 355 },
  { orderNumber: 'ORD-417/26', customerName: 'GOWTHAM', orderDateStr: '2026-08-11T20:16:00', totalAmount: 460 },
];

const importOrders = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas...');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of rawOrdersData) {
      // 1. Find or create Customer
      let customer = await Customer.findOne({ name: { $regex: new RegExp(`^${item.customerName.trim()}$`, 'i') } });
      
      if (!customer) {
        const randomMobile = '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
        customer = new Customer({
          name: item.customerName.trim(),
          mobile: randomMobile,
          address: 'Coimbatore',
          email: '',
          notes: 'Added from order import',
          totalOrders: 0,
          totalSpent: 0,
        });
        await customer.save();
        console.log(`Created new customer profile for: ${customer.name}`);
      }

      const orderDate = new Date(item.orderDateStr);
      const expectedDeliveryDate = new Date(orderDate);
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 2);

      // 2. Check if Order already exists
      let order = await Order.findOne({ orderNumber: item.orderNumber });

      if (order) {
        order.customer = customer._id;
        order.customerSnapshot = {
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address || 'Coimbatore',
          email: customer.email || '',
        };
        order.orderDate = orderDate;
        order.expectedDeliveryDate = expectedDeliveryDate;
        order.subtotal = item.totalAmount;
        order.discount = 0;
        order.taxPercent = 0;
        order.taxAmount = 0;
        order.totalAmount = item.totalAmount;
        order.advancePaid = 0;
        order.remainingBalance = item.totalAmount;
        order.status = 'Received';
        order.paymentStatus = 'Pending';
        await order.save();
        updatedCount++;
        console.log(`Updated existing order: ${item.orderNumber}`);
      } else {
        order = new Order({
          orderNumber: item.orderNumber,
          customer: customer._id,
          customerSnapshot: {
            name: customer.name,
            mobile: customer.mobile,
            address: customer.address || 'Coimbatore',
            email: customer.email || '',
          },
          orderDate,
          expectedDeliveryDate,
          subtotal: item.totalAmount,
          discount: 0,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: item.totalAmount,
          advancePaid: 0,
          remainingBalance: item.totalAmount,
          status: 'Received',
          paymentStatus: 'Pending',
          paymentMethod: 'Cash',
          items: [
            {
              itemName: 'Laundry Service',
              serviceName: 'Washing & Ironing',
              quantity: 1,
              unitPrice: item.totalAmount,
              subtotal: item.totalAmount,
            }
          ],
          statusHistory: [
            {
              status: 'Received',
              timestamp: orderDate,
              note: 'Order created',
            }
          ],
        });
        await order.save();
        insertedCount++;
        console.log(`Created new order: ${item.orderNumber}`);
      }

      // Recalculate customer stats
      const custOrders = await Order.find({ customer: customer._id });
      customer.totalOrders = custOrders.length;
      customer.totalSpent = custOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      await customer.save();
    }

    const totalOrdersCount = await Order.countDocuments();
    const activeOrdersCount = await Order.countDocuments({ status: { $ne: 'Delivered' } });
    const deliveredOrdersCount = await Order.countDocuments({ status: 'Delivered' });

    console.log('====================================================');
    console.log(` ✅ BULK ORDER IMPORT COMPLETED SUCCESSFULLY!`);
    console.log(` ➕ New Orders Inserted: ${insertedCount}`);
    console.log(` ✏️ Existing Orders Updated: ${updatedCount}`);
    console.log(` 📊 Total Active August Orders: ${totalOrdersCount}`);
    console.log(` 🧺 Pending Active Orders: ${activeOrdersCount}`);
    console.log(` 📦 Completed Delivered Orders: ${deliveredOrdersCount}`);
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Error importing orders:', err.message);
    process.exit(1);
  }
};

importOrders();
