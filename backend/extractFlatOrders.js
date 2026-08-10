const fs = require('fs');
const path = require('path');

const ordersRaw = fs.readFileSync(path.join(__dirname, 'orders.json'), 'utf8');

// Match flat JSON objects that contain "id": "..."
const objectRegex = /\{\s*\"id\"\s*:\s*\"(\d+)\"[\s\S]*?\}/g;

const matches = ordersRaw.match(objectRegex) || [];
console.log('Total order object matches:', matches.length);

const parsedOrders = [];
const seenIds = new Set();

matches.forEach((str, idx) => {
  try {
    const obj = JSON.parse(str);
    const idKey = obj.id || obj.order_no || obj.order_no_display;
    if (idKey && !seenIds.has(String(idKey))) {
      seenIds.add(String(idKey));
      parsedOrders.push(obj);
    }
  } catch (err) {
    console.error(`Error parsing match #${idx}:`, err.message);
  }
});

console.log(`🎉 SUCCESS! Extracted ${parsedOrders.length} / 410 unique orders!`);
console.log('First 3 orders:', parsedOrders.slice(0, 3).map(o => o.order_no_display || o.id));
console.log('Last 3 orders:', parsedOrders.slice(-3).map(o => o.order_no_display || o.id));

fs.writeFileSync(path.join(__dirname, 'clean_410_orders.json'), JSON.stringify({ orders: parsedOrders }, null, 2));
