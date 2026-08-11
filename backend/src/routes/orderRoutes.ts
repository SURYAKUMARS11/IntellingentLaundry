import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  getPublicOrderByNumber,
  createOrder,
  updateOrder,
  updateOrderStatus,
  recordOrderPayment,
  deleteOrder,
} from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes for customer digital receipt access
router.get('/public-receipt', getPublicOrderByNumber);
router.get('/public/:orderNumber', getPublicOrderByNumber);
router.get('/public/*', getPublicOrderByNumber);

// Protected routes (Admin Auth required)
router.use(authMiddleware);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/payments', recordOrderPayment);
router.delete('/:id', deleteOrder);

export default router;
