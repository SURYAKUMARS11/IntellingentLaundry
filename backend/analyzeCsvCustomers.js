const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'customers_export (1).csv');
const csvText = fs.readFileSync(csvPath, 'utf8');

// Parse CSV lines handling quotes with newline
const parseCsvLine = (line) => {
  const result = [];
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

let sanitizedCsv = '';
let inQuote = false;
for (let i = 0; i < csvText.length; i++) {
  const char = csvText[i];
  if (char === '"') inQuote = !inQuote;
  if ((char === '\n' || char === '\r') && inQuote) {
    sanitizedCsv += ' ';
  } else {
    sanitizedCsv += char;
  }
}

const lines = sanitizedCsv.split('\n').filter(l => l.trim().length > 0);
console.log('Total Raw CSV Lines (including header):', lines.length);

const header = parseCsvLine(lines[0]);
console.log('Header columns:', header);

const dataRows = lines.slice(1);
console.log('Total Customer Data Rows:', dataRows.length);

const ids = new Set();
const names = [];
const phones = [];
const phoneCounts = {};
const duplicatePhoneRows = [];

dataRows.forEach((rowStr, idx) => {
  const cols = parseCsvLine(rowStr);
  const id = cols[0];
  const name = cols[1] ? cols[1].trim() : '';
  const phone = cols[2] ? cols[2].replace(/\D/g, '') : '';
  const mobile = phone.length >= 10 ? phone.slice(-10) : phone;

  if (id) ids.add(id);
  names.push(name);
  phones.push(mobile);

  if (mobile) {
    if (!phoneCounts[mobile]) {
      phoneCounts[mobile] = [];
    }
    phoneCounts[mobile].push({ row: idx + 2, id, name, mobile });
  }
});

console.log('Unique IDs in CSV:', ids.size);

const duplicateMobiles = Object.keys(phoneCounts).filter(m => phoneCounts[m].length > 1);
console.log('Total Duplicate Mobile Numbers in CSV:', duplicateMobiles.length);

let totalDuplicateRows = 0;
duplicateMobiles.forEach(m => {
  totalDuplicateRows += (phoneCounts[m].length - 1);
});

console.log('Total Duplicate Rows to be deduplicated when phone is unique:', totalDuplicateRows);

console.log('\n--- SAMPLE DUPLICATE PHONE NUMBERS IN CSV ---');
duplicateMobiles.slice(0, 15).forEach(m => {
  console.log(`Phone: ${m} (Appears ${phoneCounts[m].length} times):`);
  phoneCounts[m].forEach(item => {
    console.log(`  - Row ${item.row}: ID=${item.id}, Name="${item.name}"`);
  });
});
