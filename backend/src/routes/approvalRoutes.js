import { Router } from 'express';
import { listApprovals, approveAction, rejectAction } from '../controllers/approvalController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listApprovals);
router.post('/:id/approve', requireAuth, approveAction);
router.post('/:id/reject', requireAuth, rejectAction);

export default router;
