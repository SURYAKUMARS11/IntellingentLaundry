import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import fs from 'fs';
import { connectDB } from '../config/db';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Payment from '../models/Payment';

const run = async () => {
  console.log('Connecting to database...');
  await connectDB();

  const filePath = path.join(__dirname, '../../clean_orders.json');
  if (!fs.existsSync(filePath)) {
    console.error('clean_orders.json not found!');
    process.exit(1);
  }

  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const ordersList = fileData.orders || [];
  console.log(`Starting import of ${ordersList.length} historical orders...`);

  let importedOrdersCount = 0;
  let importedCustomersCount = 0;
  let importedPaymentsCount = 0;

  for (const oldOrd of ordersList) {
    const oNum = oldOrd.order_no_display || oldOrd.print_order_no || `ORD-${oldOrd.order_no || oldOrd.id}`;
    const custName = oldOrd.customer_name ? oldOrd.customer_name.trim() : 'Walk-in Customer';
    const custMobile = oldOrd.customer_phone ? oldOrd.customer_phone.replace(/\D/g, '') : '';
    const orderDate = oldOrd.order_date || oldOrd.created_at ? new Date(oldOrd.order_date || oldOrd.created_at) : new Date();
    const delivDate = oldOrd.delivery_date ? new Date(oldOrd.delivery_date) : new Date(orderDate.getTime() + 48 * 3600 * 1000);

    const totalPrice = Number(oldOrd.total_price || oldOrd.total_amount || 0);
    const paidAmount = Number(oldOrd.paid_amount || oldOrd.advance_paid || 0);
    const remBal = Math.max(0, totalPrice - paidAmount);

    let orderStatus: any = 'Received';
    const rawStatus = (oldOrd.status || oldOrd.ord_status || '').toLowerCase();
    if (rawStatus === 'delivered') orderStatus = 'Delivered';
    else if (rawStatus === 'washing' || rawStatus === 'in_progress') orderStatus = 'Washing';
    else if (rawStatus === 'ironing') orderStatus = 'Ironing';
    else if (rawStatus === 'ready' || rawStatus === 'ready_for_delivery') orderStatus = 'Ready for Delivery';

    let payStatus: any = 'Pending';
    const rawPayStatus = (oldOrd.payment_status || '').toLowerCase();
    if (rawPayStatus === 'paid' || (remBal === 0 && totalPrice > 0)) payStatus = 'Paid';
    else if (paidAmount > 0) payStatus = 'Partially Paid';

    // 1. Find or create Customer
    let customerDoc: any = null;
    if (custMobile && custMobile.length >= 10) {
      customerDoc = await Customer.findOne({ mobile: custMobile });
    }
    if (!customerDoc && custName) {
      customerDoc = await Customer.findOne({ name: custName });
    }
    if (!customerDoc) {
      customerDoc = new Customer({
        name: custName,
        mobile: custMobile || `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        address: oldOrd.address || 'Imported Customer',
        totalOrders: 0,
        totalSpent: 0,
      });
      await customerDoc.save();
      importedCustomersCount++;
    }

    // 2. Check if Order already exists
    const existingOrd = await Order.findOne({ orderNumber: oNum });
    if (!existingOrd) {
      const newOrd = new Order({
        orderNumber: oNum,
        customer: customerDoc._id,
        customerSnapshot: {
          name: customerDoc.name,
          mobile: customerDoc.mobile,
          address: customerDoc.address,
          email: customerDoc.email,
        },
        items: [
          {
            itemId: 'generic-item',
            itemName: 'Garment Processing (Imported)',
            serviceId: 'wash-and-fold',
            serviceName: 'Laundry Service',
            quantity: 1,
            unitPrice: totalPrice,
            subtotal: totalPrice,
            totalPrice: totalPrice,
          },
        ],
        status: orderStatus,
        paymentStatus: payStatus,
        paymentMethod: 'Cash',
        subtotal: totalPrice,
        totalAmount: totalPrice,
        advancePaid: paidAmount,
        remainingBalance: remBal,
        orderDate,
        expectedDeliveryDate: delivDate,
        deliveredAt: orderStatus === 'Delivered' ? delivDate : undefined,
        notes: oldOrd.notes || 'Imported from previous laundry software',
      });
      await newOrd.save();
      importedOrdersCount++;

      customerDoc.totalOrders = (customerDoc.totalOrders || 0) + 1;
      customerDoc.totalSpent = (customerDoc.totalSpent || 0) + totalPrice;
      await customerDoc.save();

      if (paidAmount > 0) {
        const payDoc = new Payment({
          orderId: newOrd._id,
          orderNumber: oNum,
          customerId: customerDoc._id,
          customerName: customerDoc.name,
          amount: paidAmount,
          paymentMethod: 'Cash',
          note: 'Imported Payment Record',
          paidAt: orderDate,
        });
        await payDoc.save();
        importedPaymentsCount++;
      }
    }
  }

  console.log(`\n🎉 IMPORT COMPLETED SUCCESSFULLY!`);
  console.log(`- Imported Orders: ${importedOrdersCount}`);
  console.log(`- Imported Customers: ${importedCustomersCount}`);
  console.log(`- Imported Payments: ${importedPaymentsCount}`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Import Failed:', err);
  process.exit(1);
});
