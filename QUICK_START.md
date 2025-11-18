# 🚀 Baron Car Rental - Quick Start Guide

This guide helps you get Baron up and running quickly after downloading from GitHub.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js 18+** installed ([Download here](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **PowerShell** (for Windows users)

Check your versions:
```powershell
node --version   # Should be v18.0.0 or higher
npm --version    # Should be 9.0.0 or higher
```

---

## 🎯 Installation Steps

### Step 1: Download the Project

**Option A: Clone with Git**
```bash
git clone https://github.com/asif-mohamed/Baron-Rental.git
cd Baron-Rental
```

**Option B: Download ZIP**
1. Go to https://github.com/asif-mohamed/Baron-Rental
2. Click the green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP file
5. Open PowerShell in the extracted folder

---

### Step 2: Install Dependencies

Run the automated installation script:

```powershell
.\install-dependencies.ps1
```

This script will:
- ✅ Check Node.js version
- ✅ Install backend dependencies (~150 packages)
- ✅ Install frontend dependencies (~100 packages)
- ✅ Generate Prisma Client for database
- ✅ Show installation summary

**Expected duration:** 2-5 minutes depending on internet speed

---

### Step 3: Setup Database

```powershell
cd server

# Run database migrations
npx prisma migrate deploy

# Seed demo data (creates 6 users, fleet, bookings, transactions)
npm run seed
```

**Demo accounts created:**
- Admin: `admin@baron.ly` / `Admin123!@#`
- Accountant: `accountant@baron.ly` / `Accountant123!@#`
- Mechanic: `mechanic@baron.ly` / `Mechanic123!@#`
- Warehouse: `warehouse@baron.ly` / `Warehouse123!@#`
- Marketing: `marketing@baron.ly` / `Marketing123!@#`
- Office: `office@baron.ly` / `Office123!@#`

---

### Step 4: Start the Application

**Open TWO PowerShell terminals:**

**Terminal 1 - Start Backend:**
```powershell
cd server
npm run dev
```
✅ Backend runs on: http://localhost:5000

**Terminal 2 - Start Frontend:**
```powershell
cd client
npm run dev
```
✅ Frontend runs on: http://localhost:5173

---

## 🌐 Access the Application

1. Open your browser
2. Go to: **http://localhost:5173**
3. Login with any demo account (see Step 3)

---

## 🎭 Test Different Roles

Each role has different permissions and dashboard views:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@baron.ly | Admin123!@# | Full system access |
| **Accountant** | accountant@baron.ly | Accountant123!@# | Financial management |
| **Mechanic** | mechanic@baron.ly | Mechanic123!@# | Maintenance tracking |
| **Warehouse** | warehouse@baron.ly | Warehouse123!@# | Fleet management |
| **Marketing** | marketing@baron.ly | Marketing123!@# | Customer management |
| **Office** | office@baron.ly | Office123!@# | Booking management |

---

## 🔧 Troubleshooting

### Dependencies Installation Failed?

```powershell
# Clean install - delete existing files
cd server
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install

cd ../client
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

### Prisma Client Not Generated?

```powershell
cd server
npx prisma generate
```

### Database Errors?

```powershell
cd server
# Reset database
npx prisma migrate reset --force

# Re-seed data
npm run seed
```

### Port Already in Use?

If port 5000 or 5173 is busy:

**Backend (change port in server/.env):**
```
PORT=5001
```

**Frontend (change in client/vite.config.ts):**
```typescript
server: {
  port: 3001,
  // ...
}
```

### Node.js Version Too Old?

Download and install Node.js 18+ from:
https://nodejs.org/

---

## 📚 Next Steps

After successful setup:

1. **Explore Features:**
   - Create bookings
   - Manage fleet
   - Track maintenance
   - Generate reports
   - Test odometer tracking
   - Review accountant notifications

2. **Read Documentation:**
   - `README.md` - Complete project overview
   - `baron_Docs/INSTALLATION_GUIDE.md` - Detailed installation
   - `baron_Docs/BETA_DEPLOYMENT_GUIDE.md` - Production deployment
   - `baron_Docs/API_EXAMPLES.md` - API usage examples

3. **Test All Dashboards:**
   - Login as each role
   - Verify dashboard functionality
   - Test role-based permissions
   - Review notification system

---

## 🆘 Need Help?

**Check these resources:**
- 📖 Full README: `README.md`
- 📁 Documentation folder: `baron_Docs/`
- 🔍 Common issues: `baron_Docs/INSTALLATION_GUIDE.md`

**Contact:**
- Email: a.mohamed121991@outlook.com
- GitHub Issues: https://github.com/asif-mohamed/Baron-Rental/issues

---

## 🎉 You're All Set!

Baron Car Rental is now running locally. Explore the system, test different roles, and check out the features!

**Happy Testing! 🚗**

---

**Version:** 1.0.0-beta  
**Last Updated:** November 18, 2025  
**Built for:** Baron Car Rental, Libya 🇱🇾
