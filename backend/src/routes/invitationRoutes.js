import express from 'express';
import { getInvitations, acceptInvitation, rejectInvitation } from '../controllers/invitationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getInvitations);
router.post('/:id/accept', acceptInvitation);
router.post('/:id/reject', rejectInvitation);

export default router;
