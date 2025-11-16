# ASIF PLATFORM - Docker Deployment Guide

**Platform Owner:** Asif | **Business License:** Baron Car Rental

## Overview

This guide explains how to run the complete Baron platform using Docker. The platform architecture consists of:

- **Asif Platform (Control Plane)**: Routes API requests between Baron services
- **Baron Backend**: Business logic, connects to platform
- **Baron Frontend**: UI served through platform routing
- **PostgreSQL**: Separate databases for platform + Baron tenant
- **Redis**: Caching and session management

The platform acts as the control plane, discovering and routing to Baron services which can run locally or remotely, all listening to platform API connections.

## Prerequisites

1. **Docker Desktop** installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Minimum version: Docker 20.10+, Docker Compose 2.0+

2. **System Requirements**
   - RAM: 4GB minimum (8GB recommended)
   - Disk: 10GB free space
   - OS: Windows 10/11, macOS, or Linux

## Quick Start

### 1. Basic Setup (Production Mode)

```powershell
# Start all services
.\setup-docker.ps1

# Start in detached mode (background)
.\setup-docker.ps1 -Detached

# Build and start
.\setup-docker.ps1 -Build
```

### 2. Development Mode

```powershell
# Start in development mode with hot-reload
.\setup-docker.ps1 -Dev

# Build and start in dev mode
.\setup-docker.ps1 -Dev -Build
```

## Available Commands

### Start Services
```powershell
.\setup-docker.ps1 -Action up
.\setup-docker.ps1 -Action up -Build        # Build before starting
.\setup-docker.ps1 -Action up -Detached     # Run in background
```

### Stop Services
```powershell
.\setup-docker.ps1 -Action down
```

### Restart Services
```powershell
.\setup-docker.ps1 -Action restart
```

### View Logs
```powershell
.\setup-docker.ps1 -Action logs             # Follow all logs
docker compose logs -f platform             # Platform logs only
docker compose logs -f baron-backend        # Backend logs only
docker compose logs -f baron-frontend       # Frontend logs only
```

### Check Status
```powershell
.\setup-docker.ps1 -Action status
docker compose ps                           # List containers
```

### Build Images
```powershell
.\setup-docker.ps1 -Action build            # Build all images
docker compose build platform               # Build platform only
```

### Clean Up
```powershell
.\setup-docker.ps1 -Action clean            # Remove everything
docker compose down -v                      # Stop and remove volumes
```

## Service URLs

After starting, services are available at:

### Platform (Control Plane)
- **HTTP API**: http://localhost:6000
- **SSH Access**: `ssh admin@localhost -p 2222`
- **WebSocket**: ws://localhost:6001
- **Health Check**: http://localhost:6000/health
- **Platform Info**: http://localhost:6000/info

### Baron Backend
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Baron Frontend
- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### Infrastructure
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Environment Configuration

Edit `.env.docker` to customize:

```bash
# Ports
PLATFORM_HTTP_PORT=6000
PLATFORM_SSH_PORT=2222
PLATFORM_WS_PORT=6001
BACKEND_PORT=5000
FRONTEND_PORT=3000

# Database
POSTGRES_PASSWORD=your_secure_password

# Authentication
PLATFORM_JWT_SECRET=your_secret_key
BARON_JWT_SECRET=your_baron_secret

# Admin SSH Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

## Platform Architecture

### Request Flow

1. **Frontend → Platform → Backend**
   - User interacts with Baron Frontend (React app)
   - Frontend makes API calls to Baron Backend
   - Platform routes requests based on service discovery

2. **Backend → Platform**
   - Baron Backend registers with Platform on startup
   - Platform discovers and monitors Backend health
   - WebSocket connection for real-time updates

3. **Platform → Backend (Routing)**
   - Platform acts as API gateway
   - Routes based on tenant ID and service registry
   - Load balancing across multiple instances

### Service Discovery

The platform automatically discovers Baron services through:
- **HTTP Health Checks**: Every 30 seconds
- **WebSocket Connections**: Real-time status updates
- **Service Registry**: Maintains active service list

### SSH Source Code Access

Admin users can SSH into the platform to view source code:

```bash
# Connect to platform
ssh admin@localhost -p 2222
# Password: Admin123!@#Platform

