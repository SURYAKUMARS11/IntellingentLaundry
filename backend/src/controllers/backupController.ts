import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Payment from '../models/Payment';
import Expense from '../models/Expense';

export const exportMasterExcelBackup = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all records from database
    const orders = await Order.find().sort({ createdAt: -1 });
    const customers = await Customer.find().sort({ createdAt: -1 });
    const payments = await Payment.find().sort({ paidAt: -1 });
    const expenses = await Expense.find().sort({ expenseDate: -1 });

    // 2. Format Sheet 1: Orders
    const ordersData = orders.map((o) => ({
      'Order Number': o.orderNumber,
      'Customer Name': o.customerSnapshot?.name || 'Walk-in Customer',
      'Customer Mobile': o.customerSnapshot?.mobile || '',
      'Order Date': o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 10) : '',
      'Expected Delivery': o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString().slice(0, 10) : '',
      'Order Status': o.status,
      'Payment Status': o.paymentStatus,
      'Payment Method': o.paymentMethod || 'Cash',
      'Total Amount (₹)': o.totalAmount || 0,
      'Advance Paid (₹)': o.advancePaid || 0,
      'Remaining Balance (₹)': o.remainingBalance || 0,
      'Discount (₹)': o.discount || 0,
      'Tax Amount (₹)': o.taxAmount || 0,
      'Express Delivery': (o as any).isExpress ? 'Yes' : 'No',
      'Items Count': (o.items || []).length,
      'Items Summary': (o.items || []).map((i) => `${i.serviceName} (${i.quantity}x)`).join(', '),
      'Notes': o.notes || '',
    }));

    // 3. Format Sheet 2: Customers
    const customersData = customers.map((c) => ({
      'Customer ID': c._id.toString(),
      'Full Name': c.name,
      'Mobile Number': c.mobile,
      'Email Address': c.email || '',
      'Address': c.address || '',
      'Total Spent (₹)': c.totalSpent || 0,
      'Total Orders': c.totalOrders || 0,
      'Registered Date': c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '',
    }));

    // 4. Format Sheet 3: Payments
    let paymentsData = payments.map((p) => ({
      'Payment ID': p._id.toString(),
      'Order Number': p.orderNumber || '',
      'Customer Name': p.customerName || 'Customer',
      'Payment Method': p.paymentMethod || 'Cash',
      'Amount Paid (₹)': p.amount || 0,
      'Paid Date & Time': p.paidAt ? new Date(p.paidAt).toLocaleString() : '',
      'Transaction Ref / ID': p.transactionId || '',
      'Payment Note': p.note || '',
    }));

    if (paymentsData.length === 0 && orders.length > 0) {
      paymentsData = orders
        .filter((o) => o.paymentStatus === 'Paid' || o.advancePaid > 0)
        .map((o) => ({
          'Payment ID': o._id.toString(),
          'Order Number': o.orderNumber,
          'Customer Name': o.customerSnapshot?.name || 'Customer',
          'Payment Method': (o.paymentMethod || 'Cash') as any,
          'Amount Paid (₹)': o.paymentStatus === 'Paid' ? o.totalAmount : o.advancePaid,
          'Paid Date & Time': o.orderDate ? new Date(o.orderDate).toLocaleString() : '',
          'Transaction Ref / ID': 'SYSTEM-ORDER',
          'Payment Note': o.paymentStatus === 'Paid' ? 'Full Payment' : 'Advance Payment',
        })) as any;
    }

    // 5. Format Sheet 4: Expenses
    const expensesData = expenses.map((e) => ({
      'Voucher Number': e.voucherNumber,
      'Category': e.category,
      'Description': e.description,
      'Amount (₹)': e.amount || 0,
      'Payment Method': e.paymentMethod,
      'Paid To': e.paidTo || '',
      'Expense Date': e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : '',
      'Notes': e.notes || '',
    }));

    // 6. Create Workbook and Sheets
    const workbook = XLSX.utils.book_new();

    const ordersSheet = XLSX.utils.json_to_sheet(ordersData.length > 0 ? ordersData : [{}]);
    const customersSheet = XLSX.utils.json_to_sheet(customersData.length > 0 ? customersData : [{}]);
    const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData.length > 0 ? paymentsData : [{}]);
    const expensesSheet = XLSX.utils.json_to_sheet(expensesData.length > 0 ? expensesData : [{}]);

    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');
    XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');

    // 7. Save copy to server disk (if filesystem is writable)
    try {
      const backupDir = path.join(__dirname, '../../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const serverFilePath = path.join(backupDir, 'laundry_master_backup.xlsx');
      XLSX.writeFile(workbook, serverFilePath);
    } catch (fsErr) {
      console.warn('[BACKUP] Server disk write skipped (read-only cloud environment)');
    }

    // 8. Stream Excel file to client browser as download
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const todayStr = new Date().toISOString().slice(0, 10);
    const fileName = `Laundry_Master_Backup_${todayStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error: any) {
    console.error('Failed to export master Excel backup:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreMasterExcelBackup = async (req: Request, res: Response) => {
  try {
    const { payload } = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload structure' });
    }

    const { orders = [], customers = [], payments = [], expenses = [] } = payload;

    let restoredCustomersCount = 0;
    let restoredOrdersCount = 0;
    let restoredPaymentsCount = 0;
    let restoredExpensesCount = 0;

    // 1. Restore Customers
    for (const c of customers) {
      const mobile = c['Mobile Number'] || c.mobile;
      const name = c['Full Name'] || c.name;
      if (mobile && name) {
        await Customer.findOneAndUpdate(
          { mobile },
          {
            name,
            mobile,
            email: c['Email Address'] || c.email || '',
            address: c['Address'] || c.address || '',
            totalSpent: Number(c['Total Spent (₹)']) || Number(c.totalSpent) || 0,
            totalOrders: Number(c['Total Orders']) || Number(c.totalOrders) || 0,
          },
          { upsert: true, new: true }
        );
        restoredCustomersCount++;
      }
    }

    // 2. Restore Expenses
    for (const e of expenses) {
      const vNum = e['Voucher Number'] || e.voucherNumber;
      if (vNum) {
        await Expense.findOneAndUpdate(
          { voucherNumber: vNum },
          {
            voucherNumber: vNum,
            category: e['Category'] || e.category || 'Miscellaneous',
            description: e['Description'] || e.description || 'Restored Expense',
            amount: Number(e['Amount (₹)']) || Number(e.amount) || 0,
            paymentMethod: e['Payment Method'] || e.paymentMethod || 'Cash',
            paidTo: e['Paid To'] || e.paidTo || '',
            expenseDate: e['Expense Date'] ? new Date(e['Expense Date']) : new Date(),
            notes: e['Notes'] || e.notes || '',
          },
          { upsert: true, new: true }
        );
        restoredExpensesCount++;
      }
    }

    // 3. Restore Orders
    for (const o of orders) {
      const oNum = o['Order Number'] || o.orderNumber;
      if (oNum) {
        await Order.findOneAndUpdate(
          { orderNumber: oNum },
          {
            orderNumber: oNum,
            customerSnapshot: {
              name: o['Customer Name'] || o.customerName || 'Customer',
              mobile: o['Customer Mobile'] || o.customerMobile || '',
            },
            orderDate: o['Order Date'] ? new Date(o['Order Date']) : new Date(),
            expectedDeliveryDate: o['Expected Delivery'] ? new Date(o['Expected Delivery']) : new Date(),
            status: o['Order Status'] || o.status || 'Received',
            paymentStatus: o['Payment Status'] || o.paymentStatus || 'Pending',
            paymentMethod: o['Payment Method'] || o.paymentMethod || 'Cash',
            totalAmount: Number(o['Total Amount (₹)']) || Number(o.totalAmount) || 0,
            advancePaid: Number(o['Advance Paid (₹)']) || Number(o.advancePaid) || 0,
            remainingBalance: Number(o['Remaining Balance (₹)']) || Number(o.remainingBalance) || 0,
            discount: Number(o['Discount (₹)']) || Number(o.discount) || 0,
            taxAmount: Number(o['Tax Amount (₹)']) || Number(o.taxAmount) || 0,
            isExpress: (o['Express Delivery'] || '').toLowerCase() === 'yes' || o.isExpress === true,
            notes: o['Notes'] || o.notes || '',
          },
          { upsert: true, new: true }
        );
        restoredOrdersCount++;
      }
    }

    // 4. Restore Payments
    for (const p of payments) {
      const pId = p['Payment ID'] || p._id;
      const pOrderNum = p['Order Number'] || p.orderNumber;
      if (pOrderNum || pId) {
        await Payment.create({
          orderNumber: pOrderNum || '',
          customerName: p['Customer Name'] || p.customerName || 'Customer',
          paymentMethod: p['Payment Method'] || p.paymentMethod || 'Cash',
          amount: Number(p['Amount Paid (₹)']) || Number(p.amount) || 0,
          paidAt: p['Paid Date & Time'] ? new Date(p['Paid Date & Time']) : new Date(),
          transactionId: p['Transaction Ref / ID'] || p.transactionId || '',
          note: p['Payment Note'] || p.note || '',
        });
        restoredPaymentsCount++;
      }
    }

    return res.json({
      success: true,
      message: 'Database backup restored successfully from Excel file!',
      summary: {
        restoredCustomersCount,
        restoredOrdersCount,
        restoredPaymentsCount,
        restoredExpensesCount,
      },
    });
  } catch (error: any) {
    console.error('Failed to restore backup from Excel:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const importOldAppOrdersJson = async (req: Request, res: Response) => {
  try {
    const { orders } = req.body;
    let ordersList = orders;

    if (!Array.isArray(ordersList) && req.body && Array.isArray(req.body.result?.orders)) {
      ordersList = req.body.result.orders;
    } else if (!Array.isArray(ordersList) && req.body && Array.isArray(req.body.data)) {
      ordersList = req.body.data;
    }

    if (!Array.isArray(ordersList) || ordersList.length === 0) {
      return res.status(400).json({ success: false, message: 'No orders array found in JSON payload' });
    }

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

      // Status mapping
      let orderStatus: any = 'Received';
      const rawStatus = (oldOrd.status || oldOrd.ord_status || '').toLowerCase();
      if (rawStatus === 'delivered') orderStatus = 'Delivered';
      else if (rawStatus === 'washing' || rawStatus === 'in_progress') orderStatus = 'Washing';
      else if (rawStatus === 'ironing') orderStatus = 'Ironing';
      else if (rawStatus === 'ready' || rawStatus === 'ready_for_delivery') orderStatus = 'Ready for Delivery';

      // Payment Status mapping
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

        // Update customer total metrics
        customerDoc.totalOrders = (customerDoc.totalOrders || 0) + 1;
        customerDoc.totalSpent = (customerDoc.totalSpent || 0) + totalPrice;
        await customerDoc.save();

        // 3. Record payment if paid
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

    res.json({
      success: true,
      message: `Successfully imported ${importedOrdersCount} orders, ${importedCustomersCount} new customers, and ${importedPaymentsCount} payment records!`,
      summary: {
        importedOrdersCount,
        importedCustomersCount,
        importedPaymentsCount,
      },
    });
  } catch (err: any) {
    console.error('Import JSON Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
