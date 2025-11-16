# Baron Platform - Quick Start Guide

Get the Baron Platform up and running in minutes.

## Prerequisites

✅ Node.js 18+ installed  
✅ PostgreSQL 14+ installed and running  
✅ Git (for cloning)

## Step 1: Create Platform Database

Open PostgreSQL and create the platform database:

```sql
CREATE DATABASE baron_platform;
```

## Step 2: Configure Environment

Navigate to the platform folder:

```powershell
cd C:\Users\asif1\Desktop\Baron\platform
```

Copy the environment template:

```powershell
copy .env.example .env
```

Edit `.env` and update the database connection:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/baron_platform"
```

**Important Variables**:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Random secret for JWT tokens (change this!)
- `PLATFORM_SECRET` - Shared secret for tenant communication
- `ADMIN_PASSWORD` - SSH and platform admin password

## Step 3: Install Dependencies

```powershell
npm install
```

This will install:
- Express.js (HTTP server)
- SSH2 (SSH server)
- WebSocket (real-time communication)
- Prisma (database ORM)
- Winston (logging)
- And more...

## Step 4: Initialize Database

Generate Prisma client:

```powershell
npm run prisma:generate
```

Run database migrations:

```powershell
npm run prisma:migrate
```

This creates all necessary tables:
- Tenant
- TenantConfiguration
- PlatformUser
- ServiceInstance
- AuditLog
- ApiKey
- And more...

## Step 5: Seed Initial Data

Create the platform admin user:

```powershell
npx ts-node src/seed.ts
```

This creates:
- **Admin User**: username `admin`, password from `.env`
- **Demo Tenant**: A sample tenant for testing

## Step 6: Start the Platform

Start in development mode:

```powershell
npm run dev
```

You should see:

```
Platform Server starting...
  Platform Port: 6000
  SSH Port: 2222
  WebSocket Port: 6001

Platform Server listening on port 6000
SSH Server listening on 0.0.0.0:2222
  Admin username: admin
  Access mode: READ-ONLY
  Root path: C:\Users\asif1\Desktop\Baron\platform
WebSocket Server listening on port 6001

Background services started:
  ✓ Tenant Discovery Service
  ✓ Configuration Sync Service
  ✓ Health Monitor Service
```

## Step 7: Test the Platform

### Test HTTP API

Check platform health:

```powershell
curl http://localhost:6000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

Get platform info:

```powershell
curl http://localhost:6000/info
```

### Test SSH Access

Connect via SSH:

```bash
ssh admin@localhost -p 2222
```

Password: (from your `.env` file, default: `Admin123!@#Platform`)

Try commands:

```bash
baron-platform:/$ ls
baron-platform:/$ cd src
baron-platform:/src$ tree
baron-platform:/src$ cat index.ts
baron-platform:/src$ exit
```

### Test WebSocket

Use a WebSocket client or browser console:

```javascript
const ws = new WebSocket('ws://localhost:6001/ws/tenant/demo');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'config_request' }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## Step 8: Login to Platform

Get authentication token:

```powershell
curl -X POST http://localhost:6000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"Admin123!@#Platform"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@baron-platform.local",
    "role": "SUPER_ADMIN"
  }
}
```

Use the token in requests:

```powershell
$token = "YOUR_JWT_TOKEN"
curl http://localhost:6000/api/tenants `
  -H "Authorization: Bearer $token"
```

## Step 9: Create a Tenant

With your authentication token, create a new tenant:

```powershell
curl -X POST http://localhost:6000/api/tenants `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "My Tenant",
    "slug": "my-tenant",
    "domain": "my-tenant.baron.local",
    "databaseUrl": "postgresql://postgres:password@localhost:5432/baron_my_tenant",
    "plan": "FREE"
  }'
```

Response:
```json
{
  "id": "...",
  "name": "My Tenant",
  "slug": "my-tenant",
  "status": "ACTIVE",
  "configuration": {
    "displayName": "My Tenant",
    "timezone": "UTC",
    "currency": "USD",
    "enabledRoles": ["ACCOUNTANT", "MANAGER", "MECHANIC", "DRIVER"]
  }
}
```

## Step 10: Monitor Services

Check registered services:

```powershell
curl http://localhost:6000/api/services `
  -H "Authorization: Bearer $token"
```

Get platform statistics:

```powershell
curl http://localhost:6000/api/platform/stats `
  -H "Authorization: Bearer $token"
```

## Next Steps

✅ **Platform is running!**

Now you can:

1. **Start a Baron Tenant**:
   ```powershell
   cd ..\server
   npm run dev
   ```
   The platform will auto-discover it within 60 seconds.

2. **Configure Tenants**:
   - Update display names, themes, enabled roles
   - Enable/disable features
   - Set timezone, currency, language

3. **Monitor Health**:
   - View service status
   - Check audit logs
   - Review platform statistics

4. **Access via SSH**:
   - Browse platform files
   - Read configuration
   - View logs

## Troubleshooting

### Platform won't start

**Check database connection**:
```powershell
psql -U postgres -d baron_platform -c "SELECT 1;"
```

**Check ports are free**:
```powershell
netstat -ano | findstr ":6000"
netstat -ano | findstr ":2222"
netstat -ano | findstr ":6001"
```

### Cannot connect via SSH

**Verify SSH server started**:
Check console output for "SSH Server listening on 0.0.0.0:2222"

**Test SSH connection**:
```bash
ssh -v admin@localhost -p 2222
```

**Check credentials**:
Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`

### Tenant not discovered

**Wait for discovery cycle** (60 seconds)

**Check tenant is running**:
```powershell
curl http://localhost:5000/health
```

**Check platform logs**:
```powershell
Get-Content logs\combined.log -Wait -Tail 50
```

### Authentication fails

**Verify JWT secret** is set in `.env`

**Check token expiration**:
JWT tokens expire after 24 hours. Re-login to get new token.

**Verify user exists**:
```powershell
npx ts-node src/seed.ts
```

## Development Tips

### Watch logs in real-time:

```powershell
Get-Content logs\combined.log -Wait -Tail 50
```

### View database:

```powershell
npm run prisma:studio
```

Opens Prisma Studio at http://localhost:5555

### Reset database:

```powershell
npm run prisma:migrate reset
npx ts-node src/seed.ts
```

### Run tests:

```powershell
npm test
```

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` and `PLATFORM_SECRET` to strong random values
- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL/TLS for HTTPS
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up firewall rules (allow 6000, 2222, 6001)
- [ ] Use process manager (PM2, systemd)
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure domain names
- [ ] Set up reverse proxy (nginx)

## Support

For issues or questions, check:

- `platform/README.md` - Full documentation
- `platform/docs/ARCHITECTURE.md` - System architecture
- `platform/docs/` - Additional guides
- `logs/combined.log` - Application logs

## Summary

You now have:

✅ Baron Platform running on port 6000  
✅ SSH access on port 2222  
✅ WebSocket server on port 6001  
✅ Admin user created  
✅ Platform database initialized  
✅ Background services running  

**Next**: Start a Baron tenant instance and watch the platform auto-discover it!
