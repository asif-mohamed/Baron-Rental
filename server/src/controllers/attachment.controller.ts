import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import path from 'path';
import fs from 'fs/promises';

export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = (req as any).file;
    const { entityType, entityId } = req.body;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath: file.path,
        entityType,
        entityId,
        uploadedById: req.user!.id,
      },
    });

    res.status(201).json({ attachment });
  } catch (error) {
    next(error);
  }
};

export const getAttachments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = req.params;

    const attachments = await prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ attachments });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: req.params.id },
    });

    if (!attachment) {
      throw new AppError('File not found', 404);
    }

    res.download(attachment.filePath, attachment.originalName);
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: req.params.id },
    });

    if (!attachment) {
      throw new AppError('File not found', 404);
    }

    // Delete file from filesystem
    try {
      await fs.unlink(attachment.filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};
