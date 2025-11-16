# 🚀 Baron Car Rental - Installation & Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Installation](#manual-installation)
4. [Running the Application](#running-the-application)
5. [Accessing the System](#accessing-the-system)
6. [Troubleshooting](#troubleshooting)
7. [Project Structure](#project-structure)

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** v18 or higher ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **PowerShell** (for Windows setup scripts)
- **Git** (optional, for version control)

### Verify Installation
Open PowerShell and run:
```powershell
node --version   # Should show v18.x or higher
npm --version    # Should show 9.x or higher
```

---

## Quick Start

### Option 1: Automated Setup (Recommended)

1. Open PowerShell **as Administrator**
2. Navigate to the project directory:
```powershell
cd "~\Baron"
```

3. Run the setup script:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1
```

This script will:
- ✅ Install all backend dependencies
- ✅ Generate Prisma client
- ✅ Run database migrations
- ✅ Seed demo data
- ✅ Install all frontend dependencies

**Setup time**: ~5-10 minutes depending on internet speed

---

## Manual Installation

If you prefer manual setup or the automated script fails:

### Backend Setup

1. Navigate to server directory:
```powershell
cd server
```

2. Install dependencies:
```powershell
npm install
```

3. Generate Prisma client:
```powershell
npm run prisma:generate
```

4. Run database migrations:
```powershell
npm run prisma:migrate
```

5. Seed demo data:
```powershell
npm run seed
```

### Frontend Setup

1. Navigate to client directory:
```powershell
cd ..\client
```

2. Install dependencies:
```powershell
npm install
```

---

## Running the Application

You need to run **TWO** terminals simultaneously:

### Terminal 1: Backend Server

```powershell
cd server
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 5000
📡 Socket.IO ready for connections
✅ Scheduled jobs initialized
```

**Backend will be available at:** http://localhost:5000

### Terminal 2: Frontend Development Server

```powershell
cd client
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Frontend will be available at:** http://localhost:5173

### Using Helper Scripts (Alternative)

**Backend:**
```powershell
.\start-backend.ps1
```

**Frontend:**
```powershell
.\start-frontend.ps1
```

---

## Accessing the System

### 1. Open Your Browser
Navigate to: **http://localhost:5173**

### 2. Login with Demo Credentials

```
Email:    admin@baron.local
Password: Admin123!
```

### 3. Explore the System

After login, you'll have access to:
- 📊 **Dashboard** - Overview with KPIs and statistics
- 🚗 **Fleet** - Manage vehicles
- 👥 **Customers** - Customer database
- 📅 **Bookings** - Rental bookings
- 💰 **Transactions** - Financial records
- 🔧 **Maintenance** - Service records
- 📈 **Reports** - Analytics and exports
- ⚙️ **Settings** - System configuration

---

## Troubleshooting

### Issue: Port Already in Use

**Error:** `Port 5000 is already in use`

**Solution:**
```powershell
# Find and kill the process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or use a different port by editing server/.env
# PORT=5001
```

### Issue: Database Lock Error

**Error:** `database is locked`

**Solution:**
```powershell
cd server
Remove-Item -Force dev.db
npm run prisma:migrate
npm run seed
```

### Issue: Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```powershell
# Delete node_modules and reinstall
cd server
Remove-Item -Recurse -Force node_modules
npm install

cd ..\client
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```powershell
cd server
npm run prisma:generate
```

### Issue: CORS Errors in Browser

**Solution:**
- Ensure backend is running on port 5000
- Check `server/.env` has `CLIENT_URL=http://localhost:5173`
- Clear browser cache and reload

### Issue: Socket.IO Connection Failed

**Solution:**
- Ensure backend server is running
- Check browser console for specific error
- Verify no firewall blocking WebSocket connections

---

## Project Structure

```
Baron/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI
│
├── client/                        # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx        # Main layout with sidebar
│   │   ├── context/
│   │   │   ├── AuthContext.tsx   # Authentication state
│   │   │   └── NotificationContext.tsx  # Real-time notifications
│   │   ├── lib/
│   │   │   └── api.ts            # Axios API client
│   │   ├── pages/
│   │   │   ├── Login.tsx         # Login page
│   │   │   ├── Dashboard.tsx     # Dashboard with KPIs
│   │   │   ├── Fleet.tsx         # Fleet management
│   │   │   ├── Customers.tsx     # Customer management
│   │   │   ├── Bookings.tsx      # Booking system
│   │   │   ├── Transactions.tsx  # Financial transactions
│   │   │   ├── Maintenance.tsx   # Maintenance records
│   │   │   ├── Reports.tsx       # Reports & analytics
│   │   │   └── Settings.tsx      # System settings
│   │   ├── App.tsx               # Main app component
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                        # Node.js Backend
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── car.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── booking.controller.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── maintenance.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── attachment.controller.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── car.routes.ts
│   │   │   ├── customer.routes.ts
│   │   │   ├── booking.routes.ts
│   │   │   ├── transaction.routes.ts
│   │   │   ├── maintenance.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── attachment.routes.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT authentication
│   │   │   ├── error.middleware.ts   # Error handling
│   │   │   └── upload.middleware.ts  # File upload
│   │   ├── jobs/
│   │   │   └── scheduled.jobs.ts     # Cron jobs
│   │   ├── socket/
│   │   │   └── index.ts              # Socket.IO setup
│   │   ├── lib/
│   │   │   └── prisma.ts             # Prisma client
│   │   ├── __tests__/
│   │   │   └── health.test.ts        # Sample test
│   │   ├── index.ts                  # Server entry point
│   │   └── seed.ts                   # Database seeder
│   ├── uploads/                       # Uploaded files
│   ├── .env                           # Environment variables
│   ├── .env.example                   # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
├── README.md                          # Main documentation
├── PROJECT_SUMMARY.md                 # Project overview
├── API_EXAMPLES.md                    # API usage examples
├── INSTALLATION_GUIDE.md              # This file
├── package.json                       # Root package file
├── setup.ps1                          # Setup script
├── start-backend.ps1                  # Backend starter
├── start-frontend.ps1                 # Frontend starter
└── .gitignore                         # Git ignore rules
```

---

## Next Steps

After successful installation:

1. **Explore the Dashboard** - Check the KPIs and statistics
2. **Review Demo Data** - Browse the pre-loaded cars, customers, and bookings
3. **Test API Endpoints** - Use the API examples in `API_EXAMPLES.md`
4. **Check Real-time Notifications** - Create a booking and see live updates
5. **Review Code Structure** - Understand the architecture
6. **Customize** - Modify colors, add features, extend functionality

---

## Development Commands

### Backend Commands
```powershell
cd server

npm run dev              # Start development server
npm run build            # Build for production
npm start                # Run production build
npm test                 # Run tests
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run seed             # Re-seed database
```

### Frontend Commands
```powershell
cd client

npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

---

## Production Build

### Building for Production

1. **Build Backend:**
```powershell
cd server
npm run build
# Output: dist/ folder
```

2. **Build Frontend:**
```powershell
cd client
npm run build
# Output: dist/ folder
```

### Running in Production

1. Set `NODE_ENV=production` in server/.env
2. Update database connection string
3. Set secure JWT_SECRET
4. Run: `npm start` in server directory
5. Serve client/dist with a static server (nginx, Apache, etc.)

---

## Support & Resources

- **README**: Project overview and features
- **PROJECT_SUMMARY**: Detailed implementation status
- **API_EXAMPLES**: Complete API documentation with examples
- **Database Schema**: `server/prisma/schema.prisma`

---

## 🎉 Success Checklist

- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (backend + frontend)
- [ ] Database migrated
- [ ] Demo data seeded
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Successfully logged in as admin
- [ ] Dashboard loads with statistics
- [ ] Real-time notifications working

---

**If all checkboxes are checked, congratulations! Your Baron Car Rental system is ready to use! 🎊**

For issues, refer to the Troubleshooting section above or review the code comments in the source files.
