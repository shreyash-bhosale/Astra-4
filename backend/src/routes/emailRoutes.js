import { Router } from 'express';
import {
  getEmailStatus,
  sendTestEmail,
  getEmailLogs,
  retryEmail
} from '../controllers/emailController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { emailRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/emails/status — Operational status of email subsystem (accessible to authenticated staff)
router.get('/status', requireAuth, getEmailStatus);

// POST /api/emails/test — Admin-only test email sent exclusively to authenticated admin's verified address
router.post('/test', requireAuth, requireRole(['admin']), emailRateLimiter, sendTestEmail);

// GET /api/emails/logs — Audit log of outbound transactional emails
router.get('/logs', requireAuth, getEmailLogs);

// POST /api/emails/:id/retry — Controlled retry for failed notifications
router.post('/:id/retry', requireAuth, emailRateLimiter, retryEmail);

export default router;
