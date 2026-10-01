import { Router } from 'express';
import { listPolicies, getPolicy, createPolicy, updatePolicy } from '../controllers/policyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listPolicies);
router.post('/', requireAuth, createPolicy);
router.get('/:id', requireAuth, getPolicy);
router.patch('/:id', requireAuth, updatePolicy);

export default router;
