import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueReport,
  getProfitAndLossReport,
  exportCSV,
} from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueReport);
router.get('/pnl', getProfitAndLossReport);
router.get('/export', exportCSV);

export default router;
