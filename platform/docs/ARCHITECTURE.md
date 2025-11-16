# Baron Platform Architecture

## Overview

The Baron Platform is a **multi-tenant SaaS control plane** that manages multiple Baron car rental tenant instances. It operates independently from tenant services and provides centralized management, monitoring, and SSH access.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Baron Platform                          │
│                    (Control Plane)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  HTTP API    │  │  SSH Server  │  │  WebSocket   │     │
│  │  Port 6000   │  │  Port 2222   │  │  Port 6001   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│  ┌──────┴─────────────────┴─────────────────┴───────┐     │
│  │           Express.js Application                 │     │
│  │  ┌─────────┐  ┌─────────┐  ┌────────────┐       │     │
│  │  │ Routes  │  │ Control │  │ Middleware │       │     │
│  │  └─────────┘  │  -lers  │  └────────────┘       │     │
│  │               └─────────┘                        │     │
│  └───────────────────┬──────────────────────────────┘     │
│                      │                                     │
│  ┌───────────────────┴──────────────────────────────┐     │
│  │          Background Services                     │     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │     │
│  │  │  Tenant    │  │  Config    │  │  Health    │ │     │
│  │  │ Discovery  │  │   Sync     │  │  Monitor   │ │     │
│  │  └────────────┘  └────────────┘  └────────────┘ │     │
│  └──────────────────────────────────────────────────┘     │
│                      │                                     │
│  ┌───────────────────┴──────────────────────────────┐     │
│  │        Platform Metadata Database                │     │
│  │  (PostgreSQL - schema: baron_platform)           │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Manages & Monitors
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   Tenant Instances                          │
│           (Multiple Baron deployments)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   Tenant 1       │  │   Tenant 2       │    ...        │
│  │                  │  │                  │               │
│  │  Backend:5000    │  │  Backend:5000    │               │
│  │  Frontend:5173   │  │  Frontend:5173   │               │
│  │  DB: tenant_1    │  │  DB: tenant_2    │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. HTTP API Server (Port 6000)

RESTful API for platform management operations.

**Endpoints**:
- `/api/tenants` - Tenant lifecycle management
- `/api/config` - Configuration management
- `/api/services` - Service registry
- `/api/platform` - Platform info & stats
- `/api/audit` - Audit log queries
- `/health` - Health check (public)
- `/info` - Platform info (public)

**Features**:
- JWT-based authentication
- Role-based authorization (SUPER_ADMIN, ADMIN, OPERATOR, VIEWER)
- Request logging
- Error handling
- CORS support

### 2. SSH Server (Port 2222)

Read-only SSH shell access to platform file system.

**Features**:
- Password-based authentication (admin credentials)
- Interactive shell with custom commands
- Path traversal protection
- Read-only file system access
- File size limits (1MB max for `cat`)

**Commands**:
- `ls [-a] [-l]` - List files
- `cd <dir>` - Change directory
- `cat <file>` - Read file contents
- `pwd` - Print working directory
- `tree [dir]` - Show directory tree (3 levels)
- `help` - Show available commands
- `exit` - Disconnect

**Security**:
- Cannot navigate above platform root
- No write operations allowed
- No arbitrary command execution
- Hidden files excluded by default

### 3. WebSocket Server (Port 6001)

Real-time communication with tenant instances.

**Features**:
- Tenant connection management
- Real-time configuration push
- Heartbeat monitoring
- Broadcast messaging

**Message Types**:
- `config_update` - Push configuration changes
- `config_request` - Request latest config
- `heartbeat` - Keep-alive ping
- `broadcast` - Platform-wide message

### 4. Background Services

#### Tenant Discovery Service

Auto-discovers running Baron tenant instances.

- **Scan Interval**: 60 seconds
- **Discovery Method**: HTTP health check
- **Ports Checked**: 5000 (backend), 5173 (frontend)
- **Updates**: Service registry with host, port, status

**Process**:
1. Query all active tenants from database
2. For each tenant, check backend health endpoint
3. For each tenant, check frontend availability
4. Update service registry with results
5. Log discovery summary

#### Configuration Sync Service

Pushes configuration changes to tenant instances.

- **Method 1**: WebSocket push (preferred, real-time)
- **Method 2**: HTTP POST fallback (if WebSocket unavailable)
- **Trigger**: Manual sync or configuration update
- **Authentication**: Platform secret header

**Sync Process**:
1. Fetch latest configuration from database
2. Check for active WebSocket connections
3. If connected, push via WebSocket
4. If not connected, fallback to HTTP POST
5. Log sync result

