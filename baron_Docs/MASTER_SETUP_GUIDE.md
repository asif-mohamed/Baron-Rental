# ASIF PLATFORM - MASTER SETUP GUIDE

**Platform Owner:** Asif | **Business License:** Baron Car Rental

## Overview

The `master-setup.ps1` script is a comprehensive orchestration tool that fully deploys and configures the Baron platform with automated integrity checks, dependency resolution, and service startup.

## What It Does

### 1. **Self-Location Validation**
- Verifies script is running from Baron root (`C:\Users\asif1\Desktop\Baron`)
- Auto-relocates if needed

### 2. **Platform Folder Validation**
- Checks for `/platform` folder in same directory
- Validates critical files: package.json, Dockerfile, schema.prisma, index.ts
- Ensures platform structure is complete

### 3. **Docker Infrastructure Deployment**
- Deploys full stack via docker-compose.yml:
  - PostgreSQL (databases: baron_platform, baron_db)
  - Redis (caching/sessions)
  - Asif Platform (control plane: ports 6000, 2222, 6001)
  - Baron Backend (optional Docker mode)
  - Baron Frontend (optional Docker mode)
- Health checks for all services
- Automatic `.env.docker` creation if missing

### 4. **Directory Integrity Check**
- Validates Baron folder architecture:
  ```
  C:\Users\asif1\Desktop\Baron\
  ├── platform/         ✓ Required
  │   ├── src/
  │   ├── prisma/
  │   └── package.json
  ├── server/           ✓ Required
  │   ├── src/
  │   ├── prisma/
  │   └── package.json
  └── client/           ✓ Required
      ├── src/
      └── package.json
  ```
- Checks for missing files/directories
- Reports structural issues

### 5. **Auto-Patching and Dependency Resolution**
- **Auto-installs missing dependencies:**
  - Runs `npm install` in platform/server/client if node_modules missing
  - Generates Prisma clients automatically
  - Installs TypeScript and ts-node globally if needed
  
- **Known issue patches:**
  - Creates `.env` from `.env.example` templates
  - Fixes common configuration issues
  - Validates environment files

### 6. **Database Setup and Seeding**
- Connects to PostgreSQL via Docker
- Runs Prisma migrations for platform database
- Runs Prisma migrations for Baron database
- Executes `server/src/seed.ts` with updated Prisma streams
- Seeds business data: users, roles, initial records

### 7. **Local Service Startup (Platform Orchestrated)**
- **Baron Backend** (port 5000):
  - Starts in new PowerShell window
  - Connects to platform control plane
  - Uses virtualized Prisma stream from platform
  
- **Baron Frontend** (port 3000):
  - Starts in new PowerShell window
  - Connects to backend via platform routing
  - Hot-reload enabled for development

- **Platform Orchestration:**
  - Services register with platform on startup
  - Platform routes API requests between services
  - WebSocket real-time communication
  - Health monitoring and auto-discovery

### 8. **Deployment Validation**
- Tests all service endpoints
- Verifies health checks
- Confirms platform connectivity
- Generates comprehensive report

## Usage

### Basic Setup (Recommended)
```powershell
.\master-setup.ps1
```

This runs all phases with full automation.

### Advanced Options

```powershell
# Skip Docker deployment (use existing containers)
.\master-setup.ps1 -SkipDocker

# Skip integrity check
.\master-setup.ps1 -SkipIntegrityCheck

# Skip database seeding
.\master-setup.ps1 -SkipSeeding

# Local services only (no Docker)
.\master-setup.ps1 -LocalOnly

# Force continue despite errors
.\master-setup.ps1 -Force

# Combine flags
.\master-setup.ps1 -SkipDocker -SkipSeeding -Force
```

## Execution Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. INITIALIZATION                                   │
│    • Validate script location                       │
│    • Initialize logging                             │
│    • Check Baron root directory                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. PLATFORM FOLDER VALIDATION                       │
│    • Check /platform exists                         │
│    • Validate structure & files                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. DOCKER INFRASTRUCTURE DEPLOYMENT                 │
│    • Check Docker installed & running               │
│    • Build Docker images                            │
│    • Start containers (PostgreSQL, Redis, Platform) │
│    • Wait for health checks                         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. DIRECTORY INTEGRITY CHECK                        │
│    • Validate client/server/platform folders        │
│    • Check required files & directories             │
│    • Report missing components                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. AUTO-PATCHING & DEPENDENCIES                     │
│    • npm install (if node_modules missing)          │
│    • Generate Prisma clients                        │
│    • Install TypeScript/ts-node globally            │
│    • Create .env from templates                     │
│    • Apply known issue fixes                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. DATABASE SETUP & SEEDING                         │
│    • Connect to PostgreSQL                          │
│    • Run platform migrations                        │
│    • Run server migrations                          │
│    • Execute seed.ts (updated Prisma streams)       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 7. START LOCAL SERVICES                             │
│    • Start Baron Backend (port 5000)                │
│    • Start Baron Frontend (port 3000)               │
│    • Services connect to platform                   │
│    • Platform orchestrates routing                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 8. VALIDATION & REPORTING                           │
│    • Test all endpoints                             │
│    • Verify health checks                           │
│    • Generate final report                          │
│    • Show service URLs                              │
└─────────────────────────────────────────────────────┘
```

## Output

### During Execution
- **✓** Green checkmarks for success
- **✗** Red X for errors
- **⚠** Yellow warnings for non-critical issues
- **→** Blue arrows for info messages
- **▶** Magenta arrows for phase headers

### Log File
All output is logged to `master-setup.log` with timestamps:
```
[2025-11-16 03:45:12] [INFO] Master setup script started
[2025-11-16 03:45:15] [SUCCESS] Platform folder found
[2025-11-16 03:45:45] [SUCCESS] Docker containers started
...
```

### Final Report
```
📊 SETUP SUMMARY
================

