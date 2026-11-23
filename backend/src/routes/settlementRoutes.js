import express from 'express';
import {
  createSettlement,
  getGroupSettlements,
  confirmSettlement,
  rejectSettlement
} from '../controllers/settlementController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createSettlement);
router.get('/group/:groupId', getGroupSettlements);
router.patch('/:id/confirm', confirmSettlement);
router.patch('/:id/reject', rejectSettlement);

export default router;
