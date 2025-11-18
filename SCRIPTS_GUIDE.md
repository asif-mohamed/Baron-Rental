# Baron Setup Scripts Documentation

This document describes the PowerShell script available for setting up and running Baron Car Rental Management System.

---

## 📥 Setup Script

### `setup.ps1` ⭐ **All-in-One Setup**

**Purpose:** Complete automated setup - installs dependencies, configures database, seeds data.

**When to use:**
- First time after downloading/cloning from GitHub
- When starting fresh
- After major updates
- When dependencies or database need reset

**What it does:**
1. ✅ Checks Node.js and npm versions (requires Node.js 18+)
2. ✅ Installs backend (server) dependencies (~150 packages)
3. ✅ Installs frontend (client) dependencies (~100 packages)
4. ✅ Generates Prisma Client for database operations
5. ✅ Runs database migrations (creates tables)
6. ✅ Seeds demo data (6 users, fleet, bookings, transactions)
7. ✅ Shows detailed completion summary

**Usage:**
```powershell
.\setup.ps1
```

**Expected duration:** 3-5 minutes (depending on internet speed)

**Output:**
- Progress indicators for each step (1/6, 2/6, etc.)
- Success: Green checkmarks with package counts
- Failure: Red error messages with troubleshooting tips
- Final summary with demo account credentials

**Demo Accounts Created:**
- Admin: `admin@baron.ly` / `Admin123!@#`
- Accountant: `accountant@baron.ly` / `Accountant123!@#`
- Mechanic: `mechanic@baron.ly` / `Mechanic123!@#`
- Warehouse: `warehouse@baron.ly` / `Warehouse123!@#`
- Marketing: `marketing@baron.ly` / `Marketing123!@#`
- Office: `office@baron.ly` / `Office123!@#`

---

## 🚀 Running the Application

After running `setup.ps1`, start the application manually in two terminals:

### Terminal 1 - Backend Server

```powershell
cd server
npm run dev
```

**Access:** http://localhost:5000  
**Health Check:** http://localhost:5000/health

### Terminal 2 - Frontend Application

```powershell
cd client
npm run dev
```

**Access:** http://localhost:5173

---

## 📋 Recommended Setup Workflow

### For First-Time Users (Downloaded from GitHub):

```powershell
# One command does everything!
.\setup.ps1

# Then start the app in two terminals:
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```

**That's it!** No other scripts needed.

### For Daily Development:

```powershell
# Just start the servers
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```

### When Things Go Wrong:

```powershell
# Re-run setup to fix issues
.\setup.ps1
```

---

## 🆘 Troubleshooting

### Script won't run - Execution Policy Error

**Error:**
```
.\install-dependencies.ps1 : File cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js version too old

**Error:**
```
Node.js version v16.x.x is too old (Required: 18+)
```

**Solution:**
1. Download Node.js 18+ from https://nodejs.org/
2. Install the LTS (Long Term Support) version
3. Restart PowerShell
4. Run `node --version` to verify

### npm install fails - Network issues

**Solutions:**
1. Check internet connection
2. Try using a different network
3. Clear npm cache: `npm cache clean --force`
4. Retry installation

### Prisma Client generation fails

**Error:**
```
Prisma Client could not be generated
```

**Solution:**
```powershell
cd server
# Stop all Node processes
npx prisma generate
```

### Database migration fails

**Error:**
```
Migration failed to apply
```

**Solution:**
```powershell
cd server
# Reset database (WARNING: deletes all data)
npx prisma migrate reset --force
npm run seed
```

### Port already in use

**Error:**
```
Port 5000 is already in use
Port 5173 is already in use
```

**Solution:**
1. Find and kill the process using the port:
```powershell
# Find process on port 5000
netstat -ano | findstr :5000
# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

2. Or change the port in configuration files

---

## 📚 Additional Resources

- **Complete Setup Guide:** [QUICK_START.md](QUICK_START.md)
- **Installation Details:** [baron_Docs/INSTALLATION_GUIDE.md](baron_Docs/INSTALLATION_GUIDE.md)
- **Deployment Guide:** [baron_Docs/BETA_DEPLOYMENT_GUIDE.md](baron_Docs/BETA_DEPLOYMENT_GUIDE.md)
- **Project Overview:** [README.md](README.md)

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Complete setup (first time) | `.\setup.ps1` |
| Start backend | `cd server && npm run dev` |
| Start frontend | `cd client && npm run dev` |
| Reset everything | `.\setup.ps1` |

---

**Last Updated:** November 18, 2025  
**Version:** 1.0.0-beta  
**Baron Car Rental Management System** 🚗
