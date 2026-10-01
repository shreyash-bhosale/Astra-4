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
  markNotificationRead,
  markAllNotificationsRead,
  customerChat,
  updateCustomerPreferences,
  deleteCustomerAccount
} from '../controllers/customerPortalController.js';

const router = Router();

// Customer Portal Endpoints (Scoped strictly to authenticated customer)
router.get('/me', requireAuth, getCustomerProfile);
router.patch('/preferences', requireAuth, updateCustomerPreferences);
router.delete('/account', requireAuth, deleteCustomerAccount);

// Issues / Tickets (Both /tickets and /issues supported)
router.get('/tickets', requireAuth, getCustomerTickets);
router.post('/tickets', requireAuth, createCustomerTicket);
router.get('/issues', requireAuth, getCustomerTickets);
router.post('/issues', requireAuth, createCustomerTicket);
router.get('/tickets/:id', requireAuth, getCustomerTicketById);
router.get('/tickets/:id/timeline', requireAuth, getCustomerTicketTimeline);

// Orders
router.get('/orders', requireAuth, getCustomerOrders);

// Notifications
router.get('/notifications', requireAuth, getCustomerNotifications);
router.patch('/notifications/:id/read', requireAuth, markNotificationRead);
router.post('/notifications/mark-all-read', requireAuth, markAllNotificationsRead);
router.patch('/notifications/read-all', requireAuth, markAllNotificationsRead);

// AI Chat Support
router.post('/chat', requireAuth, customerChat);

export default router;
