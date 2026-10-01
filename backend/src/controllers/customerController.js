import { db } from '../db/store.js';
import { CreateCustomerSchema } from '../validators/index.js';

export const listCustomers = async (req, res, next) => {
  try {
    const customers = db.find('customers');
    const populated = customers.map(c => {
      const orders = db.find('orders', o => o.customer_id === c.id || o.customerId === c.id || (c.email && o.customer_email === c.email));
      const tickets = db.find('tickets', t => t.customer_id === c.id || t.customerId === c.id);
      const totalSpent = orders.reduce((sum, o) => {
        const val = Number(o.amount) || Number(o.price) || (o.items && Number(o.items[0]?.price)) || 0;
        return sum + val;
      }, 0);
      return {
        ...c,
        ordersCount: orders.length,
        ticketsCount: tickets.length,
        totalSpent,
        orders
      };
    });
    return res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = db.findById('customers', id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const orders = db.find('orders', o => o.customer_id === id);
    const tickets = db.find('tickets', t => t.customer_id === id);
    return res.json({
      ...customer,
      orders,
      tickets
    });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const validated = CreateCustomerSchema.parse(req.body);
    const customer = db.insert('customers', validated);
    return res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};
