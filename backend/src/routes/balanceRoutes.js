import express from 'express';
import {
  getGroupBalances,
  getSettlementSuggestions,
  getUserOverallBalances
} from '../controllers/balanceController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/groups/:groupId', getGroupBalances);
router.get('/groups/:groupId/suggestions', getSettlementSuggestions);
router.get('/me', getUserOverallBalances);

export default router;