✅ No errors found

🔧 PATCHES APPLIED (5):
   • Created .env.docker
   • Installed server dependencies
   • Generated Prisma client: server
   • Created server/.env
   • Seeded database

🌐 SERVICE URLS
===============

Platform (Control Plane):
  • HTTP API:   http://localhost:6000
  • SSH Access: ssh admin@localhost -p 2222
  • WebSocket:  ws://localhost:6001

Baron Backend:
  • API:        http://localhost:5000/api
  • Health:     http://localhost:5000/api/health

Baron Frontend:
  • App:        http://localhost:3000

Infrastructure:
  • PostgreSQL: localhost:5432
  • Redis:      localhost:6379

📝 NEXT STEPS
=============

1. Open Baron Frontend: http://localhost:3000
2. Login with default credentials (see README.md)
3. Test platform SSH access: ssh admin@localhost -p 2222
4. View platform info: http://localhost:6000/info
```

## Platform Orchestration Architecture

The master setup creates this architecture:

```
┌───────────────────────────────────────────────────────────┐
│                    Docker Containers                       │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │         ASIF PLATFORM (Control Plane)            │    │
│  │                                                   │    │
│  │  • Service Discovery                              │    │
│  │  • API Gateway/Routing                            │    │
│  │  • Health Monitoring                              │    │
│  │  • WebSocket Communication                        │    │
│  │  • SSH Source Code Access                         │    │
│  │                                                   │    │
│  │  HTTP: 6000 | SSH: 2222 | WS: 6001              │    │
│  └─────────┬──────────────────────────────┬─────────┘    │
│            │                               │              │
│            │  ┌─────────────┐   ┌─────────────┐          │
│            │  │ PostgreSQL  │   │    Redis    │          │
│            │  │  (5432)     │   │   (6379)    │          │
│            │  └─────────────┘   └─────────────┘          │
│            │                                              │
└────────────┼──────────────────────────────────────────────┘
             │
             │ Platform Orchestration Layer
             │ (API Routing, Service Discovery)
             │
┌────────────┼──────────────────────────────────────────────┐
│            │       Local Services (PowerShell Windows)     │
│            │                                               │
│            ▼                                               │
│  ┌──────────────────┐         ┌──────────────────┐       │
│  │  Baron Backend   │────────▶│  Baron Frontend  │       │
│  │   (Port 5000)    │   API   │   (Port 3000)    │       │
│  │                  │◀────────│                  │       │
│  │  • REST API      │         │  • React App     │       │
│  │  • Prisma Stream │         │  • Vite Dev      │       │
│  │  • Socket.io     │         │  • Hot Reload    │       │
│  └──────────────────┘         └──────────────────┘       │
│           ▲                                               │
│           │ Virtualized Prisma DB Stream                  │
│           │ (from Platform PostgreSQL)                    │
└───────────┼───────────────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │ Platform routes│
    │ DB queries to  │
    │ PostgreSQL via │
    │ service stream │
    └────────────────┘
```

## Troubleshooting

### Script Not in Baron Root
**Error:** "Script is not in Baron root directory!"

**Solution:** The script will offer to move itself. Answer 'y' or manually copy:
```powershell
Copy-Item master-setup.ps1 C:\Users\asif1\Desktop\Baron\
cd C:\Users\asif1\Desktop\Baron
.\master-setup.ps1
```

### Platform Folder Missing
**Error:** "Platform folder not found"

**Solution:** Ensure the platform folder exists with required structure:
```powershell
# Check if platform exists
Test-Path C:\Users\asif1\Desktop\Baron\platform

