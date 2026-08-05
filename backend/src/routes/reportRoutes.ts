import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueReport,
  exportCSV,
} from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueReport);
router.get('/export', exportCSV);

export default router;
