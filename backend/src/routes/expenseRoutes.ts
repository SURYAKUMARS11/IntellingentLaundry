import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getAccountsSummary,
} from '../controllers/expenseController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Accounts & Expenses routes
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.get('/summary', getAccountsSummary);

export default router;
