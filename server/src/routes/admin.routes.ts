import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAdminStats,
  getBusinessConfig,
  updateBusinessConfig,
  getTabs,
  updateTab,
  getRoles,
  updateRole,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and Admin role
router.use(authenticate);

// Platform statistics
router.get('/stats', getAdminStats);

// Business configuration (flavor settings)
router.get('/business-config', getBusinessConfig);
router.put('/business-config', updateBusinessConfig);

// Tab management
router.get('/tabs', getTabs);
router.patch('/tabs/:id', updateTab);

// Role management
router.get('/roles', getRoles);
router.patch('/roles/:id', updateRole);

export default router;
