import { Router } from 'express';
import { getHealth, getSettings, updateSettings, resetDatabase, globalSearch } from '../controllers/systemController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/health', getHealth);
router.get('/settings', requireAuth, requireRole(['agent', 'manager', 'admin']), getSettings);
router.patch('/settings', requireAuth, requireRole(['admin']), updateSettings);
router.post('/reset', requireAuth, requireRole(['admin']), resetDatabase);
router.get('/search', requireAuth, requireRole(['agent', 'manager', 'admin']), globalSearch);

export default router;
