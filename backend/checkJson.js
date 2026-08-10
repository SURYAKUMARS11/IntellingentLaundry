const fs = require('fs');
const path = require('path');

console.log('--- CHECKING ORDERS.JSON ---');
const ordersRaw = fs.readFileSync(path.join(__dirname, 'orders.json'), 'utf8');
const orderMatches = ordersRaw.match(/\"id\"\s*:\s*\"(\d+)\"/g) || [];
console.log('Total "id": "XXX" occurrences in orders.json:', orderMatches.length);

const orderIds = orderMatches.map(m => {
  const match = m.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
});

const uniqueOrderIds = Array.from(new Set(orderIds)).sort((a, b) => b - a);
console.log('Unique Order IDs count in orders.json:', uniqueOrderIds.length);
console.log('Max Order ID:', Math.max(...uniqueOrderIds));
console.log('Min Order ID:', Math.min(...uniqueOrderIds));

// Find missing order numbers between 1 and max
const maxId = Math.max(...uniqueOrderIds);
const missingIds = [];
for (let i = 1; i <= maxId; i++) {
  if (!uniqueOrderIds.includes(i)) {
    missingIds.push(i);
  }
}
console.log('Missing Order IDs count (out of ' + maxId + '):', missingIds.length);
console.log('Sample Missing Order IDs:', missingIds.slice(0, 20));

console.log('\n--- CHECKING CUSTOMERS_EXPORT.CSV ---');
const custRaw = fs.readFileSync(path.join(__dirname, 'customers_export (1).csv'), 'utf8');
const custLines = custRaw.split('\n').filter(l => l.trim().length > 0);
console.log('Total CSV lines:', custLines.length);
