import { Router } from 'express';
import { getTenants, getTenant, createTenant, updateTenant, deleteTenant } from '../controllers/tenant.controller';
import { platformAuth, requireRole } from '../middleware/platform-auth.middleware';

const router = Router();

// All tenant routes require authentication
router.use(platformAuth);

// GET /api/tenants - List all tenants
router.get('/', getTenants);

// GET /api/tenants/:id - Get specific tenant
router.get('/:id', getTenant);

// POST /api/tenants - Create new tenant
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), createTenant);

// PUT /api/tenants/:id - Update tenant
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), updateTenant);

// DELETE /api/tenants/:id - Delete tenant
router.delete('/:id', requireRole('SUPER_ADMIN'), deleteTenant);

export default router;
