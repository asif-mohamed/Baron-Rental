import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth.middleware';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} from '../controllers/customer.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllCustomers);
router.get('/search', searchCustomers);
router.get('/:id', getCustomerById);
router.post('/', checkPermission('customers', 'create'), createCustomer);
router.put('/:id', checkPermission('customers', 'update'), updateCustomer);
router.delete('/:id', checkPermission('customers', 'delete'), deleteCustomer);

export default router;
