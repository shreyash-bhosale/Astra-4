import { Router } from 'express';
import { listCustomers, getCustomer, createCustomer } from '../controllers/customerController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listCustomers);
router.post('/', requireAuth, createCustomer);
router.get('/:id', requireAuth, getCustomer);

export default router;
