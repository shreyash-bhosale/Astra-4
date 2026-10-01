import { Router } from 'express';
import { listActivity, getAgenticMetrics } from '../controllers/activityController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireRole(['agent', 'manager', 'admin']));

router.get('/', listActivity);
router.get('/metrics', getAgenticMetrics);

export default router;

