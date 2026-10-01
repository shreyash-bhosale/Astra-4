import { Router } from 'express';
import { listPolicies, getPolicy, createPolicy, updatePolicy } from '../controllers/policyController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listPolicies);
router.post('/', requireAuth, requireRole(['manager', 'admin', 'agent']), createPolicy);
router.get('/:id', requireAuth, getPolicy);
router.patch('/:id', requireAuth, requireRole(['manager', 'admin', 'agent']), updatePolicy);

export default router;
