const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'clean_410_orders.json');
const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const orders = content.orders || [];

console.log('Total orders:', orders.length);

// Analyze status fields in old app:
const ordStatusCounts = {};
const statusCounts = {};
const payStatusCounts = {};

orders.forEach(o => {
  const os = o.ord_status || 'MISSING';
  const st = o.status || 'MISSING';
  const ps = o.payment_status || 'MISSING';

  ordStatusCounts[os] = (ordStatusCounts[os] || 0) + 1;
  statusCounts[st] = (statusCounts[st] || 0) + 1;
  payStatusCounts[ps] = (payStatusCounts[ps] || 0) + 1;
});

console.log('\n--- OLD APP ord_status COUNTS ---');
console.log(ordStatusCounts);

console.log('\n--- OLD APP status COUNTS ---');
console.log(statusCounts);

console.log('\n--- OLD APP payment_status COUNTS ---');
console.log(payStatusCounts);

// Check combinations
let pendingOrdStatus = 0; // ord_status === 'pending'
let pendingStatus = 0; // status === 'pending'
let unpaidPayStatus = 0; // payment_status === 'unpaid'
let partialPayStatus = 0; // payment_status === 'partial' / 'partially'

orders.forEach(o => {
  if (o.ord_status === 'pending') pendingOrdStatus++;
  if (o.status === 'pending') pendingStatus++;
  if (o.payment_status === 'unpaid') unpaidPayStatus++;
});

console.log('\n--- COMBINATION METRICS ---');
console.log('ord_status === "pending":', pendingOrdStatus);
console.log('status === "pending":', pendingStatus);
console.log('payment_status === "unpaid":', unpaidPayStatus);

// Print first 5 pending orders details
console.log('\n--- SAMPLE PENDING ORDERS IN OLD APP ---');
const samplePending = orders.filter(o => o.ord_status === 'pending' || o.status === 'pending' || o.payment_status === 'unpaid').slice(0, 10);
samplePending.forEach(o => {
  console.log(`Order #${o.order_no_display || o.id}: status=${o.status}, ord_status=${o.ord_status}, payment_status=${o.payment_status}, total=${o.total_price}, paid=${o.paid_amount}`);
});
