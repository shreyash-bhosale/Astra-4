import { Router } from 'express';
import { listApprovals, approveAction, rejectAction } from '../controllers/approvalController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listApprovals);
router.post('/:id/approve', requireAuth, requireRole(['manager', 'admin']), approveAction);
router.post('/:id/reject', requireAuth, requireRole(['manager', 'admin']), rejectAction);

export default router;
