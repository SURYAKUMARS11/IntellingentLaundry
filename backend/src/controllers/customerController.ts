import { Request, Response } from 'express';
import Customer from '../models/Customer';
import Order from '../models/Order';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const total = await Customer.countDocuments(query);
    const rawCustomers = await Customer.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const allOrders = await Order.find({}, 'customer customerSnapshot.mobile totalAmount').lean();

    // Dynamically calculate totalOrders & totalSpent for every customer
    const customers = rawCustomers.map((c: any) => {
      const custOrders = allOrders.filter(
        (o: any) =>
          (o.customer && String(o.customer) === String(c._id)) ||
          (o.customerSnapshot && o.customerSnapshot.mobile === c.mobile)
      );
      return {
        ...c,
        totalOrders: custOrders.length,
        totalSpent: custOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
      };
    });

    res.json({
      success: true,
      customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customerObj = await Customer.findById(req.params.id);
    if (!customerObj) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({
      $or: [{ customer: customerObj._id }, { 'customerSnapshot.mobile': customerObj.mobile }],
    }).sort({ createdAt: -1 });

    const customer = customerObj.toObject();
    customer.totalOrders = orders.length;
    customer.totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      success: true,
      customer,
      orders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, mobile, address, email, notes } = req.body;

    if (!name || !mobile || !address) {
      return res.status(400).json({ success: false, message: 'Name, mobile number, and address are required' });
    }

    const existingCustomer = await Customer.findOne({ mobile });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'Customer with this mobile number already exists' });
    }

    const customer = new Customer({
      name,
      mobile,
      address,
      email: email || '',
      notes: notes || '',
      totalOrders: 0,
      totalSpent: 0,
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { name, mobile, address, email, notes } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (mobile && mobile !== customer.mobile) {
      const existing = await Customer.findOne({ mobile });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Mobile number already used by another customer' });
      }
    }

    if (name) customer.name = name;
    if (mobile) customer.mobile = mobile;
    if (address) customer.address = address;
    if (email !== undefined) customer.email = email;
    if (notes !== undefined) customer.notes = notes;

    await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orderCount = await Order.countDocuments({
      $or: [{ customer: customer._id }, { 'customerSnapshot.mobile': customer.mobile }],
    });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${orderCount} existing order(s).`,
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
