import { Router } from 'express';
import { getPayments } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getPayments);

export default router;
