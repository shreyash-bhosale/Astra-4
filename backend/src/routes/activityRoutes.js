import { Router } from 'express';
import { listActivity } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listActivity);

export default router;
