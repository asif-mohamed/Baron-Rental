import { Router } from 'express';
import { getServices, getService, updateService, checkServiceHealth } from '../controllers/service.controller';
import { platformAuth, requireRole } from '../middleware/platform-auth.middleware';

const router = Router();

router.use(platformAuth);

// GET /api/services - List all services
router.get('/', getServices);

// GET /api/services/:id - Get specific service
router.get('/:id', getService);

// PUT /api/services/:id - Update service
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), updateService);

// POST /api/services/:id/health - Check service health
router.post('/:id/health', checkServiceHealth);

export default router;
