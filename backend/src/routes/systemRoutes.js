import { Router } from 'express';
import { getHealth, getSettings, resetDatabase } from '../controllers/systemController.js';

const router = Router();

router.get('/health', getHealth);
router.get('/settings', getSettings);
router.post('/reset', resetDatabase);

export default router;
