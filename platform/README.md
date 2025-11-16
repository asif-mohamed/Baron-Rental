# Baron Platform - Multi-Tenant SaaS Control Plane

The Baron Platform is the control plane for managing multiple Baron tenant instances. It provides centralized configuration management, service discovery, health monitoring, and SSH access to the platform infrastructure.

## Architecture Overview

The platform operates independently from tenant instances and provides:

- **HTTP API** (Port 6000): RESTful API for platform management
- **SSH Server** (Port 2222): Read-only file system access
- **WebSocket Server** (Port 6001): Real-time tenant communication
- **Service Discovery**: Auto-detect running tenant instances
- **Configuration Sync**: Push config changes to tenants
- **Health Monitoring**: Track tenant service health
- **Audit Logging**: Platform-level activity tracking

## Directory Structure

```
platform/
├── src/
│   ├── controllers/       # API request handlers
│   ├── routes/           # Express route definitions
│   ├── services/         # Core platform services
│   ├── middleware/       # Auth, logging, error handling
│   ├── models/          # (Optional) Data models
│   └── index.ts         # Main server entry point
├── prisma/
│   └── schema.prisma    # Platform database schema
├── config/              # Configuration files
├── docs/                # Documentation
├── logs/                # Application logs
└── package.json

```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (for platform metadata database)
- Running Baron tenant instance(s) to manage

## Installation

### 1. Install Dependencies

```powershell
cd platform
npm install
```

### 2. Configure Environment

Copy the example environment file:

```powershell
copy .env.example .env
```

Edit `.env` with your settings:

```env
# Platform Configuration
PLATFORM_PORT=6000
SSH_PORT=2222
WS_PORT=6001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/baron_platform"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PLATFORM_SECRET=shared-secret-for-tenant-communication

# Admin SSH Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!@#Platform

# Environment
NODE_ENV=development
LOG_LEVEL=info
PLATFORM_VERSION=1.0.0
```

### 3. Initialize Database

Generate Prisma client:

```powershell
npm run prisma:generate
```

Run database migrations:

```powershell
npm run prisma:migrate
```

Create initial platform admin user:

```powershell
npx ts-node src/seed.ts
```

### 4. Start Platform

**Development mode** (with auto-reload):

```powershell
npm run dev
```

**Production mode**:

```powershell
npm run build
npm start
```

## Platform Access

### HTTP API

The platform HTTP API runs on port 6000:

- **Health Check**: http://localhost:6000/health
- **Platform Info**: http://localhost:6000/info
- **API Endpoints**: http://localhost:6000/api/*

### SSH Access

Connect to the platform file system via SSH:

```bash
ssh admin@localhost -p 2222
```

Password: `Admin123!@#Platform` (from .env)

**SSH Commands**:
- `ls` - List files
- `cd <dir>` - Change directory
- `cat <file>` - Read file contents
- `pwd` - Print working directory
- `tree [dir]` - Show directory tree
- `help` - Show available commands
- `exit` - Disconnect

**Note**: SSH access is READ-ONLY. No write operations are permitted.

### WebSocket Connection

Tenants connect via WebSocket for real-time config updates:

```
ws://localhost:6001/ws/tenant/{tenantId}
```

## API Reference

### Authentication

All API endpoints (except `/health` and `/info`) require JWT authentication:

