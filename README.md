# Baron Car Rental Management System

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Platform: Nexus](https://img.shields.io/badge/Platform-Nexus-blue.svg)](https://github.com/asif-mohamed)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green.svg)]()

**A complete multi-tenant SaaS car rental management system running on the Nexus Platform**

---

## 🚗 Overview

Baron is a comprehensive car rental management system built on a **multi-tenant SaaS architecture**. It leverages the **Nexus Platform** for service orchestration, discovery, and routing, providing enterprise-grade fleet management, booking systems, and business operations.

### Key Features

- 🚙 **Fleet Management** - Complete vehicle inventory, tracking, and lifecycle management
- 📅 **Booking System** - Online reservations with real-time availability
- 💰 **Financial Management** - Revenue tracking, invoicing, and payment processing
- 👥 **Customer Management** - Customer profiles, history, and loyalty programs
- 🔧 **Maintenance Tracking** - Service schedules, repair history, and preventive maintenance
- 📊 **Business Intelligence** - Comprehensive reporting and analytics dashboards
- 👨‍💼 **Multi-Role Access** - Admin, Manager, Accountant, Mechanic, Receptionist roles
- 🔐 **Secure Authentication** - JWT-based authentication with role-based access control
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🐳 **Docker Ready** - Full containerization for easy deployment and scaling

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│         NEXUS PLATFORM (Control Plane)              │
│  • Service Discovery    • API Gateway               │
│  • Health Monitoring    • WebSocket Server          │
│  • SSH Source Access    • Config Sync               │
│                                                      │
│  Ports: 6000 (HTTP), 2222 (SSH), 6001 (WebSocket)  │
└────────────────┬────────────────────────────────────┘
                 │
                 │ Platform Orchestration
                 │
    ┌────────────┼────────────┐
    │            │             │
    ▼            ▼             ▼
┌────────┐  ┌─────────┐  ┌──────────┐
│PostgeSQL│  │  Redis  │  │  Baron   │
│  DB     │  │ Cache   │  │ Backend  │
│  5432   │  │  6379   │  │  5000    │
└────────┘  └─────────┘  └─────┬────┘
                                │
                                ▼
                          ┌──────────┐
                          │  Baron   │
                          │ Frontend │
                          │  3000    │
                          └──────────┘
```

### Technology Stack

#### Platform Layer
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 15+ (Platform metadata)
- **Cache:** Redis 7+
- **SSH Server:** SSH2 (Source code access)
- **WebSocket:** ws (Real-time communication)

#### Backend (Baron Business Logic)
- **Runtime:** Node.js 18+
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL 15+ (Business data)
- **ORM:** Prisma 5.9
- **Authentication:** JWT + bcrypt
- **Real-time:** Socket.io
- **Jobs:** node-cron

#### Frontend (Baron Client)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS
- **State:** React Context API
- **HTTP Client:** Axios
- **Icons:** Lucide React

#### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Logging:** Winston
- **Monitoring:** Health checks + Platform monitoring

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 or higher
- Docker Desktop (optional, for containerized deployment)
- Git

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/asif-mohamed/baron_on_Asif-platform.git
cd baron_on_Asif-platform

# Run master setup script (Windows)
.\master-setup.ps1

# Or for Linux/Mac
chmod +x master-setup.sh
./master-setup.sh
```

The master setup script will:
1. ✅ Validate platform folder structure
2. ✅ Deploy Docker infrastructure
3. ✅ Create all `.env` files from templates
4. ✅ Install dependencies
5. ✅ Run database migrations
6. ✅ Seed initial data
7. ✅ Start all services

### Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### 1. Install Dependencies

```bash
# Platform
cd platform
npm install
npx prisma generate

# Server
cd ../server
npm install
npx prisma generate

# Client
cd ../client
npm install
```

#### 2. Configure Environment

```bash
# Copy environment templates
cp platform/.env.example platform/.env
cp server/.env.example server/.env
cp .env.docker .env.docker

# Edit .env files with your configuration
```

#### 3. Setup Database

```bash
# Start PostgreSQL (or use Docker)
docker compose up -d postgres redis

# Run migrations
cd server
npx prisma migrate deploy

cd ../platform
npx prisma migrate deploy

# Seed data
cd ../server
npx ts-node src/seed.ts
```

#### 4. Start Services

```bash
# Terminal 1: Platform
cd platform
npm run dev

# Terminal 2: Backend
cd server
npm run dev

# Terminal 3: Frontend
cd client
npm run dev
```

</details>

### Docker Deployment

```bash
# Start all services in Docker
.\setup-docker.ps1

# Or manually
docker compose up -d --build
```

---

## 🌐 Access Points

After successful setup:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:5000/api | REST API endpoints |
| **Platform API** | http://localhost:6000 | Control plane API |
| **Platform Info** | http://localhost:6000/info | Platform details |
| **Platform SSH** | `ssh admin@localhost -p 2222` | Source code access |
| **WebSocket** | ws://localhost:6001 | Real-time updates |
| **PostgreSQL** | localhost:5432 | Database |
| **Redis** | localhost:6379 | Cache |

---

## 👤 Default Credentials

Default accounts created during seeding:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@baron.com | Admin123!@# |
| **Manager** | manager@baron.com | Manager123!@# |
| **Accountant** | accountant@baron.com | Accountant123!@# |
| **Mechanic** | mechanic@baron.com | Mechanic123!@# |
| **Receptionist** | receptionist@baron.com | Receptionist123!@# |

**⚠️ IMPORTANT:** Change these passwords immediately in production!

---

## 📂 Project Structure

```
baron_on_Nexus-platform/
├── platform/                  # Nexus Platform (Control Plane)
│   ├── src/
│   │   ├── controllers/       # Platform API controllers
│   │   ├── services/          # Background services
│   │   ├── middleware/        # Auth, logging, error handling
│   │   └── routes/            # API routes
│   ├── prisma/                # Platform database schema
│   └── Dockerfile             # Platform container
│
├── server/                    # Baron Backend
│   ├── src/
│   │   ├── controllers/       # Business logic controllers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, uploads, errors
│   │   ├── socket/            # WebSocket handlers
│   │   └── jobs/              # Scheduled jobs
│   ├── prisma/                # Baron database schema
│   └── Dockerfile             # Backend container
│
├── client/                    # Baron Frontend
│   ├── src/
│   │   ├── pages/             # React pages
│   │   ├── components/        # Reusable components
│   │   ├── context/           # React context
│   │   └── lib/               # Utilities
│   └── Dockerfile             # Frontend container (nginx)
│
├── baron_Docs/                # Complete documentation
├── legacy_BINs/               # Archived setup scripts
├── master-setup.ps1           # Automated setup script
├── setup-docker.ps1           # Docker deployment script
├── docker-compose.yml         # Multi-service orchestration
└── .env.docker                # Docker environment config
```

---

## 📚 Documentation

Comprehensive documentation available in `baron_Docs/`:

- **[MASTER_SETUP_GUIDE.md](baron_Docs/MASTER_SETUP_GUIDE.md)** - Complete setup documentation
- **[DOCKER_GUIDE.md](baron_Docs/DOCKER_GUIDE.md)** - Docker deployment guide
- **[PLATFORM_IMPLEMENTATION.md](baron_Docs/PLATFORM_IMPLEMENTATION.md)** - Platform architecture
- **[API_EXAMPLES.md](baron_Docs/API_EXAMPLES.md)** - API usage examples
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

# Run platform tests
cd platform
npm test
```

---

## 🐳 Docker Services

The Docker Compose setup includes:

- **baron-postgres** - PostgreSQL 15 (Platform + Baron databases)
- **baron-redis** - Redis 7 (Caching and sessions)
- **nexus-platform** - Platform control plane (Port 6000, 2222, 6001)
- **baron-backend** - Baron API server (Port 5000)
- **baron-frontend** - Baron client app (Port 3000)

---

## 🔄 Platform Features

### Service Discovery
- Automatic discovery of Baron backend on startup
- Health monitoring every 30 seconds
- Dynamic service registry updates

### API Routing
- Platform routes all API requests
- Load balancing support
- Request forwarding to appropriate services

### SSH Source Access
```bash
ssh admin@localhost -p 2222
# Password: Admin123!@#Platform

# Available commands:
ls                  # List files
cd <directory>      # Change directory
cat <file>          # View file
tree                # Directory tree
help                # Show help
exit                # Disconnect
```

---

## 📊 Business Modules

### Fleet Management
- Vehicle inventory and tracking
- Availability management
- Vehicle categorization
- Maintenance history

### Booking System
- Online reservations
- Real-time availability check
- Booking confirmation and tracking
- Customer booking history

### Financial Management
- Revenue tracking
- Invoice generation
- Payment processing
- Financial reporting

### Maintenance
- Service scheduling
- Repair tracking
- Parts inventory
- Maintenance alerts

### Reporting
- Business intelligence dashboards
- Revenue reports
- Fleet utilization
- Customer analytics

---

## 🛠️ Development

### Local Development

```bash
# Start platform in dev mode
cd platform
npm run dev

# Start backend in dev mode
cd server
npm run dev

# Start frontend in dev mode
cd client
npm run dev
```

### Building for Production

```bash
# Build platform
cd platform
npm run build

# Build backend
cd server
npm run build

# Build frontend
cd client
npm run build
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Update all passwords in `.env` files
- [ ] Change JWT secrets to strong random values
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Configure automated backups
- [ ] Review CORS settings
- [ ] Update SSH credentials
- [ ] Enable logging and monitoring
- [ ] Set up CI/CD pipeline
- [ ] Configure domain names

### Environment Variables

Critical environment variables to configure:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/baron_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key
PLATFORM_SECRET=shared-secret-for-platform

# Ports
BACKEND_PORT=5000
FRONTEND_PORT=3000
PLATFORM_PORT=6000
```

---

## 📦 Package Distribution

A clean deployment package is available:

```bash
# Download baron.zip from releases
# Extract and run
.\master-setup.ps1
```

---

## 🤝 Contributing

This is a proprietary project. Contributions are managed internally.

---

## 📄 License

**Proprietary License**

- **Platform Owner:** Asif Mohamed <a.mohamed121991@outlook.com>
- **Business Instance:** Baron Car Rental Management System
- **Platform:** Nexus Platform (Multi-tenant SaaS Infrastructure)

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use is strictly prohibited.

---

## 🆘 Support

For issues or questions:
1. Check documentation in `baron_Docs/`
2. Review `master-setup.log` for setup issues
3. Verify all services are running: `docker compose ps`
4. Check service logs: `docker compose logs <service>`

---

## 🎯 Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics with AI insights
- [ ] Multi-location support
- [ ] Integration with payment gateways
- [ ] Customer mobile app
- [ ] Real-time GPS tracking
- [ ] Automated pricing optimization
- [ ] Multi-language support

---

## 📞 Contact

**Platform Owner:** Asif  
**GitHub:** [@asif-mohamed](https://github.com/asif-mohamed)  
**Repository:** [baron_on_Asif-platform](https://github.com/asif-mohamed/baron_on_Asif-platform)

---

## ⭐ Acknowledgments

Built with modern technologies and best practices:
- React, TypeScript, Node.js, Express
- PostgreSQL, Prisma, Redis
- Docker, Docker Compose
- Tailwind CSS, Vite
- JWT, bcrypt, Winston

---

**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Last Updated:** November 16, 2025
