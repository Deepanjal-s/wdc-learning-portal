import { Router } from 'express';
import { deleteContent, getAdminContent, upsertContent } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/content', getAdminContent);
router.post('/content/:type', upsertContent);
router.patch('/content/:type/:id', upsertContent);
router.delete('/content/:type/:id', deleteContent);

export default router;
