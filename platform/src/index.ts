import express, { Application } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config();

// Validate environment loaded successfully
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found in environment variables!');
  console.error('Please create a .env file based on .env.example');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log(`   Database: ${process.env.DATABASE_URL?.substring(0, 30)}...`);

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Import routes
import tenantRoutes from './routes/tenant.routes';
import configRoutes from './routes/config.routes';
import platformRoutes from './routes/platform.routes';
import serviceRoutes from './routes/service.routes';
import auditRoutes from './routes/audit.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { platformAuth } from './middleware/platform-auth.middleware';

// Import services
import { SSHServer } from './services/ssh-server';
import { TenantDiscoveryService } from './services/tenant-discovery';
import { ConfigSyncService } from './services/config-sync';
import { HealthMonitorService } from './services/health-monitor';
import { logger } from './services/logger';

// ============================================================================
// BARON PLATFORM - Multi-Tenant SaaS Control Plane
// ============================================================================
// Platform Owner: Asif (Original Developer)
// Business License: Baron Car Rental Management System
// 
// This is the ASIF platform layer that manages all Baron tenant instances
// The platform can be forked and customized by admin users who have
// read-only SSH access to the source code.
//
// Features:
// - Tenant lifecycle management (create, configure, delete)
// - Configuration distribution to tenant instances
// - Service discovery and health monitoring
// - SSH access to platform file system (read-only for admin)
// - Real-time communication via WebSockets
// - Audit logging and security
// ============================================================================

const app: Application = express();
const httpServer = createServer(app);

// Platform configuration
const PLATFORM_PORT = process.env.PLATFORM_PORT || 6000;
const PLATFORM_HOST = process.env.PLATFORM_HOST || 'localhost';
const SSH_PORT = process.env.SSH_PORT || 2222;
const WS_PORT = process.env.WS_PORT || 6001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
  origin: '*', // Configure based on tenant domains in production
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'asif-platform',
    platform: 'Asif Platform',
    businessLicense: 'Baron Car Rental',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/info', (req, res) => {
  res.json({
    name: 'Asif Platform - Control Plane',
    platformOwner: 'Asif',
    businessLicense: 'Baron Car Rental Management System',
    version: '1.0.0',
    description: 'Multi-tenant SaaS management platform. Licensed for Baron Car Rental operations. Platform source code accessible via SSH for forking and local development.',
    features: {
      tenantManagement: true,
      configurationSync: true,
      serviceDiscovery: true,
      sshAccess: process.env.ENABLE_SSH_SERVER !== 'false',
      webSocket: process.env.ENABLE_WS_SERVER !== 'false',
      auditLogging: true,
      sshSourceCodeAccess: 'Read-only access for admins to fork platform source',
    },
    endpoints: {
      platform: `http://${PLATFORM_HOST}:${PLATFORM_PORT}`,
      ssh: process.env.ENABLE_SSH_SERVER !== 'false' ? `ssh://admin@${PLATFORM_HOST}:${SSH_PORT}` : 'disabled',
      websocket: process.env.ENABLE_WS_SERVER !== 'false' ? `ws://${PLATFORM_HOST}:${WS_PORT}` : 'disabled',
    },
    branding: {
      platform: 'Asif Platform (Original)',
      business: 'Baron Car Rental (Licensed Instance)',
      note: 'Admin users can SSH into platform to view source code for forking',
    },
  });
});

// ============================================================================
// AUTHENTICATED ROUTES (Require platform admin credentials)
// ============================================================================

app.use('/api/platform', platformAuth, platformRoutes);
app.use('/api/tenants', platformAuth, tenantRoutes);
app.use('/api/config', platformAuth, configRoutes);
app.use('/api/services', platformAuth, serviceRoutes);
app.use('/api/audit', platformAuth, auditRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(errorHandler);

// ============================================================================
// WEBSOCKET SERVER (Real-time tenant communication)
// ============================================================================

let wss: WebSocketServer | null = null;

if (process.env.ENABLE_WS_SERVER !== 'false') {
  wss = new WebSocketServer({ port: Number(WS_PORT) });
  
  wss.on('connection', (ws, req) => {
    logger.info(`WebSocket connection established from ${req.socket.remoteAddress}`);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        logger.debug('WebSocket message received', { data });
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          case 'subscribe':
            // Subscribe to tenant updates
            logger.info(`Client subscribed to tenant: ${data.tenantId}`);
            ws.send(JSON.stringify({ type: 'subscribed', tenantId: data.tenantId }));
            break;
          default:
            logger.warn(`Unknown WebSocket message type: ${data.type}`);
        }
      } catch (error) {
        logger.error('WebSocket message parsing error', { error });
      }
    });
    
    ws.on('close', () => {
      logger.info('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      logger.error('WebSocket error', { error });
    });
  });
  
  logger.info(`WebSocket server started on port ${WS_PORT}`);
}

