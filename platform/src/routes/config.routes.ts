import { Router } from 'express';
import { getConfig, updateConfig, syncConfig, syncAllConfigs } from '../controllers/config.controller';
import { platformAuth, requireRole } from '../middleware/platform-auth.middleware';

const router = Router();

router.use(platformAuth);

// GET /api/config/:tenantId - Get tenant configuration
router.get('/:tenantId', getConfig);

// PUT /api/config/:tenantId - Update tenant configuration
router.put('/:tenantId', requireRole('SUPER_ADMIN', 'ADMIN'), updateConfig);

// POST /api/config/:tenantId/sync - Sync config to tenant
router.post('/:tenantId/sync', requireRole('SUPER_ADMIN', 'ADMIN'), syncConfig);

// POST /api/config/sync-all - Sync all tenants
router.post('/sync-all', requireRole('SUPER_ADMIN'), syncAllConfigs);

export default router;
