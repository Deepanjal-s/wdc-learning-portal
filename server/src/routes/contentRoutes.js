import { Router } from 'express';
import * as content from '../controllers/contentController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();
router.get('/tracks', content.listTracks);
router.get('/tracks/:trackId', requireAuth, content.getTrack);
router.get('/roadmap/:trackId', requireAuth, content.getRoadmap);
router.get('/resources', optionalAuth, content.listResources);
router.get('/resources/:id', requireAuth, content.getResource);
router.get('/tasks', optionalAuth, content.listTasks);
router.get('/tasks/:id', requireAuth, content.getTask);
router.get('/recruitment-rounds', content.listRecruitmentRounds);
router.get('/recruitment-rounds/:roundNumber', content.getRecruitmentRound);

export default router;
