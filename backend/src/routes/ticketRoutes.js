import { Router } from 'express';
import {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  runAIWorkflow,
  getTicketRuns,
  assignTicket,
  addInternalNote
} from '../controllers/ticketController.js';
import { sendTicketUpdateEmail, getTicketEmails } from '../controllers/emailController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { aiWorkflowLimiter, emailRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/', requireAuth, requireRole(['agent', 'manager', 'admin']), listTickets);
router.post('/', requireAuth, createTicket);
router.get('/:id', requireAuth, getTicket);
router.patch('/:id', requireAuth, requireRole(['agent', 'manager', 'admin']), updateTicket);
router.delete('/:id', requireAuth, requireRole(['admin']), deleteTicket);
router.post('/:id/run', requireAuth, requireRole(['agent', 'manager', 'admin']), aiWorkflowLimiter, runAIWorkflow);
router.get('/:id/runs', requireAuth, requireRole(['agent', 'manager', 'admin']), getTicketRuns);
router.post('/:id/assign', requireAuth, requireRole(['agent', 'manager', 'admin']), assignTicket);
router.post('/:id/notes', requireAuth, requireRole(['agent', 'manager', 'admin']), addInternalNote);
router.post('/:id/send-update', requireAuth, requireRole(['agent', 'manager', 'admin']), emailRateLimiter, sendTicketUpdateEmail);
router.get('/:id/emails', requireAuth, requireRole(['agent', 'manager', 'admin']), getTicketEmails);

export default router;
