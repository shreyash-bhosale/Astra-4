import { db } from './store.js';

console.log('Seeding ResolveAI database...');
db.reset();
console.log('Database successfully re-seeded with demo personas, orders, and policies.');
console.log('Users:', db.find('users').length);
console.log('Customers:', db.find('customers').length);
console.log('Orders:', db.find('orders').length);
console.log('Policies:', db.find('policies').length);
console.log('Tickets:', db.find('tickets').length);
