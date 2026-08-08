import { Router } from 'express';
import { exportMasterExcelBackup, restoreMasterExcelBackup } from '../controllers/backupController';

const router = Router();

router.get('/export', exportMasterExcelBackup);
router.post('/restore', restoreMasterExcelBackup);

export default router;
