const fs = require('fs');
const path = require('path');

const ordersRaw = fs.readFileSync(path.join(__dirname, 'orders.json'), 'utf8');

// Replace all page concatenations:
// Pattern 1: "]}\n[" or "]\n}" or "]\n["
const normalized = ordersRaw
  .replace(/\]\s*\n\s*\}\s*\n\s*\[/g, '}]|||[')
  .replace(/\]\s*\n\s*\[/g, ']|||[');

const chunks = normalized.split('|||');
console.log('Normalized chunks count:', chunks.length);

const allOrders = [];

chunks.forEach((chunk, i) => {
  let text = chunk.trim();
  if (!text.startsWith('{') && !text.startsWith('[')) {
    const first = text.indexOf('{');
    if (first !== -1) text = text.slice(first);
  }

  // Ensure valid JSON array/object structure
  if (!text.endsWith('}') && !text.endsWith(']')) {
    text += ']';
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed.orders && Array.isArray(parsed.orders)) {
      allOrders.push(...parsed.orders);
    } else if (Array.isArray(parsed)) {
      allOrders.push(...parsed);
    }
  } catch (err) {
    console.error(`Chunk ${i} Error:`, err.message);
  }
});

console.log('Total extracted raw orders:', allOrders.length);

const uniqueOrders = [];
const seenIds = new Set();

allOrders.forEach((o) => {
  const idKey = o.id || o.order_no || o.order_no_display;
  if (idKey && !seenIds.has(String(idKey))) {
    seenIds.add(String(idKey));
    uniqueOrders.push(o);
  }
});

console.log(`🎉 SUCCESS! Extracted ${uniqueOrders.length} / 410 unique orders!`);

fs.writeFileSync(path.join(__dirname, 'clean_410_orders.json'), JSON.stringify({ orders: uniqueOrders }, null, 2));
