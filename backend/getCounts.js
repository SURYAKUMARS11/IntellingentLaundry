const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:Ldshop123@cluster0.uvtjm9e.mongodb.net/intelligentlaundry?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;

  const orders = await db.collection('orders').countDocuments();
  const customers = await db.collection('customers').countDocuments();
  const payments = await db.collection('payments').countDocuments();
  const expenses = await db.collection('expenses').countDocuments();
  const services = await db.collection('services').countDocuments();
  const items = await db.collection('items').countDocuments();

  const pipeline = [
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalCollected: { $sum: '$advancePaid' },
        pendingBalance: { $sum: '$remainingBalance' }
      }
    }
  ];

  const financialStats = await db.collection('orders').aggregate(pipeline).toArray();
  const fin = financialStats[0] || { totalRevenue: 0, totalCollected: 0, pendingBalance: 0 };

  console.log('--- DB COUNTS ---');
  console.log('ORDERS:', orders);
  console.log('CUSTOMERS:', customers);
  console.log('PAYMENTS:', payments);
  console.log('EXPENSES:', expenses);
  console.log('SERVICES:', services);
  console.log('ITEMS:', items);
  console.log('TOTAL_REVENUE:', fin.totalRevenue);
  console.log('REVENUE_COLLECTED:', fin.totalCollected);
  console.log('PENDING_BALANCE:', fin.pendingBalance);

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
