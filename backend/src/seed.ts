import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import Admin from './models/Admin';
import Customer from './models/Customer';
import Service from './models/Service';
import LaundryItem from './models/LaundryItem';
import Order from './models/Order';
import Payment from './models/Payment';
import Setting from './models/Setting';
import { generateQRCodeDataUrl } from './utils/qrGenerator';

dotenv.config();

export const seedDatabase = async () => {
  const isConnected = await connectDB();
  if (!isConnected) {
    console.log('[SEED] Skipping seed because MongoDB database is not connected.');
    return;
  }

  try {
    console.log('[SEED] Starting database seeding process...');

    // 1. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        name: 'Shop Owner',
        email: 'owner@intelligentlaundry.com',
      });
      console.log('[SEED] Default admin created (username: admin, password: admin123)');
    }

    // 2. Seed Settings
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        shopName: 'IntelligentLaundry & Dry Cleaners',
        shopTagline: 'Smart & Premium Laundry Management',
        logoUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=200&auto=format&fit=crop&q=80',
        phone: '+91 98765 43210',
        email: 'support@intelligentlaundry.com',
        address: '42 Commercial Street, Sector 15, Metro City, 400001',
        gstNumber: '27AABCU9603R1ZM',
        gstPercentage: 0,
        currencySymbol: '₹',
        currencyCode: 'INR',
        invoicePrefix: 'ORD-',
        termsAndConditions: '1. Please inspect clothes upon delivery.\n2. Clothes not collected within 30 days are subject to storage charges.\n3. Colors may bleed on delicate items if not pre-informed.',
      });
      console.log('[SEED] Default settings created.');
    }

    // 3. Seed Services
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      const defaultServices = [
        { name: 'Wash & Fold', price: 40, unit: 'kg', estimatedHours: 24, description: 'Everyday machine wash with eco-friendly detergent and neat folding', isActive: true },
        { name: 'Wash & Iron', price: 60, unit: 'piece', estimatedHours: 24, description: 'Deep wash, fabric softener, steam press ironing and hanger packing', isActive: true },
        { name: 'Iron Only', price: 20, unit: 'piece', estimatedHours: 12, description: 'Professional high-pressure steam ironing for crisp look', isActive: true },
        { name: 'Dry Cleaning', price: 180, unit: 'piece', estimatedHours: 48, description: 'Specialized chemical solvent cleaning for heavy, suit or delicate garments', isActive: true },
        { name: 'Premium Wash', price: 120, unit: 'piece', estimatedHours: 36, description: 'Individual drum wash, spot treatment, stain remover & luxury perfume finish', isActive: true },
      ];
      await Service.insertMany(defaultServices);
      console.log('[SEED] Default laundry services seeded.');
    }

    // 4. Seed Laundry Items
    const itemCount = await LaundryItem.countDocuments();
    if (itemCount === 0) {
      const defaultItems = [
        { name: 'Shirt / T-Shirt', defaultPrice: 40, category: 'Clothes', icon: 'Shirt', isActive: true },
        { name: 'Pant / Jeans / Trousers', defaultPrice: 50, category: 'Clothes', icon: 'Scissors', isActive: true },
        { name: 'Suit (2 Piece)', defaultPrice: 250, category: 'Dry Clean', icon: 'Briefcase', isActive: true },
        { name: 'Saree (Silk/Designer)', defaultPrice: 200, category: 'Dry Clean', icon: 'Sparkles', isActive: true },
        { name: 'Jacket / Coat / Blazer', defaultPrice: 180, category: 'Dry Clean', icon: 'Tag', isActive: true },
        { name: 'Blanket / Quilt (Double)', defaultPrice: 300, category: 'Household', icon: 'Box', isActive: true },
        { name: 'Bedsheet (Single/Double)', defaultPrice: 80, category: 'Household', icon: 'Layers', isActive: true },
        { name: 'Curtains (Per Panel)', defaultPrice: 100, category: 'Household', icon: 'Maximize2', isActive: true },
        { name: 'Dress / Frock', defaultPrice: 120, category: 'Clothes', icon: 'User', isActive: true },
        { name: 'Shoes / Sneakers', defaultPrice: 200, category: 'Footwear', icon: 'Footprints', isActive: true },
      ];
      await LaundryItem.insertMany(defaultItems);
      console.log('[SEED] Default laundry items seeded.');
    }

    // 5. Seed Initial Sample Customers if empty
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      const sampleCustomers = [
        { name: 'Rahul Sharma', mobile: '9876543210', address: 'B-204, Green Heights, Main Road', email: 'rahul.s@example.com', notes: 'Prefers crisp steam iron for formal shirts', totalOrders: 2, totalSpent: 750 },
        { name: 'Ananya Verma', mobile: '9812345678', address: 'Flat 101, Sunshine Apartments', email: 'ananya@example.com', notes: 'Dry clean only for delicate sarees', totalOrders: 1, totalSpent: 400 },
        { name: 'Vikram Singh', mobile: '9988776655', address: 'Villa 12, Palm Meadows', email: 'vikram.singh@example.com', notes: 'Express delivery required', totalOrders: 1, totalSpent: 1200 },
        { name: 'Priya Patel', mobile: '9765432109', address: 'House No 45, Civil Lines', email: 'priya.p@example.com', notes: 'Ring doorbell twice on delivery', totalOrders: 0, totalSpent: 0 },
      ];
      const createdCusts = await Customer.insertMany(sampleCustomers);
      console.log('[SEED] Sample customers created.');

      // 6. Seed Sample Orders
      const washService = await Service.findOne({ name: 'Wash & Iron' });
      const dryCleanService = await Service.findOne({ name: 'Dry Cleaning' });

      if (createdCusts.length >= 2 && washService && dryCleanService) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const order1Num = `ORD-${dateStr}-0001`;
        const order2Num = `ORD-${dateStr}-0002`;

        const qr1 = await generateQRCodeDataUrl(JSON.stringify({ orderNumber: order1Num, customer: createdCusts[0].name }));
        const qr2 = await generateQRCodeDataUrl(JSON.stringify({ orderNumber: order2Num, customer: createdCusts[1].name }));

        const order1 = await Order.create({
          orderNumber: order1Num,
          customer: createdCusts[0]._id,
          customerSnapshot: { name: createdCusts[0].name, mobile: createdCusts[0].mobile, address: createdCusts[0].address },
          items: [
            { itemName: 'Shirt', serviceName: washService.name, quantity: 4, unitPrice: 60, subtotal: 240 },
            { itemName: 'Jeans', serviceName: washService.name, quantity: 2, unitPrice: 70, subtotal: 140 },
          ],
          status: 'Washing',
          statusHistory: [
            { status: 'Received', timestamp: new Date(Date.now() - 3600000 * 5), note: 'Received at counter' },
            { status: 'Washing', timestamp: new Date(Date.now() - 3600000 * 2), note: 'In washing machine #2' },
          ],
          orderDate: new Date(Date.now() - 3600000 * 5),
          expectedDeliveryDate: new Date(Date.now() + 86400000 * 1),
          subtotal: 380,
          discount: 20,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: 360,
          advancePaid: 200,
          remainingBalance: 160,
          paymentStatus: 'Partially Paid',
          paymentMethod: 'UPI',
          notes: 'Deliver before 6 PM tomorrow',
          qrCodeUrl: qr1,
        });

        const order2 = await Order.create({
          orderNumber: order2Num,
          customer: createdCusts[1]._id,
          customerSnapshot: { name: createdCusts[1].name, mobile: createdCusts[1].mobile, address: createdCusts[1].address },
          items: [
            { itemName: 'Silk Saree', serviceName: dryCleanService.name, quantity: 2, unitPrice: 200, subtotal: 400 },
          ],
          status: 'Ready for Pickup',
          statusHistory: [
            { status: 'Received', timestamp: new Date(Date.now() - 86400000 * 2), note: 'Received at shop' },
            { status: 'Packing', timestamp: new Date(Date.now() - 3600000 * 6), note: 'Packed with cover' },
            { status: 'Ready for Pickup', timestamp: new Date(Date.now() - 3600000 * 1), note: 'Notified customer' },
          ],
          orderDate: new Date(Date.now() - 86400000 * 2),
          expectedDeliveryDate: new Date(),
          subtotal: 400,
          discount: 0,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: 400,
          advancePaid: 400,
          remainingBalance: 0,
          paymentStatus: 'Paid',
          paymentMethod: 'Cash',
          notes: 'Customer notified via SMS',
          qrCodeUrl: qr2,
        });

        // Add payment records
        await Payment.create({
          orderId: order1._id,
          orderNumber: order1.orderNumber,
          customerId: createdCusts[0]._id,
          customerName: createdCusts[0].name,
          amount: 200,
          paymentMethod: 'UPI',
          note: 'Advance payment during drop-off',
          paidAt: new Date(Date.now() - 3600000 * 5),
        });

        await Payment.create({
          orderId: order2._id,
          orderNumber: order2.orderNumber,
          customerId: createdCusts[1]._id,
          customerName: createdCusts[1].name,
          amount: 400,
          paymentMethod: 'Cash',
          note: 'Full payment received',
          paidAt: new Date(Date.now() - 86400000 * 2),
        });

        console.log('[SEED] Sample orders and payment history created.');
      }
    }

    console.log('[SEED] Database seeding complete!');
  } catch (error) {
    console.error('[SEED ERROR] Error during database seed:', error);
  }
};

if (require.main === module) {
  seedDatabase().then(() => mongoose.connection.close());
}
