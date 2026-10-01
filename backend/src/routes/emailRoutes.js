import { Router } from 'express';
import { retryEmail } from '../controllers/emailController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { emailRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/:id/retry', requireAuth, emailRateLimiter, retryEmail);

export default router;