```bash
# Login to get token
curl -X POST http://localhost:6000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!@#Platform"}'

# Use token in requests
curl http://localhost:6000/api/tenants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Tenants API

- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant details
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant (soft delete)

### Configuration API

- `GET /api/config/:tenantId` - Get tenant configuration
- `PUT /api/config/:tenantId` - Update tenant configuration
- `POST /api/config/:tenantId/sync` - Sync config to tenant
- `POST /api/config/sync-all` - Sync all tenants

### Services API

- `GET /api/services` - List all services
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service
- `POST /api/services/:id/health` - Check service health

### Platform API

- `GET /api/platform/info` - Platform information
- `GET /api/platform/stats` - Platform statistics
- `GET /api/platform/connected` - Connected tenants

### Audit API

- `GET /api/audit` - List audit logs (filterable)
- `GET /api/audit/:id` - Get specific audit log

## Platform Services

### Service Discovery

Automatically discovers running tenant instances:

- Scans every 60 seconds
- Checks backend (port 5000) and frontend (port 5173)
- Updates service registry with health status

### Configuration Sync

Pushes configuration changes to tenants:

- Real-time via WebSocket (preferred)
- HTTP fallback if WebSocket unavailable
- Broadcast updates to all connected tenants

### Health Monitor

Monitors tenant service health:

- Checks every 30 seconds
- Updates service status (HEALTHY, DEGRADED, DOWN)
- Creates alerts on status changes
- Logs all health transitions

## Database Schema

The platform uses a separate database for metadata:

**Key Models**:
- `Tenant` - Multi-tenant metadata
- `TenantConfiguration` - Business flavor settings
- `PlatformUser` - Platform administrators
- `TenantUser` - References to tenant DB users
- `ApiKey` - Programmatic access tokens
- `AuditLog` - Activity tracking
- `ServiceInstance` - Service registry
- `ConfigTemplate` - Preset configurations

## Platform Roles

- **SUPER_ADMIN**: Full platform access, tenant lifecycle management
- **ADMIN**: Tenant configuration, user management
- **OPERATOR**: Monitor services, view logs
- **VIEWER**: Read-only access to platform data

## Security

### SSH Security

- Read-only file system access
- Password-based authentication
- Path traversal protection
- No command execution beyond whitelisted commands

### API Security

- JWT-based authentication
- Role-based authorization
- API key support for programmatic access
- Audit logging of all actions

### Database Security

- Schema-per-tenant isolation
- Encrypted connection strings
- Platform metadata in separate database

## Monitoring & Logs

Logs are written to:

- `logs/error.log` - Errors only
- `logs/combined.log` - All logs
- Console (development mode)

View live logs:

```powershell
Get-Content logs\combined.log -Wait -Tail 50
```

## Troubleshooting

### Platform won't start

Check:
1. Database connection: `DATABASE_URL` in `.env`
2. Port availability: 6000, 2222, 6001
3. Dependencies installed: `npm install`
4. Prisma generated: `npm run prisma:generate`

### SSH connection refused

- Verify `SSH_PORT` in `.env` (default: 2222)
- Check credentials: `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Ensure platform is running: `npm run dev`

### Tenant not discovered

- Verify tenant backend is running on port 5000
- Check `/health` endpoint returns 200
- Wait for next discovery cycle (60 seconds)
- Check logs: `logs/combined.log`

### Configuration not syncing

- Verify tenant WebSocket connection
- Check `PLATFORM_SECRET` matches between platform and tenant
- Try manual sync: `POST /api/config/:tenantId/sync`

## Development

### Running Tests

```powershell
npm test
```

### Database Migrations

Create new migration:

```powershell
npx prisma migrate dev --name migration_name
```

Reset database:

```powershell
npx prisma migrate reset
```

### Code Structure

- **Controllers**: Business logic for API endpoints
- **Routes**: Express route definitions
- **Services**: Background services (SSH, discovery, sync, health)
- **Middleware**: Auth, logging, error handling
- **Prisma**: Database schema and client

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Generate strong `JWT_SECRET` and `PLATFORM_SECRET`
3. Use proper SSL/TLS for HTTPS
4. Configure firewall rules for ports 6000, 2222, 6001
5. Set up database backups
6. Configure log rotation
7. Use process manager (PM2, systemd)

Example with PM2:

```bash
npm run build
pm2 start dist/index.js --name baron-platform
```

## Contributing

The platform is part of the Baron ecosystem. For questions or contributions, contact the development team.

## License

Proprietary - Baron Platform