# Should contain: src/, prisma/, package.json, Dockerfile
```

### Docker Not Running
**Error:** "Docker daemon not running"

**Solution:**
1. Start Docker Desktop
2. Wait for Docker to fully initialize
3. Verify: `docker ps`
4. Re-run setup

### Port Conflicts
**Error:** "Port 6000/5000/3000 already in use"

**Solution:**
1. Find and stop processes using ports:
   ```powershell
   Get-NetTCPConnection -LocalPort 6000
   Stop-Process -Id <PID>
   ```
2. Or change ports in `.env.docker`

### npm install Failed
**Error:** "npm install failed in [module]"

**Solution:**
1. Check internet connection
2. Clear npm cache: `npm cache clean --force`
3. Try manual install:
   ```powershell
   cd server
   npm install
   ```

### Prisma Migration Failed
**Error:** "Server migrations failed"

**Solution:**
1. Check PostgreSQL is running: `docker ps`
2. Verify DATABASE_URL in .env
3. Try manual migration:
   ```powershell
   cd server
   npx prisma migrate dev
   ```

### Database Seeding Failed
**Error:** "Database seeding failed"

**Solution:**
1. Check if migrations ran successfully
2. Verify seed.ts exists: `server/src/seed.ts`
3. Try manual seeding:
   ```powershell
   cd server
   npx ts-node src/seed.ts
   ```

## Advanced Configuration

### Custom Ports
Edit `.env.docker` before running:
```bash
PLATFORM_HTTP_PORT=7000
BACKEND_PORT=6000
FRONTEND_PORT=4000
```

### Development vs Production
```powershell
# Development mode (in .env.docker)
NODE_ENV=development
PLATFORM_DOCKERFILE=Dockerfile.dev

# Production mode
NODE_ENV=production
PLATFORM_DOCKERFILE=Dockerfile
```

### Skip Phases Selectively
```powershell
# Already have Docker running
.\master-setup.ps1 -SkipDocker

# Database already seeded
.\master-setup.ps1 -SkipSeeding

# Just want dependency check
.\master-setup.ps1 -SkipDocker -SkipSeeding
```

## Migration from Legacy Scripts

Old scripts moved to `legacy_BINs/`:
- `setup.ps1` → Use `master-setup.ps1` instead
- `setup-database.ps1` → Automated in Phase 6
- `start-all.ps1` → Automated in Phase 7
- `start-backend.ps1` → Automated in Phase 7
- `start-frontend.ps1` → Automated in Phase 7
- `verify-deployment.ps1` → Automated in Phase 8

## What's Different?

### Old Workflow (Manual)
```powershell
.\setup.ps1              # Install dependencies
.\setup-database.ps1     # Setup database
.\start-backend.ps1      # Start backend manually
.\start-frontend.ps1     # Start frontend manually
.\verify-deployment.ps1  # Check if working
```

### New Workflow (Automated)
```powershell
.\master-setup.ps1  # Does everything automatically
```

## Platform Features

### Service Discovery
- Platform auto-discovers Baron backend on startup
- Monitors health every 30 seconds
- Updates service registry dynamically

### API Routing
- All frontend API calls route through platform
- Platform forwards to appropriate backend service
- Load balancing support (future)

### Virtualized Database Stream
- Backend uses Prisma client
- Queries stream through platform layer
- Platform manages connection pooling
- Supports multi-tenant architecture

### SSH Source Access
```bash
ssh admin@localhost -p 2222
# Password: Admin123!@#Platform

ls                  # Browse platform source
cat src/index.ts    # View files
tree                # Directory structure
help                # Available commands
```

## Support

### Logs
- Setup log: `master-setup.log`
- Platform logs: `docker logs asif-platform`
- Backend logs: Check PowerShell window
- Frontend logs: Check PowerShell window

### Check Status
```powershell
# Docker services
docker ps

# Service health
curl http://localhost:6000/health
curl http://localhost:5000/api/health

# Platform info
curl http://localhost:6000/info
```

### Clean Restart
```powershell
# Stop everything
docker compose down -v
Get-Process node | Stop-Process -Force

# Re-run setup
.\master-setup.ps1
```

## Success Criteria

Setup is successful when:
- ✅ All Docker containers running and healthy
- ✅ No errors in final report
- ✅ Baron Frontend accessible at http://localhost:3000
- ✅ Baron Backend API responding at http://localhost:5000/api/health
- ✅ Platform API responding at http://localhost:6000/health
- ✅ SSH access working: `ssh admin@localhost -p 2222`
- ✅ Database seeded with initial data

## Next Steps After Setup

1. **Test the application:**
   - Open http://localhost:3000
   - Login with seeded credentials
   - Navigate through different user roles

2. **Verify platform integration:**
   - Check platform info: http://localhost:6000/info
   - View service registry: http://localhost:6000/api/tenants
   - Test SSH access for source code viewing

3. **Development workflow:**
   - Make changes in `client/src` or `server/src`
   - Services auto-reload (hot-reload enabled)
   - Platform continues orchestrating requests

4. **Production deployment:**
   - Review `DOCKER_GUIDE.md`
   - Update security credentials
   - Configure SSL/HTTPS
   - Set up monitoring