#### Health Monitor Service

Monitors health of all registered services.

- **Check Interval**: 30 seconds
- **Metrics**: Response time, HTTP status, availability
- **Status Levels**:
  - `HEALTHY` - HTTP 200, responding normally
  - `DEGRADED` - Non-200 status, slow response
  - `DOWN` - Unreachable, timeout, error
- **Actions**: Status updates, alerts, audit logs

**Process**:
1. Fetch all services from registry
2. For each service, send health check request
3. Measure response time and status
4. Update service status in database
5. If status changed, create audit log and alert
6. Log summary

## Database Schema

### Platform Metadata Database

Separate PostgreSQL database for platform control plane.

**Key Models**:

1. **Tenant** - Multi-tenant metadata
   - `id`, `name`, `slug`, `domain`
   - `databaseUrl` (tenant DB connection string)
   - `status` (ACTIVE, SUSPENDED, DELETED)
   - `plan` (FREE, BASIC, PRO, ENTERPRISE)
   - `resourceLimits` (JSON)
   - `billingInfo` (JSON)

2. **TenantConfiguration** - Business flavor settings
   - `tenantId` (foreign key)
   - `displayName`, `theme`, `timezone`, `currency`
   - `enabledFeatures` (array)
   - `enabledRoles` (array)
   - `customSettings` (JSON)

3. **PlatformUser** - Platform administrators
   - `id`, `username`, `email`, `passwordHash`
   - `role` (SUPER_ADMIN, ADMIN, OPERATOR, VIEWER)
   - `isActive`, `lastLoginAt`

4. **TenantUser** - References to tenant DB users
   - `id`, `tenantId`, `userId` (in tenant DB)
   - `username`, `email`, `role`

5. **ApiKey** - Programmatic access tokens
   - `id`, `tenantId`, `key`, `name`
   - `permissions` (array)
   - `isActive`, `expiresAt`, `lastUsedAt`

6. **AuditLog** - Activity tracking
   - `id`, `action`, `resource`, `resourceId`
   - `actorType`, `actorId`, `ipAddress`
   - `oldValue`, `newValue`, `metadata`

7. **ServiceInstance** - Service registry
   - `id`, `tenantId`, `type` (BACKEND, FRONTEND, DATABASE)
   - `host`, `port`, `status`, `version`
   - `metadata`, `lastHealthCheck`

8. **ConfigTemplate** - Preset configurations
   - `id`, `name`, `description`, `category`
   - `template` (JSON configuration)

## Data Flow

### 1. Tenant Discovery Flow

```
Platform Discovery Service (every 60s)
    ↓
Query Active Tenants from DB
    ↓
For Each Tenant:
    ├── Check Backend Health (http://localhost:5000/health)
    ├── Check Frontend Availability (http://localhost:5173)
    └── Update Service Registry
    ↓
Log Discovery Summary
```

### 2. Configuration Sync Flow

```
Admin Updates Config via Platform API
    ↓
Platform Saves Config to Database
    ↓
Platform Triggers Config Sync
    ↓
Check WebSocket Connection?
    ├── Yes → Push via WebSocket
    │         (Real-time, bidirectional)
    └── No → HTTP POST to Tenant Backend
              (Fallback method)
    ↓
Tenant Receives Config
    ↓
Tenant Updates Local State
    ↓
Tenant Confirms Receipt
```

### 3. Health Monitoring Flow

```
Health Monitor (every 30s)
    ↓
Query All Services from Registry
    ↓
For Each Service:
    ├── Send HTTP Health Check
    ├── Measure Response Time
    ├── Evaluate Status (HEALTHY/DEGRADED/DOWN)
    └── Compare with Previous Status
    ↓
If Status Changed:
    ├── Update Service Registry
    ├── Create Audit Log
    ├── Send Alert (if DOWN)
    └── Log Status Change
    ↓
Log Health Summary
```

## Authentication & Authorization

### Platform Admin Authentication

**JWT-based authentication** for platform API access.

**Login Flow**:
1. Client sends username/password to `/api/auth/login`
2. Platform validates credentials against PlatformUser table
3. Platform generates JWT token with user ID, role
4. Client includes token in `Authorization: Bearer <token>` header

