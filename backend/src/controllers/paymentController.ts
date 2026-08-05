import { Request, Response } from 'express';
import Payment from '../models/Payment';

export const getPayments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let query: any = {};
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [{ orderNumber: searchRegex }, { customerName: searchRegex }, { paymentMethod: searchRegex }];
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      payments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
