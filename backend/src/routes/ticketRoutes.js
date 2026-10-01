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
import { requireAuth } from '../middleware/authMiddleware.js';
import { aiWorkflowLimiter, emailRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/', requireAuth, listTickets);
router.post('/', requireAuth, createTicket);
router.get('/:id', requireAuth, getTicket);
router.patch('/:id', requireAuth, updateTicket);
router.delete('/:id', requireAuth, deleteTicket);
router.post('/:id/run', requireAuth, aiWorkflowLimiter, runAIWorkflow);
router.get('/:id/runs', requireAuth, getTicketRuns);
router.post('/:id/assign', requireAuth, assignTicket);
router.post('/:id/notes', requireAuth, addInternalNote);
router.post('/:id/send-update', requireAuth, emailRateLimiter, sendTicketUpdateEmail);
router.get('/:id/emails', requireAuth, getTicketEmails);

export default router;
