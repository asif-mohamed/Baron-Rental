import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/plan.controller';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET all business plans (Manager and Admin only)
router.get('/', authorize('Admin', 'Manager'), getAllPlans);

// GET single business plan by ID (Manager and Admin only)
router.get('/:id', authorize('Admin', 'Manager'), getPlanById);

// POST create new business plan (Manager and Admin only)
router.post('/', authorize('Admin', 'Manager'), createPlan);

// PUT update business plan (Manager and Admin only)
router.put('/:id', authorize('Admin', 'Manager'), updatePlan);

// DELETE business plan (Manager and Admin only)
router.delete('/:id', authorize('Admin', 'Manager'), deletePlan);

export default router;
