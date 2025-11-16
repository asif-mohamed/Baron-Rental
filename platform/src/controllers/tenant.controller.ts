import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

// GET /api/tenants
export const getTenants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
        { domain: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        configuration: true,
        services: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(tenants);
  } catch (error: any) {
    logger.error('Error fetching tenants', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

// GET /api/tenants/:id
export const getTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        configuration: true,
        services: true,
        users: true,
        apiKeys: true,
      },
    });
    
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    res.json(tenant);
  } catch (error: any) {
    logger.error('Error fetching tenant', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
};

// POST /api/tenants
export const createTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, domain, databaseUrl, plan, resourceLimits } = req.body;
    
    // Check if slug is unique
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({ error: 'Tenant slug already exists' });
      return;
    }
    
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        domain,
        databaseUrl,
        plan: plan || 'FREE',
        status: 'ACTIVE',
        resourceLimits: resourceLimits || {},
        configuration: {
          create: {
            displayName: name,
            theme: {},
            timezone: 'UTC',
            currency: 'USD',
            language: 'en',
            enabledFeatures: [],
            enabledRoles: ['ACCOUNTANT', 'MANAGER', 'MECHANIC', 'DRIVER'],
            customSettings: {},
          },
        },
      },
      include: { configuration: true },
    });
    
    logger.info(`Created tenant: ${tenant.name}`, { tenantId: tenant.id });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'TENANT_CREATE',
        resource: 'Tenant',
        resourceId: tenant.id,
        actorType: 'PLATFORM_USER',
        actorId: req.platformUser.id,
        newValue: { name, slug, domain },
      },
    });
    
    res.status(201).json(tenant);
  } catch (error: any) {
    logger.error('Error creating tenant', { error: error.message });
    res.status(500).json({ error: 'Failed to create tenant' });
  }
};

// PUT /api/tenants/:id
export const updateTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, domain, status, plan, resourceLimits } = req.body;
    
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(domain && { domain }),
        ...(status && { status }),
        ...(plan && { plan }),
        ...(resourceLimits && { resourceLimits }),
      },
      include: { configuration: true },
    });
    
    logger.info(`Updated tenant: ${tenant.name}`, { tenantId: tenant.id });
    
    await prisma.auditLog.create({
      data: {
        action: 'TENANT_UPDATE',
        resource: 'Tenant',
        resourceId: tenant.id,
        actorType: 'PLATFORM_USER',
        actorId: req.platformUser.id,
        oldValue: existing,
        newValue: { name, domain, status, plan },
      },
    });
    
    res.json(tenant);
  } catch (error: any) {
    logger.error('Error updating tenant', { error: error.message });
    res.status(500).json({ error: 'Failed to update tenant' });
  }
};

// DELETE /api/tenants/:id
export const deleteTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    // Soft delete - mark as deleted
    await prisma.tenant.update({
      where: { id },
      data: { status: 'DELETED' },
    });
    
    logger.warn(`Deleted tenant: ${tenant.name}`, { tenantId: tenant.id });
    
    await prisma.auditLog.create({
      data: {
        action: 'TENANT_DELETE',
        resource: 'Tenant',
        resourceId: tenant.id,
        actorType: 'PLATFORM_USER',
        actorId: req.platformUser.id,
        oldValue: tenant,
      },
    });
    
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting tenant', { error: error.message });
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
};
