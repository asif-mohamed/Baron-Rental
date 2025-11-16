import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth.middleware';
import {
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getAvailableCars,
  updateCarStatus,
} from '../controllers/car.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllCars);
router.get('/available', getAvailableCars);
router.get('/:id', getCarById);
router.post('/', checkPermission('cars', 'create'), createCar);
router.put('/:id', checkPermission('cars', 'update'), updateCar);
router.patch('/:id/status', checkPermission('cars', 'update'), updateCarStatus);
router.delete('/:id', checkPermission('cars', 'delete'), deleteCar);

export default router;
