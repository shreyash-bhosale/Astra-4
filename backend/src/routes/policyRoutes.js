import { Router } from 'express';
import { listPolicies, getPolicy, createPolicy, updatePolicy } from '../controllers/policyController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requireRole(['agent', 'manager', 'admin']), listPolicies);
router.post('/', requireAuth, requireRole(['manager', 'admin']), createPolicy);
router.get('/:id', requireAuth, requireRole(['agent', 'manager', 'admin']), getPolicy);
router.patch('/:id', requireAuth, requireRole(['manager', 'admin']), updatePolicy);

export default router;