# Available commands
ls                  # List files
cd <directory>      # Change directory
cat <file>          # View file contents
tree                # Show directory tree
help                # Show available commands
exit                # Disconnect
```

**Purpose**: Read-only access for admins to fork platform source code and run locally.

## Database Schema

### Platform Database (`baron_platform`)
- Tenant registry
- Service discovery metadata
- Platform user accounts
- Configuration sync data

### Baron Database (`baron_db`)
- Business data (bookings, customers, cars, etc.)
- Transactions and financial records
- Employee and user management

## Docker Volumes

Persistent data is stored in named volumes:

```powershell
# List volumes
docker volume ls

# Inspect volume
docker volume inspect baron-postgres-data

# Backup database
docker exec baron-postgres pg_dump -U postgres baron_platform > backup.sql

# Restore database
docker exec -i baron-postgres psql -U postgres baron_platform < backup.sql
```

## Troubleshooting

### Services Won't Start

```powershell
# Check Docker daemon
docker ps

# Check logs
docker compose logs platform
docker compose logs baron-backend

# Restart Docker Desktop
```

### Database Connection Issues

```powershell
# Check PostgreSQL is running
docker compose ps postgres

# Test connection
docker exec -it baron-postgres psql -U postgres -d baron_platform

# View database logs
docker compose logs postgres
```

### Port Conflicts

```powershell
# Check what's using ports
netstat -ano | findstr :6000
netstat -ano | findstr :5000

# Change ports in .env.docker
PLATFORM_HTTP_PORT=7000
BACKEND_PORT=6000
```

### Platform Can't Discover Backend

```powershell
# Check network connectivity
docker exec asif-platform ping baron-backend

# Verify service registry
curl http://localhost:6000/api/tenants

# Check WebSocket connection
docker compose logs platform | findstr "WebSocket"
```

### SSH Connection Failed

```powershell
# Check SSH server is running
docker compose logs platform | findstr "SSH"

# Test connection
ssh -v admin@localhost -p 2222

# Verify credentials in .env.docker
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!@#Platform
```

## Development Workflow

### Hot Reload (Development Mode)

```powershell
# Start in dev mode
.\setup-docker.ps1 -Dev

# Make code changes - services will auto-reload
# Platform: Changes in platform/src/**
# Backend: Changes in server/src/**
# Frontend: Changes in client/src/**
```

### Debugging

```powershell
# Attach to container
docker exec -it asif-platform sh
docker exec -it baron-backend sh

# View environment variables
docker exec asif-platform env

# Run commands inside container
docker exec asif-platform npm run prisma:studio
```

### Rebuild After Changes

```powershell
# Rebuild specific service
docker compose build platform
docker compose up -d platform

# Rebuild all services
.\setup-docker.ps1 -Action build
.\setup-docker.ps1 -Action restart
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords in `.env.docker`
- [ ] Update JWT secrets to strong random values
- [ ] Configure HTTPS/SSL certificates
- [ ] Enable firewall rules
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Review CORS settings

### Performance Tuning

```yaml
# In docker-compose.yml, add resource limits
services:
  platform:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Monitoring

```powershell
# Resource usage
docker stats

# Health checks
curl http://localhost:6000/health
curl http://localhost:5000/api/health

# Service logs
docker compose logs -f --tail=100
```

## Backup and Restore

### Backup Everything

```powershell
# Stop services
.\setup-docker.ps1 -Action down

# Backup volumes
docker run --rm -v baron-postgres-data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres-backup.tar.gz /data
docker run --rm -v backend-uploads:/data -v ${PWD}:/backup alpine tar czf /backup/uploads-backup.tar.gz /data

# Restart services
.\setup-docker.ps1
```

### Restore

```powershell
# Stop services
.\setup-docker.ps1 -Action down

# Restore volumes
docker run --rm -v baron-postgres-data:/data -v ${PWD}:/backup alpine sh -c "cd / && tar xzf /backup/postgres-backup.tar.gz"

# Restart services
.\setup-docker.ps1
```

## Next Steps

1. **Customize Configuration**: Edit `.env.docker` for your environment
2. **Update Passwords**: Change all default credentials
3. **Test Services**: Verify all endpoints are accessible
4. **Configure DNS**: Set up custom domain names
5. **Enable HTTPS**: Configure SSL certificates
6. **Set Up Monitoring**: Implement logging and alerting
7. **Create Backups**: Schedule automated backups

## Support

For issues or questions:
- Check logs: `.\setup-docker.ps1 -Action logs`
- Review status: `.\setup-docker.ps1 -Action status`
- Platform documentation: `platform/docs/`
- Docker documentation: https://docs.docker.com/
