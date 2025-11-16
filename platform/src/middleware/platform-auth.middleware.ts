import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logger } from '../services/logger';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      platformUser?: any;
    }
  }
}

/**
 * Platform admin authentication middleware
 */
export const platformAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    const user = await prisma.platformUser.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or inactive user' });
      return;
    }
    
    req.platformUser = user;
    next();
  } catch (error: any) {
    logger.warn('Authentication failed', { error: error.message });
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.platformUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!allowedRoles.includes(req.platformUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
};

/**
 * API Key authentication middleware
 */
export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }
    
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { tenant: true },
    });
    
    if (!key || !key.isActive) {
      res.status(401).json({ error: 'Invalid or inactive API key' });
      return;
    }
    
    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });
    
    req.platformUser = {
      id: key.tenantId,
      type: 'tenant',
      permissions: key.permissions,
    };
    
    next();
  } catch (error: any) {
    logger.warn('API key authentication failed', { error: error.message });
    res.status(401).json({ error: 'Invalid API key' });
  }
};
