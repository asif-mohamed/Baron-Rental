# Baron Platform - Default Credentials Guide

**Platform Owner:** Asif Mohamed <a.mohamed121991@outlook.com>  
**Last Updated:** November 16, 2025

---

## 🔐 Platform Admin Credentials

### SSH Server Access (Read-Only Source Code)

Access the platform source code via SSH for forking and local development:

```bash
ssh admin@localhost -p 2222
```

**Credentials:**
- **Username:** `admin`
- **Password:** `Admin123!@#Platform`

**Purpose:**
- Read-only access to platform source code
- Browse configuration files
- View logs and documentation
- Fork platform for customization

**Default Port:** `2222`

---

### Platform API Authentication

The Nexus Platform control plane API for service orchestration:

**Endpoint:** `http://localhost:6000`

**Credentials:**
- **Username:** `admin`
- **Password:** `Admin123!@#Platform`

**Key Endpoints:**
- `GET /health` - Platform health status
- `GET /info` - Platform information
- `POST /auth/login` - Platform admin authentication
- `GET /tenants` - List managed tenants
- `POST /config/sync` - Sync configuration

---

## 👥 Baron Application Credentials

### Admin Account

**Purpose:** Full system access, user management, all features

- **Email:** `admin@baron.local`
- **Password:** `Admin123!`
- **Role:** Admin

**Capabilities:**
- Complete fleet management
- User and employee management
- Financial oversight
- Business planning
- System configuration
- All reports and analytics

---

### Manager Account

**Purpose:** Operations management, fleet oversight, reporting

- **Email:** `manager@baron.local`
- **Password:** `Admin123!`
- **Role:** Manager

**Capabilities:**
- Fleet operations
- Booking management
- Employee performance tracking
- Business analytics
- Customer management

---

### Accountant Account

**Purpose:** Financial management and reporting

- **Email:** `accountant@baron.local`
- **Password:** `Admin123!`
- **Role:** Accountant

**Capabilities:**
- Transaction management
- Financial reports
- Revenue tracking
- Invoice generation
- Payment processing

---

### Mechanic Account

**Purpose:** Vehicle maintenance and repairs

- **Email:** `mechanic@baron.local`
- **Password:** `Admin123!`
- **Role:** Mechanic

**Capabilities:**
- Maintenance schedules
- Repair tracking
- Service history
- Parts management
- Vehicle status updates

---

### Receptionist Account

**Purpose:** Customer service and bookings

- **Email:** `receptionist@baron.local`
- **Password:** `Admin123!`
- **Role:** Reception

**Capabilities:**
- Customer registration
- Booking creation
- Rental processing
- Customer inquiries
- Daily operations

---

## 🌐 API Configuration

### Local Deployment

When running Baron locally, use localhost URLs:

**Platform API:**
```bash
PLATFORM_API_URL=http://localhost:6000
```

**Baron Backend:**
```bash
API_URL=http://localhost:5000
```

**Baron Frontend:**
```bash
VITE_API_URL=http://localhost:5000
```

---

### Production Deployment (Future)

When Nexus Platform subscription service is available:

**Platform API:**
```bash
PLATFORM_API_URL=https://api.nexusplatform.cloud
```

**Baron Backend:**
```bash
API_URL=https://api.yourdomain.com
```

**Baron Frontend:**
```bash
VITE_API_URL=https://api.yourdomain.com
```

> **Note:** Platform subscription API is still in development. Use localhost configuration for now.

---

## 🔒 Security Best Practices

### For Development

✅ **Current Setup (Development)**
- Default credentials provided for quick setup
- Localhost-only access
- No external exposure
- Suitable for testing and development

### For Production

⚠️ **CRITICAL - Before Production Deployment:**

1. **Change All Passwords**
   ```bash
   # Update in .env files
   ADMIN_PASSWORD=<strong-unique-password>
   JWT_SECRET=<cryptographically-secure-random-string>
   ```

2. **Update SSH Credentials**
   ```bash
   # platform/.env
   ADMIN_USERNAME=<your-admin-username>
   ADMIN_PASSWORD=<strong-ssh-password>
   ```

3. **Secure Database Credentials**
   ```bash
   # Use strong passwords for PostgreSQL
   DATABASE_URL="postgresql://<user>:<strong-password>@host:5432/db"
   ```

4. **Enable HTTPS**
   - Configure SSL certificates
   - Use reverse proxy (nginx/traefik)
   - Enforce HTTPS-only connections

5. **Update CORS Settings**
   ```typescript
   // Only allow your production domains
   origin: 'https://yourdomain.com'
   ```

6. **Change JWT Secrets**
   - Generate cryptographically secure random strings
   - Never commit production secrets to git

---

## 📊 Credential Summary Table

| Service | Type | Username/Email | Password | Port | Purpose |
|---------|------|----------------|----------|------|---------|
| **SSH Server** | Platform | `admin` | `Admin123!@#Platform` | 2222 | Source code access |
| **Platform API** | Platform | `admin` | `Admin123!@#Platform` | 6000 | Control plane |
| **Baron Admin** | Application | `admin@baron.local` | `Admin123!` | 5000 | Full system access |
| **Baron Manager** | Application | `manager@baron.local` | `Admin123!` | 5000 | Operations |
| **Baron Accountant** | Application | `accountant@baron.local` | `Admin123!` | 5000 | Finance |
| **Baron Mechanic** | Application | `mechanic@baron.local` | `Admin123!` | 5000 | Maintenance |
| **Baron Reception** | Application | `receptionist@baron.local` | `Admin123!` | 5000 | Customer service |

---

## 🚀 Quick Login Commands

### SSH to Platform
```bash
ssh admin@localhost -p 2222
# Password: Admin123!@#Platform
```

### Platform API Health Check
```bash
curl http://localhost:6000/health
```

### Baron Application Login
1. Open browser: `http://localhost:3000`
2. Email: `admin@baron.local`
3. Password: `Admin123!`

---

## 🔄 Password Reset

### Baron Application Users

Passwords are hashed using bcrypt. To reset:

```bash
cd server
npx ts-node -e "
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('NewPassword123!', 10);
console.log(hash);
"
```

Then update in database:
```sql
UPDATE users SET password = '<hashed-password>' WHERE email = 'admin@baron.local';
```

### Platform SSH/API

Update in `platform/.env`:
```bash
ADMIN_PASSWORD=YourNewPassword
```

Restart platform service:
```bash
docker compose restart platform
# or
cd platform && npm run dev
```

---

## ⚠️ Important Notes

1. **Development Only:** These credentials are for development and testing
2. **Change in Production:** Always change default credentials before production
3. **Git Security:** Never commit `.env` files with production credentials
4. **Access Control:** Restrict SSH and API access to authorized networks only
5. **Regular Updates:** Rotate credentials periodically for security

---

**Platform:** Nexus Platform  
**Owner:** Asif Mohamed <a.mohamed121991@outlook.com>  
**Repository:** https://github.com/asif-mohamed/baron_on_Asif-platform
