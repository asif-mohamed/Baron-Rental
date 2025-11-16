import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// GET /api/config/:tenantId
export const getConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.params;
    
    const config = await prisma.tenantConfiguration.findUnique({
      where: { tenantId },
      include: { tenant: true },
    });
    
    if (!config) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }
    
    res.json(config);
  } catch (error: any) {
    logger.error('Error fetching configuration', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

// PUT /api/config/:tenantId
export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.params;
    const {
      displayName,
      theme,
      timezone,
      currency,
      language,
      dateFormat,
      enabledFeatures,
      enabledRoles,
      customSettings,
    } = req.body;
    
    const existing = await prisma.tenantConfiguration.findUnique({
      where: { tenantId },
    });
    
    if (!existing) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }
    
    const config = await prisma.tenantConfiguration.update({
      where: { tenantId },
      data: {
        ...(displayName && { displayName }),
        ...(theme && { theme }),
        ...(timezone && { timezone }),
        ...(currency && { currency }),
        ...(language && { language }),
        ...(dateFormat && { dateFormat }),
        ...(enabledFeatures && { enabledFeatures }),
        ...(enabledRoles && { enabledRoles }),
        ...(customSettings && { customSettings }),
      },
    });
    
    logger.info(`Updated configuration for tenant ${tenantId}`);
    
    await prisma.auditLog.create({
      data: {
        action: 'CONFIG_UPDATE',
        resource: 'TenantConfiguration',
        resourceId: config.id,
        actorType: 'PLATFORM_USER',
        actorId: req.platformUser.id,
        oldValue: existing,
        newValue: {
          displayName,
          theme,
          timezone,
          currency,
          enabledFeatures,
          enabledRoles,
        },
      },
    });
    
    res.json(config);
  } catch (error: any) {
    logger.error('Error updating configuration', { error: error.message });
    res.status(500).json({ error: 'Failed to update configuration' });
  }
};

// POST /api/config/:tenantId/sync
export const syncConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.params;
    
    // This would trigger the ConfigSyncService
    // For now, return success
    logger.info(`Syncing configuration for tenant ${tenantId}`);
    
    res.json({ message: 'Configuration sync initiated' });
  } catch (error: any) {
    logger.error('Error syncing configuration', { error: error.message });
    res.status(500).json({ error: 'Failed to sync configuration' });
  }
};

// POST /api/config/sync-all
export const syncAllConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Syncing all tenant configurations');
    
    // This would trigger ConfigSyncService.syncAllTenants()
    
    res.json({ message: 'All configurations sync initiated' });
  } catch (error: any) {
    logger.error('Error syncing all configurations', { error: error.message });
    res.status(500).json({ error: 'Failed to sync configurations' });
  }
};
