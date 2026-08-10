const fs = require('fs');
const path = require('path');

const ordersRaw = fs.readFileSync(path.join(__dirname, 'orders.json'), 'utf8');
const lines = ordersRaw.split('\n');

console.log('Total lines in orders.json:', lines.length);

lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed === '}' || trimmed === ']' || trimmed === '[' || trimmed === '}]}' || trimmed === '},') {
    if (lines[idx + 1] && (lines[idx + 1].trim().startsWith('{') || lines[idx + 1].trim().startsWith('['))) {
      console.log(`Potential boundary at Line ${idx + 1}: "${trimmed}" followed by "${lines[idx + 1].trim()}"`);
    }
  }
});
