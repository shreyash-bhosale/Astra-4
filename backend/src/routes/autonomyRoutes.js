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
router.get('/settings', requireAuth, requireRole(['agent', 'manager', 'admin']), getAutonomySettings);

// Protected Operations for Admin & Operations Manager
router.patch('/settings', requireAuth, requireRole(['admin', 'manager']), updateAutonomySettings);
router.post('/enable', requireAuth, requireRole(['admin', 'manager']), enableAutonomousMode);
router.post('/disable', requireAuth, requireRole(['admin', 'manager']), disableAutonomousMode);
router.post('/pause', requireAuth, requireRole(['admin', 'manager']), pauseAutonomousMode);
router.post('/resume', requireAuth, requireRole(['admin', 'manager']), resumeAutonomousMode);
router.post('/emergency-stop', requireAuth, requireRole(['admin', 'manager']), emergencyStop);

export default router;
