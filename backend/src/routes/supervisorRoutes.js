import { Router } from 'express';
import {
  getSupervisorStatus,
  getSupervisorAgents,
  getSupervisorWorkflows,
  getSupervisorEvents,
  postSupervisorQuery
} from '../controllers/supervisorController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Internal Supervisor Fleet Control & Telemetry (Staff only)
router.use(requireAuth, requireRole(['agent', 'manager', 'admin']));

router.get('/status', getSupervisorStatus);
router.get('/agents', getSupervisorAgents);
router.get('/workflows', getSupervisorWorkflows);
router.get('/events', getSupervisorEvents);
router.post('/query', postSupervisorQuery);

export default router;
