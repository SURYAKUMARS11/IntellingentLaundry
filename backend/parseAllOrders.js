const fs = require('fs');
const path = require('path');

const ordersRaw = fs.readFileSync(path.join(__dirname, 'orders.json'), 'utf8');

// Replace concatenation syntax errors in orders.json
// Notice line 2806 has:
//     ]
// }
// [

const blocks = ordersRaw.split(/\}\s*\n\s*\]\s*\n\s*\}\s*\n/);
console.log('Blocks split count:', blocks.length);

const allOrders = [];

blocks.forEach((block, idx) => {
  let cleanBlock = block.trim();
  if (!cleanBlock.startsWith('{') && !cleanBlock.startsWith('[')) {
    const firstBrace = cleanBlock.indexOf('{');
    if (firstBrace !== -1) cleanBlock = cleanBlock.slice(firstBrace);
  }
  if (!cleanBlock.endsWith('}')) {
    cleanBlock += '}]}';
  }
  try {
    const parsed = JSON.parse(cleanBlock);
    if (parsed.orders && Array.isArray(parsed.orders)) {
      allOrders.push(...parsed.orders);
    } else if (Array.isArray(parsed)) {
      allOrders.push(...parsed);
    }
  } catch (err) {
    console.error(`Block ${idx} Error:`, err.message);
  }
});

console.log(`Extracted total raw orders: ${allOrders.length}`);

const uniqueOrders = [];
const seenIds = new Set();

allOrders.forEach((o) => {
  const idKey = o.id || o.order_no || o.order_no_display;
  if (idKey && !seenIds.has(String(idKey))) {
    seenIds.add(String(idKey));
    uniqueOrders.push(o);
  }
});

console.log(`✅ TOTAL UNIQUE ORDERS EXTRACTED: ${uniqueOrders.length} / 410!`);

fs.writeFileSync(path.join(__dirname, 'clean_410_orders.json'), JSON.stringify({ orders: uniqueOrders }, null, 2));
