import { Router } from 'express';
import * as content from '../controllers/contentController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.get('/tracks', content.listTracks);
router.get('/tracks/:trackId', content.getTrack);
router.get('/roadmap/:trackId', requireAuth, content.getRoadmap);
router.get('/resources', content.listResources);
router.get('/resources/:id', content.getResource);
router.get('/tasks', content.listTasks);
router.get('/tasks/:id', content.getTask);
router.get('/recruitment-rounds', content.listRecruitmentRounds);
router.get('/recruitment-rounds/:roundNumber', content.getRecruitmentRound);

export default router;
