import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// GET /api/audit
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, resource, actorType, actorId, startDate, endDate, limit = 100 } = req.query;
    
    const where: any = {};
    
    if (action) {
      where.action = action;
    }
    
    if (resource) {
      where.resource = resource;
    }
    
    if (actorType) {
      where.actorType = actorType;
    }
    
    if (actorId) {
      where.actorId = actorId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }
    
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });
    
    res.json(logs);
  } catch (error: any) {
    logger.error('Error fetching audit logs', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// GET /api/audit/:id
export const getAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const log = await prisma.auditLog.findUnique({
      where: { id },
    });
    
    if (!log) {
      res.status(404).json({ error: 'Audit log not found' });
      return;
    }
    
    res.json(log);
  } catch (error: any) {
    logger.error('Error fetching audit log', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};
