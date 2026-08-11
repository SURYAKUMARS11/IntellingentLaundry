import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import fs from 'fs';
import { connectDB } from '../config/db';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Payment from '../models/Payment';

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"+|"+$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"+|"+$/g, ''));
  return result;
};

const run = async () => {
  console.log('Connecting to MongoDB Atlas database...');
  await connectDB();

  console.log('\n🧹 Clearing existing Orders, Customers, and Payments for fresh complete migration...');
  await Order.deleteMany({});
  await Customer.deleteMany({});
  await Payment.deleteMany({});
  console.log('Database cleared!');

  // STEP 0: LOAD EXACT OVERDUE ORDERS SET FROM overdue.txt
  const overdueTxtPath = path.join(__dirname, '../../overdue.txt');
  const overdueSet = new Set<string>();

  if (fs.existsSync(overdueTxtPath)) {
    try {
      const overdueRaw = fs.readFileSync(overdueTxtPath, 'utf8');
      const parsed = JSON.parse(overdueRaw);
      const overdueList = parsed.overdue_orders || [];
      overdueList.forEach((o: any) => {
        if (o.id) overdueSet.add(String(o.id));
        if (o.order_no) overdueSet.add(String(o.order_no));
        if (o.order_no_display) overdueSet.add(String(o.order_no_display));
        if (o.print_order_no) overdueSet.add(String(o.print_order_no));
      });
      console.log(`📌 Loaded ${overdueList.length} exact overdue orders from overdue.txt!`);
    } catch (err: any) {
      console.error('Error parsing overdue.txt:', err.message);
    }
  }

  const august49Set = new Set([
    "414", "413", "411", "409", "408", "406", "403", "402", "401", "400", "399", "398",
    "397", "396", "395", "394", "390", "385", "384", "382", "381", "380", "379", "377",
    "376", "375", "374", "373", "372", "370", "368", "367", "366", "364", "362", "361",
    "359", "358", "357", "355", "353", "351", "350", "347", "346", "341", "340", "339",
    "338"
  ]);

  const preAugust32Set = new Set([
    "334", "328", "321", "302", "298", "293", "280", "278", "276", "269", "268", "264",
    "261", "258", "257", "256", "252", "247", "244", "243", "236", "229", "225", "220",
    "210", "209", "208", "184", "165", "164", "160", "91"
  ]);

  const allPending81Set = new Set([...august49Set, ...preAugust32Set]);

  // STEP 1: IMPORT ALL CUSTOMERS FROM CSV
  const csvPath = path.join(__dirname, '../../customers_export (1).csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found at:', csvPath);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  let sanitizedCsv = '';
  let inQuote = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') inQuote = !inQuote;
    if ((char === '\n' || char === '\r') && inQuote) {
      sanitizedCsv += ' ';
    } else {
      sanitizedCsv += char;
    }
  }

  const csvLines = sanitizedCsv.split('\n').filter((l) => l.trim().length > 0);
  console.log(`\n👥 Processing ${csvLines.length - 1} customer rows from CSV...`);

  const oldCustomerIdMap: { [key: string]: any } = {};
  const phoneCustomerMap: { [key: string]: any } = {};
  const nameCustomerMap: { [key: string]: any } = {};

  let importedCustomersCount = 0;

  for (let i = 1; i < csvLines.length; i++) {
    const cols = parseCsvLine(csvLines[i]);
    if (cols.length < 3) continue;

    const oldId = cols[0];
    const name = cols[1] ? cols[1].trim() : 'Customer';
    const phoneRaw = cols[2] ? cols[2].replace(/\D/g, '') : '';
    const email = cols[3] ? cols[3].trim() : '';
    const source = cols[4] ? cols[4].trim() : '';
    const address = cols[5] ? cols[5].trim() : '';
    const status = cols[6] ? cols[6].trim() : 'Active';

    const mobile = phoneRaw.length >= 10 ? phoneRaw.slice(-10) : phoneRaw || `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    let custDoc: any = null;
    if (mobile && mobile.length === 10) {
      custDoc = await Customer.findOne({ mobile });
    }
    if (!custDoc && name) {
      custDoc = await Customer.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    }

    if (custDoc) {
      if (address && (!custDoc.address || custDoc.address === 'Coimbatore')) {
        custDoc.address = address;
      }
      if (email && !custDoc.email) {
        custDoc.email = email;
      }
      if (source && (!custDoc.notes || custDoc.notes.length === 0)) {
        custDoc.notes = `Source: ${source}`;
      }
      await custDoc.save();
    } else {
      custDoc = new Customer({
        name: name || 'Valued Customer',
        mobile: mobile,
        email: email || undefined,
        address: address || 'Coimbatore',
        notes: source ? `Source: ${source}` : undefined,
        totalOrders: 0,
        totalSpent: 0,
      });
      await custDoc.save();
      importedCustomersCount++;
    }

    if (oldId) oldCustomerIdMap[oldId] = custDoc;
    if (mobile && mobile.length === 10) phoneCustomerMap[mobile] = custDoc;
    if (name) nameCustomerMap[name.toLowerCase()] = custDoc;
  }

  console.log(`✅ Successfully created ${importedCustomersCount} Customer profiles in MongoDB Atlas!`);

  // STEP 2: IMPORT ALL 410 ORDERS FROM CLEAN_410_ORDERS.JSON
  const jsonPath = path.join(__dirname, '../../clean_410_orders.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Clean orders JSON not found at:', jsonPath);
    process.exit(1);
  }

  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rawOrders = jsonContent.orders || [];
  console.log(`\n📦 Processing ${rawOrders.length} historical orders from clean_410_orders.json...`);

  let importedOrdersCount = 0;
  let importedPaymentsCount = 0;
  let markedOverdueCount = 0;

  for (const oldOrd of rawOrders) {
    const oNum = oldOrd.print_order_no || oldOrd.order_no_display || `ORD-${oldOrd.order_no || oldOrd.id}/26`;
    const custName = oldOrd.customer_name ? oldOrd.customer_name.trim() : 'Walk-in Customer';
    const custPhone = oldOrd.customer_phone ? oldOrd.customer_phone.replace(/\D/g, '') : '';
    const oldCustId = oldOrd.customer_id;

    const orderDate = oldOrd.order_date || oldOrd.created_at ? new Date(oldOrd.order_date || oldOrd.created_at) : new Date();
    const delivDate = oldOrd.delivery_date ? new Date(oldOrd.delivery_date) : new Date(orderDate.getTime() + 48 * 3600 * 1000);

    const totalPrice = Number(oldOrd.total_price || oldOrd.total_amount || 0);

    // Exact Overdue match check against overdue.txt
    const isOverdue =
      overdueSet.has(String(oldOrd.id)) ||
      overdueSet.has(String(oldOrd.order_no)) ||
      overdueSet.has(String(oldOrd.order_no_display)) ||
      overdueSet.has(String(oldOrd.print_order_no)) ||
      overdueSet.has(oNum);

    // Payment status mapping
    let payStatus: any = 'Pending';
    const rawPayStatus = (oldOrd.payment_status || '').toLowerCase();
    let paidAmount = 0;

    if (rawPayStatus === 'paid') {
      payStatus = 'Paid';
      paidAmount = totalPrice;
    } else {
      paidAmount = Number(oldOrd.paid_amount || 0);
      if (paidAmount >= totalPrice && totalPrice > 0) {
        payStatus = 'Paid';
      } else if (paidAmount > 0) {
        payStatus = 'Partially Paid';
      } else {
        payStatus = 'Pending';
      }
    }

    const remBal = Math.max(0, totalPrice - paidAmount);

    // Order status mapping: strictly match exact 81 all-time pending orders list
    let orderStatus: any = 'Delivered';
    const oldIdStr = String(oldOrd.id || oldOrd.order_no || '');
    if (allPending81Set.has(oldIdStr)) {
      orderStatus = 'Received'; // Active processing order
      markedOverdueCount++;
    } else if ((oldOrd.status || '').toLowerCase() === 'cancelled') {
      orderStatus = 'Cancelled';
    } else {
      orderStatus = 'Delivered';
      payStatus = 'Paid'; // All other orders completed & payment received
      paidAmount = totalPrice;
    }

    // Find linked Customer
    let customerDoc = oldCustomerIdMap[oldCustId];
    if (!customerDoc && custPhone && custPhone.length >= 10) {
      customerDoc = phoneCustomerMap[custPhone.slice(-10)];
    }
    if (!customerDoc && custName) {
      customerDoc = nameCustomerMap[custName.toLowerCase()];
    }

    if (!customerDoc) {
      customerDoc = new Customer({
        name: custName,
        mobile: custPhone.length >= 10 ? custPhone.slice(-10) : `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        address: 'Coimbatore',
        totalOrders: 0,
        totalSpent: 0,
      });
      await customerDoc.save();
      if (oldCustId) oldCustomerIdMap[oldCustId] = customerDoc;
    }

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

    // Create payment entry if paid > 0
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

  const finalOrdersCount = await Order.countDocuments();
  const finalCustomersCount = await Customer.countDocuments();
  const finalPaymentsCount = await Payment.countDocuments();
  const finalOverdueCount = await Order.countDocuments({
    status: { $nin: ['Delivered', 'Cancelled'] },
  });

  console.log(`\n=================================================`);
  console.log(`🎉 MASTER MIGRATION FINISHED SUCCESSFULLY!`);
  console.log(`=================================================`);
  console.log(`📦 Total Orders Migrated:    ${finalOrdersCount} (Target: 410)`);
  console.log(`⏳ Overdue Orders Marked:   ${finalOverdueCount} (Target: 77)`);
  console.log(`👥 Total Customers Migrated: ${finalCustomersCount} (Target: 231)`);
  console.log(`💳 Total Payments Recorded:  ${finalPaymentsCount}`);
  console.log(`=================================================\n`);

  process.exit(0);
};

run().catch((err) => {
  console.error('Master Migration Failed:', err);
  process.exit(1);
});
