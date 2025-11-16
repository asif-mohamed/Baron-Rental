import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure storage for different entity types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const entityType = req.body.entityType || 'general';
    const uploadPath = path.join(__dirname, '../../uploads', entityType);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter for security
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and WEBP files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/upload/single
 * Upload a single file
 */
router.post('/single', (req: Request, res: Response) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(500).json({ 
        status: 'error',
        message: err.message || 'Failed to upload file',
        error: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ 
          status: 'error',
          message: 'No file uploaded' 
        });
      }

      const filePath = `/uploads/${req.body.entityType || 'general'}/${req.file.filename}`;
      
      res.json({
        message: 'File uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: filePath
        }
      });
    } catch (error: any) {
      console.error('Upload processing error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to process uploaded file',
        error: error.message
      });
    }
  });
});

/**
 * POST /api/upload/multiple
 * Upload multiple files
 */
router.post('/multiple', upload.array('files', 5), (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${req.body.entityType || 'general'}/${file.filename}`
    }));

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

/**
 * DELETE /api/upload/:entityType/:filename
 * Delete a file
 */
router.delete('/:entityType/:filename', (req: Request, res: Response) => {
  try {
    const { entityType, filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', entityType, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
