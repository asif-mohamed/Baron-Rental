# 🚗 سلسلة البارون - Baron Car Rental Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: Beta Testing](https://img.shields.io/badge/Status-Beta%20Testing-orange.svg)]()
[![Completion: 98%](https://img.shields.io/badge/Completion-98%25-brightgreen.svg)]()

**A comprehensive car rental management system built with React, TypeScript, Node.js, Express, and Prisma**

---

## � Quick Start Guide

### ⚡ Automated Setup (Recommended)

**Step 1:** Run Database Setup (only once):
```powershell
.\setup-database.ps1
```
This will:
- Generate Prisma Client
- Create database tables  
- Seed demo data

**Step 2:** Start the Application:
```powershell
.\start-all.ps1
```
This will start both backend and frontend servers automatically.

### 🔧 Alternative: Start Servers Individually

- **Backend Only**: `.\start-backend.ps1`
- **Frontend Only**: `.\start-frontend.ps1`

---

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🚗 Overview

Baron is a comprehensive car rental management system designed specifically for **سلسلة البارون** (Baron Car Rental Company) in Libya. The system provides enterprise-grade fleet management, booking systems, financial tracking, and complete business operations management.

### Key Features

- 🚙 **Fleet Management** - Vehicle inventory, tracking, odometer monitoring, and lifecycle management
- 📅 **Booking System** - Real-time availability, automatic pricing, odometer tracking
- 💰 **Financial Management** - Revenue tracking, extra km charges, pending transactions
- 👥 **Customer Management** - Profiles, documents (ID, fingerprint, contracts), search
- 🔧 **Maintenance Tracking** - Service schedules, repair history, automatic triggers
- 📊 **Business Intelligence** - Real-time dashboards, revenue/expense reports, analytics
- 🔔 **Notification System** - Role-based notifications, accountant alerts, real-time updates
- 👨‍💼 **Multi-Role Access** - Admin, Manager, Accountant, Mechanic, Reception, Warehouse
- 🔐 **Secure Authentication** - JWT-based authentication with RBAC
- 🌍 **Libya Localization** - LYD currency, Tripoli timezone, Gregorian calendar, Arabic RTL
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

---

## � Demo Credentials

### Production Roles (Baron Car Rental Business)
| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Manager** | manager@baron.local | Admin123! | Business oversight, odometer settings, approvals |
| **Accountant** | accountant@baron.local | Admin123! | Financial management, transaction tracking |
| **Reception** | reception@baron.local | Admin123! | Customer service, booking creation |
| **Warehouse** | warehouse@baron.local | Admin123! | Fleet logistics, car delivery |
| **Mechanic** | mechanic@baron.local | Admin123! | Vehicle maintenance |

### Development Role (Testing/Staging Only)
| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Admin** | admin@baron.local | Admin123! | **DEV/TESTING ONLY** - System configuration, user management |

> **⚠️ Note:** Admin role is for development and testing purposes only. Change all passwords in production!

---

## 🎯 Latest Features (November 2025)

### ✨ Recent Implementations

1. **Odometer Tracking System** 🚗
   - Initial odometer reading at booking creation
   - Final odometer reading at car return
   - Automatic km calculation and policy enforcement (100 km/day)
   - Extra km charges (0.5 LYD per km) with pending transactions
   - Fleet mileage auto-update from completed bookings

2. **Accountant Notification System** 💰
   - Automatic notifications to accountants on new bookings
   - Booking details embedded in notifications
   - Action-required flag for transaction creation
   - Role-based delivery to all accountant users

3. **Libya Business Context** 🇱🇾
   - Currency: Libyan Dinar (LYD)
   - Timezone: Africa/Tripoli (GMT+2)
   - Calendar: Gregorian format
   - Language: Arabic (ar-LY locale)
   - RTL (Right-to-Left) support

4. **Manager Dashboard Enhancements** ⚙️
   - Exclusive odometer policy configuration
   - Real-time calculation examples
   - Collapsible settings panel
   - System impact information

5. **Fleet Management Updates** 🚙
   - Sale price column with conditional display
   - Expected sale price field in car form
   - Real-time mileage updates from bookings
   - Status tracking and availability

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Baron Client (React)            │
│  • Vite + TypeScript                    │
│  • Tailwind CSS (RTL Support)           │
│  • Socket.IO Client                     │
│  • Arabic Localization                  │
│                                         │
│  Port: 5173 (Dev) / 3000 (Prod)       │
└────────────────┬────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 │
┌────────────────▼────────────────────────┐
│         Baron Backend (Node.js)         │
│  • Express + TypeScript                 │
│  • JWT Authentication                   │
│  • Socket.IO Server                     │
│  • Prisma ORM                           │
│  • Role-Based Access Control            │
│                                         │
│  Port: 5000                             │
└────────────────┬────────────────────────┘
                 │
                 │ Prisma Client
                 │
┌────────────────▼────────────────────────┐
│         SQLite Database                 │
│  • Development: dev.db                  │
│  • Tables: 15+ (users, cars,           │
│    bookings, transactions, etc.)        │
│  • Migrations: Prisma Migrate           │
└─────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS (RTL Arabic support)
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Notifications:** React Toastify
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **Date Handling:** date-fns (ar-LY locale)

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js + TypeScript
- **Database:** SQLite (dev) / PostgreSQL (prod ready)
- **ORM:** Prisma 5.22
- **Authentication:** JWT + bcryptjs
- **Real-time:** Socket.IO
- **Validation:** Zod
- **File Upload:** Multer
- **Scheduled Jobs:** node-cron
- **Logging:** Winston

#### Database Schema
- **Users & Roles** - RBAC system
- **Cars** - Fleet inventory with odometer tracking
- **Customers** - Customer profiles with documents
- **Bookings** - Rental bookings with initial/final odometer
- **Transactions** - Financial records, extra km charges
- **Maintenance** - Service records and schedules
- **Notifications** - Role-based notification system
- **Activity Logs** - Audit trail

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Git (for cloning) or download ZIP

### Quick Setup (Automated)

If you downloaded the project as a ZIP file or cloned from GitHub, use the automated setup:

1. **Download/Clone the repository:**
```bash
# Option 1: Clone with Git
git clone https://github.com/asif-mohamed/Baron-Rental.git
cd Baron-Rental

# Option 2: Download ZIP from GitHub
# Extract the ZIP file and navigate to the folder
cd Baron-Rental-main
```

2. **Install all dependencies automatically:**
```powershell
# This installs dependencies for both backend and frontend
.\install-dependencies.ps1
```

The script will:
- ✅ Check Node.js and npm versions
- ✅ Install backend (server) dependencies
- ✅ Install frontend (client) dependencies
- ✅ Generate Prisma Client
- ✅ Display installation summary

3. **Setup database and seed demo data:**
```powershell
cd server

# Run migrations
npx prisma migrate deploy

# Seed demo data (6 users + fleet + bookings + transactions)
npm run seed
```

4. **Start Development:**

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```
Server runs on http://localhost:5000

**Terminal 2 - Frontend:**
```powershell
cd client  
npm run dev
```
Frontend runs on http://localhost:5173

### Manual Setup (Alternative)

If you prefer manual installation:

**Backend Setup:**
```powershell
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
```

**Frontend Setup:**
```powershell
cd client
npm install
```

---

## 🌐 Access Points

After successful setup:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main application UI |
| **Backend API** | http://localhost:5000/api | REST API endpoints |
| **API Health** | http://localhost:5000/health | Health check |

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Cars (Fleet Management)
- `GET /api/cars` - List all cars with filters
- `GET /api/cars/available` - Get available cars for date range
- `GET /api/cars/:id` - Get car details
- `POST /api/cars` - Create new car (Warehouse)
- `PUT /api/cars/:id` - Update car details
- `PATCH /api/cars/:id/status` - Update car status
- `DELETE /api/cars/:id` - Soft delete car

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/search?q=query` - Search customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create new customer (Reception)
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Soft delete customer

### Bookings
- `GET /api/bookings` - List bookings with filters
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/check-availability` - Check car availability
- `POST /api/bookings` - Create booking (with initialOdometer)
- `PUT /api/bookings/:id` - Update booking
- `PATCH /api/bookings/:id/pickup` - Mark car as picked up
- `PATCH /api/bookings/:id/return` - Return car (with finalOdometer, calculates extra km)
- `PATCH /api/bookings/:id/cancel` - Cancel booking

### Transactions
- `GET /api/transactions` - List all transactions
- `GET /api/transactions/:id` - Get transaction details
- `POST /api/transactions` - Create transaction (Accountant)
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Notifications
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/sent` - Get sent notifications
- `POST /api/notifications/send` - Send notification to users
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Admin & Configuration
- `GET /api/admin/business-config` - Get business configuration (Libya settings, odometer policy)
- `PUT /api/admin/business-config` - Update business configuration (Manager only)
- `GET /api/users/recipients-list` - Get users for notification recipients

### Maintenance
- `GET /api/maintenance` - List maintenance records
- `POST /api/maintenance` - Create maintenance record (Mechanic)
- `PUT /api/maintenance/:id` - Update maintenance record
- `DELETE /api/maintenance/:id` - Delete maintenance record

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/revenue` - Revenue reports
- `GET /api/reports/fleet-utilization` - Fleet usage statistics

---

## 📂 Project Structure

```
Baron-Rental/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── dashboards/    # Role-specific dashboards
│   │   │   └── Layout.tsx     # Main layout with navigation
│   │   ├── contexts/          # React context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── NotificationContext.tsx
│   │   ├── lib/               # Utilities
│   │   │   └── api.ts         # Axios instance
│   │   ├── pages/             # Page components
│   │   │   ├── Fleet.tsx      # Fleet management with odometer
│   │   │   ├── Bookings.tsx   # Booking system with odometer tracking
│   │   │   ├── Transactions.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── App.tsx            # Main app with routing
│   │   └── main.tsx           # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js     # Tailwind with RTL support
│   └── vite.config.ts
│
└── server/                    # Node.js Backend
    ├── prisma/
    │   ├── schema.prisma      # Database schema with odometer fields
    │   ├── migrations/        # Database migrations
    │   └── dev.db             # SQLite database (development)
    ├── src/
    │   ├── controllers/       # Business logic
    │   │   ├── booking.controller.ts  # Odometer tracking logic
    │   │   ├── admin.controller.ts    # Business config
    │   │   └── ...
    │   ├── routes/            # API routes
    │   │   ├── booking.routes.ts
    │   │   ├── notification.routes.ts
    │   │   └── ...
    │   ├── middleware/        # Auth, permissions, errors
    │   ├── socket/            # Socket.IO real-time
    │   ├── lib/               # Utilities (Prisma client)
    │   ├── index.ts           # Server entry point
    │   └── seed.ts            # Database seeder with odometer data
    ├── uploads/               # File storage
    ├── package.json
    ├── tsconfig.json
    └── .env
│
└── baron_Docs/                # Complete Documentation
    ├── README.md              # Main documentation
    ├── ACCOUNTANT_NOTIFICATIONS.md
    ├── FLEET_ODOMETER_UPDATES.md
    ├── SCHEMA_SEED_UPDATE_SUMMARY.md
    ├── BETA_DEPLOYMENT_GUIDE.md
    ├── API_EXAMPLES.md
    └── ...
```

---

## � Project Status

**Current Phase**: 🧪 **BETA TESTING** - Ready for Real User Testing

### Completion Status: 98%

| Module | Status | Notes |
|--------|--------|-------|
| Authentication & Authorization | ✅ 100% | JWT, 6 roles, RBAC complete |
| Dashboard (Multi-role) | ✅ 100% | Admin, Manager, Accountant, Mechanic, Reception, Warehouse |
| Fleet Management | ✅ 100% | CRUD, odometer tracking, sale price, status tracking |
| Customer Management | ✅ 100% | CRUD, documents (ID, fingerprint, contracts), search |
| Booking System | ✅ 100% | Availability check, auto-pricing, odometer tracking (initial/final) |
| Transactions & Finance | ✅ 100% | Income/expense, extra km charges, Arabic labels |
| Maintenance System | ✅ 100% | Auto-creation, profiles, history |
| **Odometer Tracking** | ✅ 100% | **Initial/final readings, extra km calculation, policy enforcement** |
| **Accountant Notifications** | ✅ 100% | **Auto-notify on new bookings, booking details embedded** |
| **Libya Localization** | ✅ 100% | **LYD currency, Tripoli timezone, Gregorian calendar** |
| Notifications | ✅ 100% | Multi-user, role-based, 12+ types, real-time |
| Reports & Analytics | ✅ 100% | Real-time data, revenue/expense calculations |
| Employee Management | ✅ 100% | User CRUD, role assignment |
| Settings | ✅ 100% | Profile, business configuration |

### Recent Engineering Achievements ✨

1. **Odometer Tracking System** (Fully Engineered):
   - Initial odometer captured at booking creation
   - Final odometer captured at car return
   - Automatic km calculation and policy validation (100 km/day)
   - Extra km charges (0.5 LYD per km) with pending transactions
   - Fleet mileage auto-updates from completed bookings
   - Manager-only configuration dashboard

2. **Accountant Notification System** (Fully Implemented):
   - Automatic notifications on new bookings
   - Booking details embedded in notification data
   - Action-required flag for transaction creation
   - Role-based delivery to all Accountant users

3. **Libya Business Localization**:
   - Currency: Libyan Dinar (LYD)
   - Timezone: Africa/Tripoli (GMT+2)
   - Calendar: Gregorian format
   - Locale: ar-LY throughout application
   - RTL (Right-to-Left) support

4. **Database Schema Updates**:
   - Added `initialOdometer` and `finalOdometer` to Booking model
   - Migration: `20251118081403_add_odometer_fields`
   - Seed data includes sample odometer readings and extra km charges

---

## 📚 Documentation

**📚 Start here**: [baron_Docs/README.md](./baron_Docs/README.md) - Complete documentation navigation guide

Comprehensive guides available in `baron_Docs/`:

1. **[README.md](baron_Docs/README.md)** - 📍 **START HERE** - Main documentation with quick start
2. **[ACCOUNTANT_NOTIFICATIONS.md](baron_Docs/ACCOUNTANT_NOTIFICATIONS.md)** - Accountant notification system
3. **[FLEET_ODOMETER_UPDATES.md](baron_Docs/FLEET_ODOMETER_UPDATES.md)** - Odometer tracking implementation
4. **[SCHEMA_SEED_UPDATE_SUMMARY.md](baron_Docs/SCHEMA_SEED_UPDATE_SUMMARY.md)** - Database schema updates
5. **[BETA_DEPLOYMENT_GUIDE.md](baron_Docs/BETA_DEPLOYMENT_GUIDE.md)** - Deployment instructions
6. **[API_EXAMPLES.md](baron_Docs/API_EXAMPLES.md)** - API usage examples
7. **[DOCUMENTATION_INDEX.md](baron_Docs/DOCUMENTATION_INDEX.md)** - Complete documentation index

---

## 🧪 Beta Testing Guide

### Test User Accounts

Use the demo credentials above to test different user perspectives:
- **Admin** - Full system access, user management (dev/testing only)
- **Manager** - Operations oversight, odometer policy configuration
- **Reception** - Customer & booking management with odometer tracking
- **Warehouse** - Fleet operations and car delivery
- **Accountant** - Financial tracking, transaction creation, booking notifications
- **Mechanic** - Maintenance records

### Testing Scenarios

Refer to **BETA_DEPLOYMENT_GUIDE.md** for detailed testing workflows:
1. **Booking Lifecycle with Odometer** (Reception → Warehouse → Return with km tracking)
2. **Extra Km Charges** (Return car with exceeded mileage → automatic transaction creation → accountant notification)
3. **Financial Operations** (Accountant receives booking notification → creates transaction)
4. **Fleet Mileage Updates** (Complete booking → car mileage auto-updates in fleet)

### Feedback Collection

Please report:
- 🐛 Bugs and errors
- 💡 Feature requests
- 🎨 UI/UX improvements
- ⚡ Performance issues
- 📱 Mobile responsiveness problems

---

## 🛡️ Security Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Role-based access control (RBAC) - 6 roles
- ✅ Password hashing with bcrypt
- ✅ SQL injection protection (Prisma ORM)
- ✅ Input validation with Zod
- ✅ CORS configuration
- ✅ Environment variable validation
- ✅ Secure file upload handling

---

## 📄 License

MIT License - Open Source

---

## 👥 Contact

**Repository:** [Baron-Rental](https://github.com/asif-mohamed/Baron-Rental)  
**Owner:** Asif Mohamed  
**Email:** a.mohamed121991@outlook.com

---

## 🎯 Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] GPS tracking integration
- [ ] Payment gateway integration
- [ ] Multi-language support (English, French)
- [ ] Advanced analytics with AI insights
- [ ] Customer mobile app for self-service
- [ ] Multi-location/branch support

---

**Version:** 1.0.0-beta  
**Status:** Beta Testing ✅  
**Last Updated:** November 18, 2025  
**Built for:** سلسلة البارون Car Rental Company, Libya 🇱🇾

- **[DEPLOYMENT_GUIDE.md](baron_Docs/BETA_DEPLOYMENT_GUIDE.md)** - Production deployment
- **[INDEX.md](baron_Docs/INDEX.md)** - Documentation index

---

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ SQL injection protection (Prisma ORM)
- ✅ CORS configuration
- ✅ Environment variable validation
- ✅ Secure file upload handling
- ✅ SSH access control for platform source

---

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

---

## ️ Development

### Local Development

```bash
# Start backend in dev mode
cd server
npm run dev

# Start frontend in dev mode
cd client
npm run dev
```

### Building for Production

```bash
# Build backend
cd server
npm run build

# Build frontend
cd client
npm run build
```

---

## 🤝 Contributing

This is a proprietary project for Baron Car Rental. Contributions are managed internally.

---

## ⭐ Acknowledgments

Built with modern technologies and best practices:
- React 18, TypeScript, Node.js, Express
- SQLite, Prisma ORM
- Docker, Docker Compose
- Tailwind CSS, Vite
- JWT, bcrypt, Winston

---

**Version:** 1.0.0-beta  
**Status:** Beta Testing ✅  
**Last Updated:** November 18, 2025
