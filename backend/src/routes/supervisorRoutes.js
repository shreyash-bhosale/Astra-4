import { Router } from 'express';
import {
  getSupervisorStatus,
  getSupervisorAgents,
  getSupervisorWorkflows,
  getSupervisorEvents,
  postSupervisorQuery
} from '../controllers/supervisorController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/status', requireAuth, getSupervisorStatus);
router.get('/agents', requireAuth, getSupervisorAgents);
router.get('/workflows', requireAuth, getSupervisorWorkflows);
router.get('/events', requireAuth, getSupervisorEvents);
router.post('/query', requireAuth, postSupervisorQuery);

export default router;
