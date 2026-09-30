import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { completeItem, getProgress } from '../controllers/progressController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.get('/dashboard', requireAuth, getDashboard);
router.get('/profile', requireAuth, getProfile);
router.patch('/profile', requireAuth, updateProfile);
router.get('/progress', requireAuth, getProgress);
router.post('/progress/complete', requireAuth, completeItem);

export default router;
