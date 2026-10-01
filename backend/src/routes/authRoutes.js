import { Router } from 'express';
import { register, login, getMe, updateMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);
router.put('/me', requireAuth, updateMe);

export default router;
