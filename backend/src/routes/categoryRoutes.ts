import express from 'express';
import {
  getGarmentCategories,
  createGarmentCategory,
  updateGarmentCategory,
  deleteGarmentCategory,
} from '../controllers/garmentCategoryController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getGarmentCategories);
router.post('/', createGarmentCategory);
router.put('/:id', updateGarmentCategory);
router.delete('/:id', deleteGarmentCategory);

export default router;
