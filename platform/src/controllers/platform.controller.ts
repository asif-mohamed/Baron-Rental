import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger';
import os from 'os';

const prisma = new PrismaClient();

// GET /api/platform/info
export const getPlatformInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const info = {
      platform: 'Baron Platform',
      version: process.env.PLATFORM_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      hostname: os.hostname(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      ports: {
        http: process.env.PLATFORM_PORT || 6000,
        ssh: process.env.SSH_PORT || 2222,
        ws: process.env.WS_PORT || 6001,
      },
    };
    
    res.json(info);
  } catch (error: any) {
    logger.error('Error fetching platform info', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch platform info' });
  }
};

// GET /api/platform/stats
export const getPlatformStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalTenants, activeTenants, totalServices, activeServices, totalUsers] =
      await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        prisma.serviceInstance.count(),
        prisma.serviceInstance.count({ where: { status: 'HEALTHY' } }),
        prisma.tenantUser.count(),
      ]);
    
    const stats = {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        inactive: totalTenants - activeTenants,
      },
      services: {
        total: totalServices,
        healthy: activeServices,
        degraded: await prisma.serviceInstance.count({
          where: { status: 'DEGRADED' },
        }),
        down: await prisma.serviceInstance.count({ where: { status: 'DOWN' } }),
      },
      users: {
        total: totalUsers,
      },
    };
    
    res.json(stats);
  } catch (error: any) {
    logger.error('Error fetching platform stats', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
};

// GET /api/platform/connected
export const getConnectedTenants = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would query the ConfigSyncService for active WebSocket connections
    // For now, return placeholder
    const connected: string[] = [];
    
    res.json({ connected });
  } catch (error: any) {
    logger.error('Error fetching connected tenants', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch connected tenants' });
  }
};
