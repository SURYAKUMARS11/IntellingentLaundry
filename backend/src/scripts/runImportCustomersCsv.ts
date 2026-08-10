import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import fs from 'fs';
import { connectDB } from '../config/db';
import Customer from '../models/Customer';
import Order from '../models/Order';

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
  console.log('Connecting to database...');
  await connectDB();

  const filePath = path.join(__dirname, '../../customers_export (1).csv');
  if (!fs.existsSync(filePath)) {
    console.error('CSV file not found at:', filePath);
    process.exit(1);
  }

  const fileText = fs.readFileSync(filePath, 'utf8');
  // Normalize multi-line fields inside quotes by replacing newlines inside quotes with spaces
  let sanitizedText = '';
  let insideQuote = false;
  for (let i = 0; i < fileText.length; i++) {
    const char = fileText[i];
    if (char === '"') insideQuote = !insideQuote;
    if ((char === '\n' || char === '\r') && insideQuote) {
      sanitizedText += ' ';
    } else {
      sanitizedText += char;
    }
  }

  const lines = sanitizedText.split('\n').filter((l) => l.trim().length > 0);
  console.log(`Total CSV lines to process: ${lines.length - 1}`);

  let createdCount = 0;
  let updatedCount = 0;

  // Header: ID,Name,Phone,Email,Source,Address,Status
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const oldId = cols[0];
    const name = cols[1] ? cols[1].trim() : '';
    const phone = cols[2] ? cols[2].replace(/\D/g, '') : '';
    const email = cols[3] ? cols[3].trim() : '';
    const source = cols[4] ? cols[4].trim() : '';
    const address = cols[5] ? cols[5].trim() : '';
    const status = cols[6] ? cols[6].trim() : 'Active';

    if (!name && !phone) continue;

    const formattedMobile = phone.length >= 10 ? phone.slice(-10) : phone || `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    let custDoc: any = null;
    if (formattedMobile.length === 10) {
      custDoc = await Customer.findOne({ mobile: formattedMobile });
    }
    if (!custDoc && name) {
      custDoc = await Customer.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    }

    if (custDoc) {
      // Update details if missing
      let modified = false;
      if (address && (!custDoc.address || custDoc.address === 'Imported Customer')) {
        custDoc.address = address;
        modified = true;
      }
      if (email && !custDoc.email) {
        custDoc.email = email;
        modified = true;
      }
      if (source && (!custDoc.notes || custDoc.notes.length === 0)) {
        custDoc.notes = `Source: ${source}`;
        modified = true;
      }
      if (modified) {
        await custDoc.save();
        updatedCount++;
      }
    } else {
      // Create new Customer
      custDoc = new Customer({
        name: name || 'Valued Customer',
        mobile: formattedMobile,
        email: email || undefined,
        address: address || 'Coimbatore',
        notes: source ? `Source: ${source}` : undefined,
        totalOrders: 0,
        totalSpent: 0,
      });
      await custDoc.save();
      createdCount++;
    }

    // Link customer to any existing orders matching mobile or name
    const matchingOrders = await Order.find({
      $or: [
        { 'customerSnapshot.mobile': formattedMobile },
        { 'customerSnapshot.name': new RegExp(`^${name.trim()}$`, 'i') },
      ],
    });

    if (matchingOrders.length > 0) {
      let orderCount = 0;
      let totalSpent = 0;
      for (const ord of matchingOrders) {
        orderCount++;
        totalSpent += ord.totalAmount || 0;
        if (!ord.customer || ord.customer.toString() !== custDoc._id.toString()) {
          ord.customer = custDoc._id;
          ord.customerSnapshot.name = custDoc.name;
          ord.customerSnapshot.mobile = custDoc.mobile;
          if (custDoc.address) ord.customerSnapshot.address = custDoc.address;
          await ord.save();
        }
      }
      custDoc.totalOrders = orderCount;
      custDoc.totalSpent = totalSpent;
      await custDoc.save();
    }
  }

  const finalTotalCustomers = await Customer.countDocuments();
  console.log(`\n🎉 CUSTOMER CSV IMPORT COMPLETED!`);
  console.log(`- Created New Customers: ${createdCount}`);
  console.log(`- Updated Existing Customers: ${updatedCount}`);
  console.log(`- Total Live Customers in Database: ${finalTotalCustomers}`);

  process.exit(0);
};

run().catch((err) => {
  console.error('Customer Import Failed:', err);
  process.exit(1);
});
