import { db } from '../db/store.js';

export const listOrders = async (req, res, next) => {
  try {
    const orders = db.find('orders');
    const populated = orders.map(o => {
      const customer = db.findById('customers', o.customer_id);
      return {
        ...o,
        customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null
      };
    });
    populated.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    return res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = db.findById('orders', id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const customer = db.findById('customers', order.customer_id);
    return res.json({
      ...order,
      customer
    });
  } catch (err) {
    next(err);
  }
};
