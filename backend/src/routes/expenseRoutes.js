import express from 'express';
import {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', createExpense);
router.get('/group/:groupId', getGroupExpenses);
router.get('/:id', getExpenseById);
router.patch('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
