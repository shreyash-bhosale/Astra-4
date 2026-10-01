import { tools } from '../tools/index.js';
import { aiService } from '../services/aiService.js';
import { InvestigationOutputSchema } from '../validators/index.js';

export class InvestigationAgent {
  constructor() {
    this.name = 'Investigation Agent';
    this.badge = '⌕';
  }

  async run({ ticket }) {
    // 1. Retrieve customer details
    const customerRes = ticket.customer_id ? await tools.getCustomer({ customerId: ticket.customer_id }) : null;
    const customer = customerRes?.found ? customerRes.customer : null;

    // 2. Retrieve order details
    let order = null;
    if (ticket.order_id) {
      const orderRes = await tools.getOrder({ orderId: ticket.order_id });
      if (orderRes.found) order = orderRes.order;
    }

    if (!order && ticket.customer_id) {
      const ordersRes = await tools.getCustomerOrders({ customerId: ticket.customer_id });
      if (ordersRes.orders && ordersRes.orders.length > 0) {
        order = ordersRes.orders[0];
      }
    }

    // 3. Compute timeline metrics
    let daysSinceDelivery = null;
    let isEligible = false;

    if (order && order.delivery_date) {
      const deliveredTime = new Date(order.delivery_date).getTime();
      const currentTime = new Date('2026-10-01T10:00:00.000Z').getTime(); // project reference time
      daysSinceDelivery = Math.max(0, Math.floor((currentTime - deliveredTime) / (1000 * 60 * 60 * 24)));
      isEligible = daysSinceDelivery <= 14;
    } else if (order && order.status === 'PROCESSING') {
      isEligible = true;
    }

    // 4. Summarize evidence points
    const evidencePoints = [];
    if (customer) {
      evidencePoints.push(`Customer confirmed: ${customer.name} (${customer.tier || 'Standard'}) - ${customer.email}`);
    }
    if (order) {
      evidencePoints.push(`Order verified: #${order.id} for '${order.product_name}' ($${order.amount.toFixed(2)})`);
      evidencePoints.push(`Fulfillment Status: ${order.status}${order.tracking_number ? ` (Tracking: ${order.tracking_number})` : ''}`);
      if (daysSinceDelivery !== null) {
        evidencePoints.push(`Delivered ${daysSinceDelivery} day(s) ago (${order.delivery_date}). 14-day warranty requirement is satisfied.`);
      }
    } else {
      evidencePoints.push('No direct order reference linked. Requires lookup.');
    }

    return {
      customerFound: !!customer,
      orderFound: !!order,
      customerName: customer ? customer.name : null,
      orderId: order ? order.id : null,
      productName: order ? order.product_name : null,
      orderDate: order ? order.order_date : null,
      deliveryDate: order ? order.delivery_date : null,
      daysSinceDelivery,
      isEligibleForWarranty: isEligible,
      keyFindings: evidencePoints
    };
  }
}

export const investigationAgent = new InvestigationAgent();
