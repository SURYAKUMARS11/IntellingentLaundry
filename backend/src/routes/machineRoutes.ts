import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getMachineLogs,
  logMachineCycle,
  getGasCylinderLogs,
  logGasCylinder,
  getMachineUtilityAnalytics,
} from '../controllers/machineController';

const router = Router();

router.use(authMiddleware);

// Machine Cycle Logs
router.get('/logs', getMachineLogs);
router.post('/logs', logMachineCycle);

// Gas Cylinders
router.get('/cylinders', getGasCylinderLogs);
router.post('/cylinders', logGasCylinder);

// Utility Analytics
router.get('/analytics', getMachineUtilityAnalytics);

export default router;
