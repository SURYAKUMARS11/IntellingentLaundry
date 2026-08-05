import { Request, Response } from 'express';
import Setting from '../models/Setting';

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
