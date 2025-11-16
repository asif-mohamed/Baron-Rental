import { Router } from 'express';
import { getPlatformInfo, getPlatformStats, getConnectedTenants } from '../controllers/platform.controller';
import { platformAuth } from '../middleware/platform-auth.middleware';

const router = Router();

router.use(platformAuth);

// GET /api/platform/info - Platform information
router.get('/info', getPlatformInfo);

// GET /api/platform/stats - Platform statistics
router.get('/stats', getPlatformStats);

// GET /api/platform/connected - Connected tenants (WebSocket)
router.get('/connected', getConnectedTenants);

export default router;
