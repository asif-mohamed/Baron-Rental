import { PrismaClient } from '@prisma/client';
import { WebSocket, WebSocketServer } from 'ws';
import { logger } from './logger';
import axios from 'axios';

interface ConfigUpdate {
  tenantId: string;
  config: Record<string, any>;
  timestamp: Date;
}

/**
 * Configuration Sync Service
 * Pushes configuration changes from platform to tenant instances in real-time
 * Uses WebSocket for push notifications and HTTP for config delivery
 */
export class ConfigSyncService {
  private prisma: PrismaClient;
  private wss: WebSocketServer;
  private tenantConnections: Map<string, WebSocket[]> = new Map();

  constructor(prisma: PrismaClient, wss: WebSocketServer) {
    this.prisma = prisma;
    this.wss = wss;
    this.setupWebSocketHandlers();
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      logger.info('WebSocket: Client connected', { url: req.url });
      
      // Extract tenant ID from connection URL or auth
      const tenantId = this.extractTenantId(req.url || '');
      
      if (!tenantId) {
        ws.close(1008, 'Tenant ID required');
        return;
      }
      
      // Add to tenant connections
      if (!this.tenantConnections.has(tenantId)) {
        this.tenantConnections.set(tenantId, []);
      }
      this.tenantConnections.get(tenantId)!.push(ws);
      
      logger.info(`Tenant ${tenantId} connected via WebSocket`);
      
      ws.on('message', (message: Buffer) => {
        this.handleMessage(tenantId, message.toString());
      });
      
      ws.on('close', () => {
        this.removeConnection(tenantId, ws);
        logger.info(`Tenant ${tenantId} disconnected`);
      });
      
      ws.on('error', (error) => {
        logger.error(`WebSocket error for tenant ${tenantId}`, { error });
        this.removeConnection(tenantId, ws);
      });
      
      // Send initial config
      this.sendConfigToTenant(tenantId, ws);
    });
  }

  /**
   * Extract tenant ID from URL
   */
  private extractTenantId(url: string): string | null {
    const match = url.match(/\/ws\/tenant\/([^/?]+)/);
    return match ? match[1] : null;
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(tenantId: string, message: string): Promise<void> {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'config_request':
          await this.sendCurrentConfig(tenantId);
          break;
        
        case 'heartbeat':
          // Tenant is alive
          await this.updateTenantHeartbeat(tenantId);
          break;
        
        default:
          logger.warn(`Unknown message type from tenant ${tenantId}`, { type: data.type });
      }
    } catch (error: any) {
      logger.error(`Error handling message from tenant ${tenantId}`, { error: error.message });
    }
  }

  /**
   * Remove WebSocket connection
   */
  private removeConnection(tenantId: string, ws: WebSocket): void {
    const connections = this.tenantConnections.get(tenantId);
    if (connections) {
      const index = connections.indexOf(ws);
      if (index > -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        this.tenantConnections.delete(tenantId);
      }
    }
  }

  /**
   * Send current configuration to a specific tenant connection
   */
  private async sendConfigToTenant(tenantId: string, ws: WebSocket): Promise<void> {
    try {
      const config = await this.getLatestConfig(tenantId);
      
      ws.send(JSON.stringify({
        type: 'config_update',
        config,
        timestamp: new Date(),
      }));
      
      logger.info(`Sent initial config to tenant ${tenantId}`);
    } catch (error: any) {
      logger.error(`Failed to send config to tenant ${tenantId}`, { error: error.message });
    }
  }

  /**
   * Send current configuration to all connections of a tenant
   */
  private async sendCurrentConfig(tenantId: string): Promise<void> {
    const connections = this.tenantConnections.get(tenantId);
    if (!connections || connections.length === 0) {
      return;
    }
    
    const config = await this.getLatestConfig(tenantId);
    
    const message = JSON.stringify({
      type: 'config_update',
      config,
      timestamp: new Date(),
    });
    
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Get latest configuration for a tenant
   */
  private async getLatestConfig(tenantId: string): Promise<Record<string, any>> {
    const tenantConfig = await this.prisma.tenantConfiguration.findUnique({
      where: { tenantId },
    });
    
    if (!tenantConfig) {
      return {};
    }
    
    return {
      displayName: tenantConfig.displayName,
      theme: tenantConfig.theme,
      timezone: tenantConfig.timezone,
      currency: tenantConfig.currency,
      language: tenantConfig.language,
      dateFormat: tenantConfig.dateFormat,
      enabledFeatures: tenantConfig.enabledFeatures,
      enabledRoles: tenantConfig.enabledRoles,
      customSettings: tenantConfig.customSettings,
    };
  }

  /**
   * Update tenant heartbeat
   */
  private async updateTenantHeartbeat(tenantId: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * Sync configuration to a tenant (push via WebSocket + HTTP fallback)
   */
  public async syncConfig(tenantId: string): Promise<void> {
    logger.info(`Syncing configuration to tenant ${tenantId}`);
    
    // Try WebSocket first
    const connections = this.tenantConnections.get(tenantId);
    if (connections && connections.length > 0) {
      await this.sendCurrentConfig(tenantId);
      logger.info(`Config synced to tenant ${tenantId} via WebSocket`);
      return;
    }
    
    // Fallback to HTTP
    await this.syncViaHttp(tenantId);
  }

  /**
   * Sync configuration via HTTP (fallback method)
   */
  private async syncViaHttp(tenantId: string): Promise<void> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { services: true },
      });
      
      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }
      
      const backendService = tenant.services.find((s) => s.type === 'BACKEND');
      if (!backendService) {
        throw new Error(`Backend service not found for tenant ${tenantId}`);
      }
      
      const config = await this.getLatestConfig(tenantId);
      const url = `http://${backendService.host}:${backendService.port}/api/platform/config`;
      
      await axios.post(url, { config }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-Platform-Secret': process.env.PLATFORM_SECRET || '',
        },
      });
      
      logger.info(`Config synced to tenant ${tenantId} via HTTP`);
    } catch (error: any) {
      logger.error(`Failed to sync config via HTTP for tenant ${tenantId}`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Sync configuration to all active tenants
   */
  public async syncAllTenants(): Promise<void> {
    logger.info('Syncing configuration to all tenants');
    
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
    });
    
    const results = await Promise.allSettled(
      tenants.map((tenant) => this.syncConfig(tenant.id))
    );
    
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    
    logger.info(`Config sync completed: ${succeeded} succeeded, ${failed} failed`);
  }

  /**
   * Broadcast a message to all connected tenants
   */
  public broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.tenantConnections.forEach((connections, tenantId) => {
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    });
    
    logger.info(`Broadcast message to all tenants`);
  }
}
