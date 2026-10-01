import { Router } from 'express';
import {
  listApprovals,
  approveAction,
  rejectAction,
  evaluateApproval,
  aiDecideApproval
} from '../controllers/approvalController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requireRole(['agent', 'manager', 'admin']), listApprovals);
router.get('/:id/evaluate', requireAuth, requireRole(['agent', 'manager', 'admin']), evaluateApproval);
router.post('/:id/evaluate', requireAuth, requireRole(['agent', 'manager', 'admin']), evaluateApproval);
router.post('/:id/ai-decide', requireAuth, requireRole(['manager', 'admin']), aiDecideApproval);
router.post('/:id/approve', requireAuth, requireRole(['manager', 'admin']), approveAction);
router.post('/:id/reject', requireAuth, requireRole(['manager', 'admin']), rejectAction);

export default router;
