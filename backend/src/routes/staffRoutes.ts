import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getAttendance,
  markAttendance,
  deleteAttendance,
  getIroningWorkLogs,
  logIroningWork,
  getStaffPerformanceReport,
} from '../controllers/staffController';

const router = Router();

router.use(authMiddleware);

// Staff Profiles
router.get('/', getAllStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

// Attendance Register
router.get('/attendance', getAttendance);
router.post('/attendance', markAttendance);
router.delete('/attendance/:id', deleteAttendance);

// Ironing Productivity
router.get('/ironing', getIroningWorkLogs);
router.post('/ironing', logIroningWork);

// Performance Reports
router.get('/reports', getStaffPerformanceReport);

export default router;
