import { Router } from 'express';
import {
  getAutonomySettings,
  updateAutonomySettings,
  enableAutonomousMode,
  disableAutonomousMode,
  pauseAutonomousMode,
  resumeAutonomousMode,
  emergencyStop
} from '../controllers/autonomyController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Read settings allowed for authenticated staff/managers/admins
router.get('/settings', requireAuth, getAutonomySettings);

// Admin-Only Protected Operations
router.patch('/settings', requireAuth, requireRole(['admin']), updateAutonomySettings);
router.post('/enable', requireAuth, requireRole(['admin']), enableAutonomousMode);
router.post('/disable', requireAuth, requireRole(['admin']), disableAutonomousMode);
router.post('/pause', requireAuth, requireRole(['admin']), pauseAutonomousMode);
router.post('/resume', requireAuth, requireRole(['admin']), resumeAutonomousMode);
router.post('/emergency-stop', requireAuth, requireRole(['admin']), emergencyStop);

export default router;
