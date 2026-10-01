import { Router } from 'express';
import { listOrders, getOrder } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listOrders);
router.get('/:id', requireAuth, getOrder);

export default router;
