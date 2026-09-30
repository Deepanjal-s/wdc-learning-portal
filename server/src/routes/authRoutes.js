import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { currentUser, login, logout, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, currentUser);

export default router;
