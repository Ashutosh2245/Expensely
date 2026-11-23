import express from 'express';
import { getGroupActivities, getUserActivities } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/group/:groupId', getGroupActivities);
router.get('/me', getUserActivities);

export default router;
