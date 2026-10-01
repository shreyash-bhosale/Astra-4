import { Router } from 'express';
import {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  runAIWorkflow,
  getTicketRuns
} from '../controllers/ticketController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { aiWorkflowLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/', requireAuth, listTickets);
router.post('/', requireAuth, createTicket);
router.get('/:id', requireAuth, getTicket);
router.patch('/:id', requireAuth, updateTicket);
router.delete('/:id', requireAuth, deleteTicket);
router.post('/:id/run', requireAuth, aiWorkflowLimiter, runAIWorkflow);
router.get('/:id/runs', requireAuth, getTicketRuns);

export default router;
