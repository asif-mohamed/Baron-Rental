import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

interface DiscoveredService {
  tenantId: string;
  type: 'BACKEND' | 'FRONTEND' | 'DATABASE';
  host: string;
  port: number;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  version?: string;
  metadata?: Record<string, any>;
}

/**
 * Tenant Discovery Service
 * Auto-discovers running Baron tenant instances on the network
 * Registers them in the platform service registry
 */
export class TenantDiscoveryService {
  private prisma: PrismaClient;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private readonly scanIntervalMs = 60000; // 1 minute

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Start discovery service
   */
  public start(): void {
    logger.info('Starting Tenant Discovery Service');
    
    // Run initial discovery
    this.discoverServices();
    
    // Schedule periodic discovery
    this.discoveryInterval = setInterval(() => {
      this.discoverServices();
    }, this.scanIntervalMs);
  }

  /**
   * Stop discovery service
   */
  public stop(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
      logger.info('Stopped Tenant Discovery Service');
    }
  }

  /**
   * Discover all services
   */
  private async discoverServices(): Promise<void> {
    try {
      logger.info('Running service discovery scan');
      
      // Get all registered tenants
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
      });
      
      for (const tenant of tenants) {
        await this.discoverTenantServices(tenant.id, tenant.slug);
      }
      
      logger.info(`Service discovery completed. Scanned ${tenants.length} tenants`);
    } catch (error: any) {
      logger.error('Error during service discovery', { error: error.message });
    }
  }

  /**
   * Discover services for a specific tenant
   */
  private async discoverTenantServices(tenantId: string, slug: string): Promise<void> {
    const discoveries: DiscoveredService[] = [];
    
    // Standard Baron ports (configurable in future)
    const backendPort = 5000;
    const frontendPort = 5173;
    
    // Check backend
    const backendStatus = await this.checkService(`http://localhost:${backendPort}/health`);
    if (backendStatus.reachable) {
      discoveries.push({
        tenantId,
        type: 'BACKEND',
        host: 'localhost',
        port: backendPort,
        status: backendStatus.healthy ? 'HEALTHY' : 'DEGRADED',
        version: backendStatus.version,
        metadata: backendStatus.metadata,
      });
    }
    
    // Check frontend
    const frontendStatus = await this.checkService(`http://localhost:${frontendPort}`);
    if (frontendStatus.reachable) {
      discoveries.push({
        tenantId,
        type: 'FRONTEND',
        host: 'localhost',
        port: frontendPort,
        status: frontendStatus.healthy ? 'HEALTHY' : 'DEGRADED',
      });
    }
    
    // Update service registry
    for (const discovery of discoveries) {
      await this.registerService(discovery);
    }
  }

  /**
   * Check if a service is reachable and healthy
   */
  private async checkService(url: string): Promise<{
    reachable: boolean;
    healthy: boolean;
    version?: string;
    metadata?: Record<string, any>;
  }> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });
      
      return {
        reachable: true,
        healthy: response.status === 200,
        version: response.data?.version,
        metadata: response.data,
      };
    } catch (error) {
      return {
        reachable: false,
        healthy: false,
      };
    }
  }

  /**
   * Register or update a service in the platform registry
   */
  private async registerService(service: DiscoveredService): Promise<void> {
    try {
      await this.prisma.serviceInstance.upsert({
        where: {
          tenantId_type_host_port: {
            tenantId: service.tenantId,
            type: service.type,
            host: service.host,
            port: service.port,
          },
        },
        create: {
          tenantId: service.tenantId,
          type: service.type,
          host: service.host,
          port: service.port,
          status: service.status,
          version: service.version,
          metadata: service.metadata || {},
          lastHealthCheck: new Date(),
        },
        update: {
          status: service.status,
          version: service.version,
          metadata: service.metadata || {},
          lastHealthCheck: new Date(),
        },
      });
      
      logger.debug(`Registered service: ${service.type} for tenant ${service.tenantId}`, {
        host: service.host,
        port: service.port,
        status: service.status,
      });
    } catch (error: any) {
      logger.error(`Failed to register service: ${service.type}`, {
        tenantId: service.tenantId,
        error: error.message,
      });
    }
  }

  /**
   * Manually trigger discovery for a specific tenant
   */
  public async discoverTenant(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }
    
    await this.discoverTenantServices(tenant.id, tenant.slug);
  }
}
