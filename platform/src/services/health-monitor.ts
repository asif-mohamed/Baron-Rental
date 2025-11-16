import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { logger } from './logger';

interface HealthCheckResult {
  serviceId: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  responseTime: number;
  error?: string;
  timestamp: Date;
}

/**
 * Health Monitor Service
 * Periodically checks health of all registered tenant services
 * Updates service status and triggers alerts on failures
 */
export class HealthMonitorService {
  private prisma: PrismaClient;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly checkIntervalMs = 30000; // 30 seconds

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Start health monitoring
   */
  public start(): void {
    logger.info('Starting Health Monitor Service');
    
    // Run initial health check
    this.runHealthChecks();
    
    // Schedule periodic checks
    this.monitorInterval = setInterval(() => {
      this.runHealthChecks();
    }, this.checkIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  public stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      logger.info('Stopped Health Monitor Service');
    }
  }

  /**
   * Run health checks for all services
   */
  private async runHealthChecks(): Promise<void> {
    try {
      const services = await this.prisma.serviceInstance.findMany({
        include: { tenant: true },
      });
      
      logger.info(`Running health checks for ${services.length} services`);
      
      const results = await Promise.allSettled(
        services.map((service) => this.checkServiceHealth(service))
      );
      
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      
      logger.info(`Health checks completed: ${succeeded} succeeded, ${failed} failed`);
    } catch (error: any) {
      logger.error('Error running health checks', { error: error.message });
    }
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(service: any): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      let healthUrl = '';
      
      switch (service.type) {
        case 'BACKEND':
          healthUrl = `http://${service.host}:${service.port}/health`;
          break;
        case 'FRONTEND':
          healthUrl = `http://${service.host}:${service.port}`;
          break;
        case 'DATABASE':
          // Database health check would be different
          return this.checkDatabaseHealth(service);
        default:
          throw new Error(`Unknown service type: ${service.type}`);
      }
      
      const response = await axios.get(healthUrl, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status code
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200;
      
      const result: HealthCheckResult = {
        serviceId: service.id,
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        responseTime,
        timestamp: new Date(),
      };
      
      await this.updateServiceHealth(result);
      
      // Check for status changes
      if (service.status !== result.status) {
        await this.handleStatusChange(service, result.status);
      }
      
      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        serviceId: service.id,
        status: 'DOWN',
        responseTime,
        error: error.message,
        timestamp: new Date(),
      };
      
      await this.updateServiceHealth(result);
      
      if (service.status !== 'DOWN') {
        await this.handleStatusChange(service, 'DOWN');
      }
      
      return result;
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(service: any): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simple connection test
      // In production, use actual database client
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        serviceId: service.id,
        status: 'HEALTHY',
        responseTime,
        timestamp: new Date(),
      };
      
      await this.updateServiceHealth(result);
      
      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        serviceId: service.id,
        status: 'DOWN',
        responseTime,
        error: error.message,
        timestamp: new Date(),
      };
      
      await this.updateServiceHealth(result);
      
      return result;
    }
  }

  /**
   * Update service health in database
   */
  private async updateServiceHealth(result: HealthCheckResult): Promise<void> {
    try {
      await this.prisma.serviceInstance.update({
        where: { id: result.serviceId },
        data: {
          status: result.status,
          lastHealthCheck: result.timestamp,
          metadata: {
            responseTime: result.responseTime,
            error: result.error,
          },
        },
      });
      
      logger.debug(`Updated health for service ${result.serviceId}`, {
        status: result.status,
        responseTime: result.responseTime,
      });
    } catch (error: any) {
      logger.error(`Failed to update health for service ${result.serviceId}`, {
        error: error.message,
      });
    }
  }

  /**
   * Handle service status change
   */
  private async handleStatusChange(
    service: any,
    newStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN'
  ): Promise<void> {
    logger.warn(`Service status changed: ${service.id}`, {
      tenant: service.tenantId,
      type: service.type,
      oldStatus: service.status,
      newStatus,
      host: service.host,
      port: service.port,
    });
    
    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'SERVICE_STATUS_CHANGE',
        resource: 'ServiceInstance',
        resourceId: service.id,
        actorType: 'SYSTEM',
        actorId: 'health-monitor',
        oldValue: { status: service.status },
        newValue: { status: newStatus },
        metadata: {
          tenantId: service.tenantId,
          serviceType: service.type,
          host: service.host,
          port: service.port,
        },
      },
    });
    
    // Create notification for tenant
    if (newStatus === 'DOWN') {
      await this.createDowntimeAlert(service, newStatus);
    }
  }

  /**
   * Create downtime alert
   */
  private async createDowntimeAlert(service: any, status: string): Promise<void> {
    try {
      // In a real system, send to notification service
      logger.error(`ALERT: Service down`, {
        serviceId: service.id,
        tenant: service.tenant.name,
        type: service.type,
        host: service.host,
        port: service.port,
        status,
      });
      
      // Could integrate with:
      // - Email notifications
      // - Slack/Discord webhooks
      // - PagerDuty
      // - SMS alerts
    } catch (error: any) {
      logger.error('Failed to create downtime alert', { error: error.message });
    }
  }

  /**
   * Get health summary for all tenants
   */
  public async getHealthSummary(): Promise<any> {
    const services = await this.prisma.serviceInstance.findMany({
      include: { tenant: true },
    });
    
    const summary = {
      total: services.length,
      healthy: services.filter((s) => s.status === 'HEALTHY').length,
      degraded: services.filter((s) => s.status === 'DEGRADED').length,
      down: services.filter((s) => s.status === 'DOWN').length,
      byTenant: {} as Record<string, any>,
    };
    
    services.forEach((service) => {
      const tenantId = service.tenantId;
      if (!summary.byTenant[tenantId]) {
        summary.byTenant[tenantId] = {
          name: service.tenant.name,
          services: {},
        };
      }
      summary.byTenant[tenantId].services[service.type] = {
        status: service.status,
        lastCheck: service.lastHealthCheck,
      };
    });
    
    return summary;
  }

  /**
   * Manually trigger health check for a specific service
   */
  public async checkService(serviceId: string): Promise<HealthCheckResult> {
    const service = await this.prisma.serviceInstance.findUnique({
      where: { id: serviceId },
      include: { tenant: true },
    });
    
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }
    
    return this.checkServiceHealth(service);
  }
}
