import { Request, Response } from 'express';
import Setting from '../models/Setting';
import Customer from '../models/Customer';
import Order from '../models/Order';
import Payment from '../models/Payment';
import Expense from '../models/Expense';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
      await setting.save();
    }
    res.json({ success: true, setting });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
    }

    const {
      shopName,
      shopTagline,
      logoUrl,
      phone,
      email,
      address,
      gstNumber,
      gstPercentage,
      currencySymbol,
      currencyCode,
      invoicePrefix,
      termsAndConditions,
      upiId,
      gpayNumber,
      paymentQrUrl,
    } = req.body;

    if (shopName) setting.shopName = shopName;
    if (shopTagline !== undefined) setting.shopTagline = shopTagline;
    if (logoUrl !== undefined) setting.logoUrl = logoUrl;
    if (phone) setting.phone = phone;
    if (email) setting.email = email;
    if (address) setting.address = address;
    if (gstNumber !== undefined) setting.gstNumber = gstNumber;
    if (gstPercentage !== undefined) setting.gstPercentage = Number(gstPercentage);
    if (currencySymbol) setting.currencySymbol = currencySymbol;
    if (currencyCode) setting.currencyCode = currencyCode;
    if (invoicePrefix) setting.invoicePrefix = invoicePrefix;
    if (termsAndConditions !== undefined) setting.termsAndConditions = termsAndConditions;
    if (upiId !== undefined) setting.upiId = upiId;
    if (gpayNumber !== undefined) setting.gpayNumber = gpayNumber;
    if (paymentQrUrl !== undefined) setting.paymentQrUrl = paymentQrUrl;

    await setting.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      setting,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetData = async (req: Request, res: Response) => {
  try {
    await Promise.all([
      Customer.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({}),
    ]);
    res.json({
      success: true,
      message: 'All existing customers, orders, invoices and shop expenses deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