// ============================================================================
// SSH SERVER (Read-only file system access for platform admin)
// Admins can SSH to view source code, fork the platform, and run locally
// ============================================================================

let sshServer: SSHServer | null = null;

if (process.env.ENABLE_SSH_SERVER !== 'false') {
  const platformRoot = path.resolve(__dirname, '..');
  logger.info(`SSH Server will expose platform source at: ${platformRoot}`);
  
  sshServer = new SSHServer({
    port: Number(SSH_PORT),
    host: process.env.SSH_HOST || '0.0.0.0',
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!@#Platform',
    rootPath: platformRoot, // Platform root directory for source code access
    readOnly: true, // Read-only access for security (fork to modify)
  });
  
  sshServer.start();
  logger.info('SSH access enabled for admin to view/fork platform source code');
}

// ============================================================================
// BACKGROUND SERVICES
// ============================================================================

// Tenant discovery service (auto-discover running tenant instances)
let tenantDiscovery: TenantDiscoveryService | null = null;
if (process.env.ENABLE_AUTO_DISCOVERY !== 'false') {
  logger.info('Initializing Tenant Discovery Service...');
  tenantDiscovery = new TenantDiscoveryService(prisma);
  tenantDiscovery.start();
}

// Configuration sync service (push config changes to tenants)
logger.info('Initializing Configuration Sync Service...');
const configSync = new ConfigSyncService(prisma, wss!);
// Note: ConfigSync doesn't have explicit start/stop in current implementation

// Health monitor service (check tenant service health)
logger.info('Initializing Health Monitor Service...');
const healthMonitor = new HealthMonitorService(prisma);
healthMonitor.start();

// ============================================================================
// START PLATFORM SERVER
// ============================================================================

httpServer.listen(PLATFORM_PORT, () => {
  logger.info('='.repeat(80));
  logger.info('🚀 ASIF PLATFORM - Multi-Tenant SaaS Control Plane');
  logger.info('   Business License: Baron Car Rental Management System');
  logger.info('='.repeat(80));
  logger.info(`Platform API: http://${PLATFORM_HOST}:${PLATFORM_PORT}`);
  logger.info(`Health Check: http://${PLATFORM_HOST}:${PLATFORM_PORT}/health`);
  logger.info(`Platform Info: http://${PLATFORM_HOST}:${PLATFORM_PORT}/info`);
  logger.info('');
  
  if (process.env.ENABLE_SSH_SERVER !== 'false') {
    logger.info(`SSH Server: ssh://${process.env.ADMIN_USERNAME || 'admin'}@${PLATFORM_HOST}:${SSH_PORT}`);
    logger.info(`  Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
    logger.info(`  Access: Read-only platform source code`);
    logger.info(`  Purpose: Fork platform for local development`);
    logger.info('');
  }
  
  if (process.env.ENABLE_WS_SERVER !== 'false') {
    logger.info(`WebSocket: ws://${PLATFORM_HOST}:${WS_PORT}`);
    logger.info('');
  }
  
  logger.info('='.repeat(80));
  logger.info('Platform Services Initialized:');
  logger.info(`  ✓ Tenant Management API`);
  logger.info(`  ✓ Configuration Sync Service`);
  logger.info(`  ✓ Service Discovery: ${process.env.ENABLE_AUTO_DISCOVERY !== 'false' ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`  ✓ Health Monitoring Service`);
  logger.info(`  ✓ Audit Logging System`);
  logger.info(`  ✓ JWT Authentication`);
  logger.info(`  ✓ Role-Based Authorization`);
  logger.info('='.repeat(80));
  logger.info('Platform Owner: Asif | Business Instance: Baron Car Rental');
  logger.info('Admin users can SSH to view/fork platform source code');
  logger.info('='.repeat(80));
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  // Stop background services
  if (tenantDiscovery) {
    logger.info('Stopping Tenant Discovery Service...');
    tenantDiscovery.stop();
  }
  
  if (healthMonitor) {
    logger.info('Stopping Health Monitor Service...');
    healthMonitor.stop();
  }
  
  // Close SSH server
  if (sshServer) {
    logger.info('Stopping SSH Server...');
    sshServer.stop();
  }
  
  // Close WebSocket server
  if (wss) {
    wss.close(() => {
      logger.info('WebSocket server closed');
    });
  }
  
  // Disconnect Prisma
  await prisma.$disconnect();
  logger.info('Database connection closed');
  
  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
    logger.info('Platform shutdown complete');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.emit('SIGTERM');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

export { app, httpServer, wss };
