const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../../orders.json');
const outputPath = path.join(__dirname, '../../clean_orders.json');

console.log('Reading orders.json...');
const rawText = fs.readFileSync(inputPath, 'utf8');

const orders = [];
let depth = 0;
let currentObj = '';
let inString = false;
let escape = false;

for (let i = 0; i < rawText.length; i++) {
  const char = rawText[i];

  if (char === '"' && !escape) {
    inString = !inString;
  }
  escape = char === '\\' && !escape;

  if (!inString) {
    if (char === '{') {
      if (depth === 0) currentObj = '';
      depth++;
    }
  }

  if (depth > 0) {
    currentObj += char;
  }

  if (!inString) {
    if (char === '}') {
      depth--;
      if (depth === 0 && currentObj) {
        try {
          const parsed = JSON.parse(currentObj);
          if (parsed.id && (parsed.customer_name || parsed.order_no || parsed.total_price)) {
            orders.push(parsed);
          }
        } catch (e) {
          // ignore non-order container objects
        }
        currentObj = '';
      }
    }
  }
}

console.log(`Extracted ${orders.length} order records from raw text.`);

// Deduplicate orders by order ID
const uniqueOrders = [];
const seenIds = new Set();

orders.forEach((o) => {
  const key = o.id || o.order_no || o.order_no_display;
  if (key && !seenIds.has(key)) {
    seenIds.add(key);
    uniqueOrders.push(o);
  }
});

console.log(`Deduplicated total: ${uniqueOrders.length} unique historical orders.`);

const finalPayload = {
  total_length: uniqueOrders.length,
  orders: uniqueOrders,
};

fs.writeFileSync(outputPath, JSON.stringify(finalPayload, null, 2));
console.log(`✅ Successfully generated 100% clean JSON: ${outputPath}`);
