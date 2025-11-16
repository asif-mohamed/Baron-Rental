import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth.middleware';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.post('/', checkPermission('transactions', 'create'), createTransaction);
router.put('/:id', checkPermission('transactions', 'update'), updateTransaction);
router.delete('/:id', checkPermission('transactions', 'delete'), deleteTransaction);

export default router;
