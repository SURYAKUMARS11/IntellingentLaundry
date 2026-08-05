import { Router } from 'express';
import {
  getServices,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService,
} from '../controllers/serviceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getServices);
router.post('/', createService);
router.put('/:id', updateService);
router.patch('/:id/toggle', toggleServiceStatus);
router.delete('/:id', deleteService);

export default router;
