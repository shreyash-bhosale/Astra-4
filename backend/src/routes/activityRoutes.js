import { Router } from 'express';
import { listActivity, getAgenticMetrics } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listActivity);
router.get('/metrics', requireAuth, getAgenticMetrics);

export default router;

