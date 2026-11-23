import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  inviteMember,
  joinByInviteCode,
  removeMember
} from '../controllers/groupController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireGroupMember, requireGroupAdmin, requireGroupOwner } from '../middleware/groupAuth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.patch('/:id', requireGroupAdmin, updateGroup);
router.delete('/:id', requireGroupOwner, deleteGroup);
router.post('/:id/invite', requireGroupMember, inviteMember);
router.post('/join/:inviteCode', joinByInviteCode);
router.delete('/:id/members/:memberId', requireGroupMember, removeMember);

export default router;
