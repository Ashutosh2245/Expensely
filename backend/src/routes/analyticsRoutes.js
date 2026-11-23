import express from 'express';
import { getAnalytics, exportCSV } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getAnalytics);
router.get('/export/csv', exportCSV);

export default router;
