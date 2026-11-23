import express from 'express';
import {
  sendFriendRequest,
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
} from '../controllers/friendController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/request', sendFriendRequest);
router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.post('/accept/:id', acceptFriendRequest);
router.post('/reject/:id', rejectFriendRequest);
router.delete('/:id', removeFriend);

export default router;