**Token Payload**:
```json
{
  "userId": "uuid",
  "username": "admin",
  "role": "SUPER_ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role-Based Authorization

**Roles** (in order of privilege):

1. **SUPER_ADMIN**:
   - Full platform access
   - Tenant lifecycle (create, delete)
   - Platform user management
   - All configuration changes

2. **ADMIN**:
   - Tenant configuration
   - User management
   - Service monitoring
   - Audit log access

3. **OPERATOR**:
   - View services
   - View audit logs
   - Trigger health checks
   - Read-only configuration

4. **VIEWER**:
   - Read-only access
   - View platform stats
   - View tenant list
   - View service status

### API Key Authentication

**Alternative authentication** for programmatic access.

**Usage**:
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:6000/api/tenants
```

**Features**:
- Per-tenant API keys
- Scoped permissions
- Expiration dates
- Usage tracking (lastUsedAt)
- Revocable

## Multi-Tenancy Architecture

### Schema-Per-Tenant Isolation

Each Baron tenant has its **own PostgreSQL database schema**:

```
PostgreSQL Server
├── baron_platform (platform metadata)
├── baron_tenant_1 (tenant 1 data)
├── baron_tenant_2 (tenant 2 data)
└── ...
```

**Benefits**:
- Strong data isolation
- Independent backups
- Tenant-specific migrations
- Resource limits per tenant

### Platform ↔ Tenant Communication

**Tenant Registration**:
1. Platform creates tenant record
2. Platform provisions database schema
3. Platform generates API key for tenant
4. Platform adds tenant to service discovery

**Configuration Push**:
1. Platform stores config in `TenantConfiguration`
2. Platform pushes via WebSocket or HTTP
3. Tenant receives and applies config
4. Tenant confirms receipt

**Service Discovery**:
1. Platform scans for running services
2. Platform registers services in `ServiceInstance`
3. Platform monitors service health
4. Platform updates service status

## Deployment

### Development

```powershell
# Platform
cd platform
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Tenant (separate instance)
cd ../server
npm run dev
```

### Production

**Platform**:
```bash
cd platform
npm run build
pm2 start dist/index.js --name baron-platform
```

**Considerations**:
- Separate database for platform metadata
- Firewall rules for ports 6000, 2222, 6001
- SSL/TLS for HTTPS
- Strong JWT secrets
- Log rotation
- Database backups

## Monitoring & Observability

### Logs

**Log Files**:
- `logs/error.log` - Errors only (5MB max, 5 files)
- `logs/combined.log` - All logs (5MB max, 5 files)
- Console output (development only)

**Log Format**:
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "info",
  "message": "Request completed",
  "service": "baron-platform",
  "method": "GET",
  "url": "/api/tenants",
  "status": 200,
  "duration": "45ms"
}
```

### Audit Trail

All platform actions logged in `AuditLog` table:

- Tenant creation/deletion
- Configuration changes
- Service status changes
- API key usage
- Admin authentication

**Audit Log Entry**:
```json
{
  "action": "TENANT_CREATE",
  "resource": "Tenant",
  "resourceId": "uuid",
  "actorType": "PLATFORM_USER",
  "actorId": "admin-uuid",
  "oldValue": null,
  "newValue": {
    "name": "New Tenant",
    "slug": "new-tenant"
  },
  "ipAddress": "192.168.1.1",
  "metadata": {},
  "createdAt": "2024-01-15T10:30:45Z"
}
```

## Security Considerations

### Platform Security

1. **Authentication**:
   - Strong password hashing (bcrypt)
   - JWT with expiration
   - API key rotation

2. **Authorization**:
   - Role-based access control
   - Least privilege principle
   - Audit logging

3. **Network**:
   - Firewall rules
   - Rate limiting
   - CORS configuration

### SSH Security

1. **Access Control**:
   - Password authentication only
   - Admin credentials required
   - Read-only file system

2. **Command Whitelisting**:
   - Only allowed commands executable
   - No shell escapes
   - No arbitrary command execution

3. **Path Security**:
   - Cannot navigate above root
   - Path traversal blocked
   - Hidden files excluded

### Data Security

1. **Database**:
   - Schema-per-tenant isolation
   - Encrypted connection strings
   - Prepared statements (Prisma)

2. **Secrets**:
   - Environment variables (.env)
   - Never committed to Git
   - Rotated regularly

## Future Enhancements

- **Horizontal Scaling**: Multiple platform instances with load balancer
- **Tenant Provisioning**: Automated tenant creation wizard
- **Billing Integration**: Stripe/PayPal integration for subscription management
- **Advanced Monitoring**: Prometheus/Grafana integration
- **CI/CD**: Automated tenant deployments
- **Backup/Restore**: Automated database backups per tenant
- **Multi-Region**: Geographic distribution of tenants
- **CDN Integration**: Static asset distribution
- **Email Service**: Notification system integration
- **2FA**: Two-factor authentication for platform admins
