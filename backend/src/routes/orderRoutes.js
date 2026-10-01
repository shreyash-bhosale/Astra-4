import { Router } from 'express';
import { listOrders, getOrder } from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requireRole(['agent', 'manager', 'admin']), listOrders);
router.get('/:id', requireAuth, requireRole(['agent', 'manager', 'admin']), getOrder);

export default router;
