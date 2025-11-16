import { Router } from 'express';
import { getAuditLogs, getAuditLog } from '../controllers/audit.controller';
import { platformAuth, requireRole } from '../middleware/platform-auth.middleware';

const router = Router();

router.use(platformAuth);

// GET /api/audit - List audit logs (with filters)
router.get('/', requireRole('SUPER_ADMIN', 'ADMIN', 'OPERATOR'), getAuditLogs);

// GET /api/audit/:id - Get specific audit log
router.get('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'OPERATOR'), getAuditLog);

export default router;
