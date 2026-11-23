import express from 'express';
import { searchUsers, getUserByUsername, updateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/search', searchUsers);
router.get('/:username', getUserByUsername);
router.patch('/profile', updateProfile);

export default router;
