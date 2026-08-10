const map = new Map();
const obj = { id: 1, orderNumber: 'ORD-410/26', amount: 150 };

const key = '675a1234';
map.set(key, obj);
map.set('ORD-410/26', obj);

console.log('Map size:', map.size);
console.log('Array.from(map.values()).length:', Array.from(map.values()).length);
