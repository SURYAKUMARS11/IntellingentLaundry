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
    const paymentsData = payments.map((p) => ({
      'Payment ID': p._id.toString(),
      'Order Number': p.orderNumber || '',
      'Customer Name': p.customerName || 'Customer',
      'Payment Method': p.paymentMethod || 'Cash',
      'Amount Paid (₹)': p.amount || 0,
      'Paid Date & Time': p.paidAt ? new Date(p.paidAt).toLocaleString() : '',
      'Transaction Ref / ID': p.transactionId || '',
      'Payment Note': p.note || '',
    }));

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

    // 7. Save copy to server disk
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const serverFilePath = path.join(backupDir, 'laundry_master_backup.xlsx');
    XLSX.writeFile(workbook, serverFilePath);

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
