import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  toggleUserStatus,
} from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Admin', 'Manager'), getAllUsers);
router.get('/roles', getRoles);
router.get('/recipients-list', getAllUsers); // For notification recipient selection
router.get('/:id', getUserById);
router.post('/', authorize('Admin', 'Manager'), createUser);
router.put('/:id', authorize('Admin', 'Manager'), updateUser);
router.patch('/:id/toggle-status', authorize('Admin', 'Manager'), toggleUserStatus);
router.delete('/:id', authorize('Admin'), deleteUser);

export default router;
