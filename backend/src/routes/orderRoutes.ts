import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  recordOrderPayment,
  deleteOrder,
} from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/payments', recordOrderPayment);
router.delete('/:id', deleteOrder);

export default router;
