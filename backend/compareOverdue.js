const fs = require('fs');
const path = require('path');

const overdueRaw = fs.readFileSync(path.join(__dirname, 'overdue.txt'), 'utf8');

// Parse overdue orders
let overdueList = [];
try {
  const parsed = JSON.parse(overdueRaw);
  overdueList = parsed.overdue_orders || [];
} catch (e) {
  console.error('Failed to JSON.parse overdue.txt:', e.message);
}

console.log('Total overdue orders in overdue.txt:', overdueList.length);

const overdueOrderNumbers = overdueList.map(o => o.print_order_no || o.order_no_display || `ORD-${o.order_no || o.id}/26`);
console.log('Sample Overdue Order Numbers from overdue.txt:', overdueOrderNumbers.slice(0, 10));

// Check clean_410_orders.json to see how many of these exist in our dataset
const cleanOrders = JSON.parse(fs.readFileSync(path.join(__dirname, 'clean_410_orders.json'), 'utf8')).orders || [];
const cleanMap = new Map();
cleanOrders.forEach(o => {
  const oNum = o.print_order_no || o.order_no_display || `ORD-${o.order_no || o.id}/26`;
  cleanMap.set(oNum, o);
  if (o.order_no) cleanMap.set(`ORD-${o.order_no}`, o);
  if (o.id) cleanMap.set(`ORD-${o.id}`, o);
});

let matchCount = 0;
const missingInClean = [];

overdueOrderNumbers.forEach(num => {
  if (cleanMap.has(num)) {
    matchCount++;
  } else {
    missingInClean.push(num);
  }
});

console.log(`Matched ${matchCount} out of ${overdueList.length} overdue orders in clean_410_orders.json!`);
console.log('Missing in clean dataset:', missingInClean);
