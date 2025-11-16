import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getDashboardStats,
  getRevenueReport,
  getFleetUtilization,
  getMaintenanceReport,
  exportReport,
  getEmployeePerformance,
  getManagerOverview,
  getFinancialOverview,
  getReceptionistStats,
  getWarehouseOverview,
} from '../controllers/report.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/manager-overview', authorize('Admin', 'Manager'), getManagerOverview);
router.get('/financial-overview', authorize('Admin', 'Accountant'), getFinancialOverview);
router.get('/receptionist-stats', authorize('Admin', 'Reception'), getReceptionistStats);
router.get('/warehouse-overview', authorize('Admin', 'Warehouse'), getWarehouseOverview);
router.get('/revenue', getRevenueReport);
router.get('/fleet-utilization', getFleetUtilization);
router.get('/maintenance', getMaintenanceReport);
router.get('/employee-performance', authorize('Admin', 'Manager'), getEmployeePerformance);
router.post('/export', exportReport);

export default router;
