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
  sendStaffPayslipWhatsApp,
  downloadStaffPayslipPDF,
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

// Direct WhatsApp Payslip PDF Route & Download PDF Route
router.post('/send-payslip-whatsapp', sendStaffPayslipWhatsApp);
router.post('/download-payslip-pdf', downloadStaffPayslipPDF);

export default router;
