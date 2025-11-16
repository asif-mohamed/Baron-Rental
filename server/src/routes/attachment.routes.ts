import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import {
  uploadFile,
  getAttachments,
  downloadFile,
  deleteFile,
} from '../controllers/attachment.controller';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadMiddleware, uploadFile);
router.get('/:entityType/:entityId', getAttachments);
router.get('/download/:id', downloadFile);
router.delete('/:id', deleteFile);

export default router;
