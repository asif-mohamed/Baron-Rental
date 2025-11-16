import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// GET /api/services
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, type, status } = req.query;
    
    const where: any = {};
    
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    const services = await prisma.serviceInstance.findMany({
      where,
      include: { tenant: true },
      orderBy: { lastHealthCheck: 'desc' },
    });
    
    res.json(services);
  } catch (error: any) {
    logger.error('Error fetching services', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// GET /api/services/:id
export const getService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const service = await prisma.serviceInstance.findUnique({
      where: { id },
      include: { tenant: true },
    });
    
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    
    res.json(service);
  } catch (error: any) {
    logger.error('Error fetching service', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

// PUT /api/services/:id
export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { host, port, version, metadata } = req.body;
    
    const service = await prisma.serviceInstance.update({
      where: { id },
      data: {
        ...(host && { host }),
        ...(port && { port }),
        ...(version && { version }),
        ...(metadata && { metadata }),
      },
    });
    
    logger.info(`Updated service: ${service.id}`);
    
    res.json(service);
  } catch (error: any) {
    logger.error('Error updating service', { error: error.message });
    res.status(500).json({ error: 'Failed to update service' });
  }
};

// POST /api/services/:id/health
export const checkServiceHealth = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // This would trigger HealthMonitorService.checkService(id)
    logger.info(`Health check initiated for service: ${id}`);
    
    res.json({ message: 'Health check initiated' });
  } catch (error: any) {
    logger.error('Error checking service health', { error: error.message });
    res.status(500).json({ error: 'Failed to check service health' });
  }
};
