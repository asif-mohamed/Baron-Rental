# Baron Setup Scripts Documentation

This document describes all the PowerShell scripts available for setting up and running Baron Car Rental Management System.

---

## 📥 Initial Setup Scripts (For First-Time Installation)

### 1. `install-dependencies.ps1` ⭐ **Start Here!**

**Purpose:** Installs all required Node.js dependencies for both backend and frontend.

**When to use:**
- First time after downloading/cloning from GitHub
- After deleting node_modules folders
- When dependencies are missing or corrupted

**What it does:**
1. ✅ Checks Node.js and npm versions (requires Node.js 18+)
2. ✅ Installs backend (server) dependencies (~150 packages)
3. ✅ Installs frontend (client) dependencies (~100 packages)
4. ✅ Generates Prisma Client for database operations
5. ✅ Shows detailed installation summary

**Usage:**
```powershell
.\install-dependencies.ps1
```

**Expected duration:** 2-5 minutes (depending on internet speed)

**Output:**
- Success: Green checkmarks for all components
- Failure: Red error messages with troubleshooting tips

---

### 2. `setup-database.ps1`

**Purpose:** Initializes the database schema and seeds demo data.

**When to use:**
- After running `install-dependencies.ps1`
- First time setup
- When you need to reset the database
- When database is corrupted

**What it does:**
1. ✅ Checks if Prisma Client is generated
2. ✅ Runs database migrations (creates tables)
3. ✅ Seeds demo data (users, cars, bookings, transactions)
4. ✅ Creates 6 demo user accounts

**Usage:**
```powershell
.\setup-database.ps1
```

**Expected duration:** 10-30 seconds

**Demo Accounts Created:**
- Admin: `admin@baron.ly` / `Admin123!@#`
- Accountant: `accountant@baron.ly` / `Accountant123!@#`
- Mechanic: `mechanic@baron.ly` / `Mechanic123!@#`
- Warehouse: `warehouse@baron.ly` / `Warehouse123!@#`
- Marketing: `marketing@baron.ly` / `Marketing123!@#`
- Office: `office@baron.ly` / `Office123!@#`

---

### 3. `verify-installation.ps1`

**Purpose:** Verifies that all dependencies are installed correctly.

**When to use:**
- After running `install-dependencies.ps1`
- To troubleshoot installation issues
- Before starting the application
- To check system prerequisites

**What it checks:**
1. ✅ Node.js version (18+ required)
2. ✅ npm version
3. ✅ Project directory structure
4. ✅ Backend dependencies (node_modules)
5. ✅ Frontend dependencies (node_modules)
6. ✅ Prisma Client generation
7. ✅ Database file existence
8. ✅ Essential scripts

**Usage:**
```powershell
.\verify-installation.ps1
```

**Expected duration:** 2-5 seconds

**Output Categories:**
- **SUCCESS**: Green - Everything working correctly
- **WARNINGS**: Yellow - Optional items missing (still functional)
- **ISSUES**: Red - Critical problems that need fixing

---

## 🚀 Running the Application

### 4. `start-all.ps1`

**Purpose:** Starts both backend and frontend servers simultaneously (if available).

**When to use:**
- Every time you want to run the application
- After successful setup
- For development and testing

**What it does:**
1. Starts backend server on port 5000
2. Starts frontend server on port 5173
3. Opens both in separate terminal windows (if implemented)

**Usage:**
```powershell
.\start-all.ps1
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

### 5. `start-backend.ps1` (If available)

**Purpose:** Starts only the backend server.

**When to use:**
- Testing API endpoints
- Backend-only development
- When frontend is not needed

**Usage:**
```powershell
.\start-backend.ps1
```

**Alternative:**
```powershell
cd server
npm run dev
```

---

### 6. `start-frontend.ps1` (If available)

**Purpose:** Starts only the frontend server.

**When to use:**
- Frontend-only development
- UI/UX testing
- When backend is already running

**Usage:**
```powershell
.\start-frontend.ps1
```

**Alternative:**
```powershell
cd client
npm run dev
```

---

## 🔧 Maintenance Scripts

### 7. `master-setup.ps1` / `master-setup-clean.ps1` / `master-setup-fresh.ps1`

**Purpose:** Comprehensive setup scripts for various scenarios.

**Variations:**
- **master-setup.ps1**: Standard setup
- **master-setup-clean.ps1**: Clean installation (removes old files)
- **master-setup-fresh.ps1**: Fresh installation from scratch

**When to use:**
- Complex setup scenarios
- Automated deployment
- Production environment setup

---

## 📋 Recommended Setup Workflow

### For First-Time Users (Downloaded from GitHub):

```powershell
# Step 1: Install all dependencies
.\install-dependencies.ps1

# Step 2: Verify installation (optional but recommended)
.\verify-installation.ps1

# Step 3: Setup database
.\setup-database.ps1

# Step 4: Start the application
.\start-all.ps1
# OR start manually in two terminals:
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```

### For Daily Development:

```powershell
# Just start the app
.\start-all.ps1

# OR manually:
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```

### When Things Go Wrong:

```powershell
# Step 1: Verify what's wrong
.\verify-installation.ps1

# Step 2: Reinstall dependencies
.\install-dependencies.ps1

# Step 3: Reset database
.\setup-database.ps1

# Step 4: Verify again
.\verify-installation.ps1

# Step 5: Start the app
.\start-all.ps1
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

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `install-dependencies.ps1` | Install npm packages | First time, missing deps |
| `verify-installation.ps1` | Check installation | Troubleshooting |
| `setup-database.ps1` | Initialize database | First time, reset DB |
| `start-all.ps1` | Start both servers | Run the app |
| `start-backend.ps1` | Start backend only | Backend development |
| `start-frontend.ps1` | Start frontend only | Frontend development |

---

**Last Updated:** November 18, 2025  
**Version:** 1.0.0-beta  
**Baron Car Rental Management System** 🚗
