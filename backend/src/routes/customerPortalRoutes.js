import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getCustomerProfile,
  getCustomerTickets,
  createCustomerTicket,
  getCustomerTicketById,
  getCustomerTicketTimeline,
  getCustomerOrders,
  getCustomerNotifications,
  customerChat,
  updateCustomerPreferences,
  deleteCustomerAccount
} from '../controllers/customerPortalController.js';

const router = Router();

// Customer Portal Endpoints (Scoped strictly to authenticated customer)
router.get('/me', requireAuth, getCustomerProfile);
router.patch('/preferences', requireAuth, updateCustomerPreferences);
router.delete('/account', requireAuth, deleteCustomerAccount);
router.get('/tickets', requireAuth, getCustomerTickets);
router.post('/tickets', requireAuth, createCustomerTicket);
router.get('/tickets/:id', requireAuth, getCustomerTicketById);
router.get('/tickets/:id/timeline', requireAuth, getCustomerTicketTimeline);
router.get('/orders', requireAuth, getCustomerOrders);
router.get('/notifications', requireAuth, getCustomerNotifications);
router.post('/chat', requireAuth, customerChat);

export default router;
