import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth.middleware';
import {
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getMaintenanceProfiles,
  createMaintenanceProfile,
  getMechanicView,
} from '../controllers/maintenance.controller';

const router = Router();

router.use(authenticate);

router.get('/mechanic-view', getMechanicView);
router.get('/', getAllMaintenance);
router.get('/profiles', getMaintenanceProfiles);
router.get('/:id', getMaintenanceById);
router.post('/', checkPermission('maintenance', 'create'), createMaintenance);
router.post('/profiles', checkPermission('maintenance', 'create'), createMaintenanceProfile);
router.put('/:id', checkPermission('maintenance', 'update'), updateMaintenance);
router.patch('/:id', checkPermission('maintenance', 'update'), updateMaintenance);
router.delete('/:id', checkPermission('maintenance', 'delete'), deleteMaintenance);

export default router;
