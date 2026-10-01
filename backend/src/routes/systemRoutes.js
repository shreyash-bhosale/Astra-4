import { Router } from 'express';
import { getHealth, getSettings, updateSettings, resetDatabase, globalSearch } from '../controllers/systemController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/health', getHealth);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.post('/reset', resetDatabase);
router.get('/search', requireAuth, globalSearch);

export default router;
