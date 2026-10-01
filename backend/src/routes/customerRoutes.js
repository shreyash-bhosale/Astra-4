import { Router } from 'express';
import { listCustomers, getCustomer, createCustomer } from '../controllers/customerController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requireRole(['agent', 'manager', 'admin']), listCustomers);
router.post('/', requireAuth, requireRole(['agent', 'manager', 'admin']), createCustomer);
router.get('/:id', requireAuth, requireRole(['agent', 'manager', 'admin']), getCustomer);

export default router;
