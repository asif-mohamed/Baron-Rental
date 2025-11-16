# API Routing Architecture

**Platform Owner:** Asif Mohamed <a.mohamed121991@outlook.com>  
**Last Updated:** November 16, 2025

## Overview

This document explains how the Baron Car Rental application properly routes API requests through the Nexus Platform orchestration layer, ensuring a consistent stack flow between frontend, backend, and platform services.

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXUS PLATFORM (Port 6000)               │
│  - Platform API (tenant management, orchestration)          │
│  - SSH Server (platform code access)                        │
│  - WebSocket Server (real-time platform events)             │
└─────────────────────────────────────────────────────────────┘
                              ↓ orchestrates
┌─────────────────────────────────────────────────────────────┐
│                   BARON BACKEND (Port 5000)                 │
│  - REST API (/api/*)                                        │
│  - Static Files (/uploads/*)                                │
│  - WebSocket (Socket.IO for real-time updates)             │
└─────────────────────────────────────────────────────────────┘
                              ↑ requests
┌─────────────────────────────────────────────────────────────┐
│                   BARON FRONTEND (Port 5173)                │
│  - React Application                                        │
│  - Vite Dev Server (with proxy in development)             │
│  - Production Build (served by Nginx/CDN)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### Development Mode (with Vite Proxy)

```
Frontend Request → Vite Proxy → Backend → Response
   (Port 5173)    (localhost)   (Port 5000)

Example:
  fetch('/api/customers')
    ↓
  Vite proxies to http://localhost:5000/api/customers
    ↓
  Backend processes request
    ↓
  Response returns through proxy
```

### Production Mode (Direct API Calls)

```
Frontend Request → Backend API → Response
 (CDN/Nginx)       (VITE_API_URL)

Example:
  fetch('http://api.baron.com/api/customers')
    ↓
  Backend processes request
    ↓
  Direct response
```

---

## 📁 File Download Routing

### Static File Serving

**Backend Configuration** (`server/src/index.ts`):
```typescript
app.use('/uploads', express.static('uploads'));
```

This serves files from the `uploads/` directory at the `/uploads` route.

### Frontend Download Logic

**Development** (uses Vite proxy):
```typescript
const isDevelopment = import.meta.env.DEV;
const apiBaseUrl = isDevelopment ? '' : getApiBaseUrl();

// In dev: fetch('/uploads/customers/file.pdf') → proxied to localhost:5000
// In prod: fetch('http://api.baron.com/uploads/customers/file.pdf')
const response = await fetch(`${apiBaseUrl}${doc.url}`);
```

### Vite Proxy Configuration

**File:** `client/vite.config.ts`

```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
});
```

**What gets proxied:**
- `/api/*` → `http://localhost:5000/api/*`
- `/uploads/*` → `http://localhost:5000/uploads/*`
- `/socket.io` → WebSocket connection

---

## 🌍 Environment Configuration

### Client Environment Variables

**File:** `client/.env`

```bash
# Baron Backend API URL
VITE_API_URL=http://localhost:5000

# Baron WebSocket URL
VITE_WS_URL=ws://localhost:5000

# Platform API URL
VITE_PLATFORM_API_URL=http://localhost:6000
```

### TypeScript Support

**File:** `client/src/vite-env.d.ts`

```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_PLATFORM_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_PLATFORM_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

This enables TypeScript autocomplete and type checking for environment variables.

---

## 🔧 API Helper Functions

### Base API Client

**File:** `client/src/lib/api.ts`

```typescript
import axios from 'axios';

// Get API URL from environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export API base URL for static file access
export const getApiBaseUrl = () => API_BASE_URL;

export default api;
```

### Usage in Components

```typescript
import api, { getApiBaseUrl } from '../lib/api';

// For API calls
const response = await api.get('/customers');

// For static file downloads
const apiBaseUrl = getApiBaseUrl();
const fileUrl = `${apiBaseUrl}/uploads/customers/document.pdf`;
```

---

## 🔐 Authentication Flow

### Token Management

```
1. User Login
   ↓
2. POST /api/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Returns JWT token
   ↓
5. Frontend stores in localStorage
   ↓
6. All subsequent requests include token in Authorization header
```

### Request Interceptor

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor (Auto Logout)

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📦 Deployment Scenarios

### Local Development

```bash
# Start services
cd server && npm run dev    # Port 5000
cd client && npm run dev    # Port 5173
cd platform && npm run dev  # Port 6000

# Frontend uses Vite proxy
# All requests to /api/* and /uploads/* are proxied to localhost:5000
```

### Docker Deployment

```bash
# docker-compose.yml defines service networking
# Frontend → http://backend:5000/api
# Backend → http://platform:6000
```

**Environment:**
```bash
VITE_API_URL=http://backend:5000
VITE_PLATFORM_API_URL=http://platform:6000
```

### Production Deployment

```bash
# Frontend built as static files
cd client && npm run build

# Served by Nginx/CDN
# API calls go directly to backend URL
```

**Environment:**
```bash
VITE_API_URL=https://api.baron.com
VITE_PLATFORM_API_URL=https://platform.baron.com
```

---

## 🧪 Testing the Routing

### Test API Connection

```typescript
// In browser console
const response = await fetch('/api/health');
const data = await response.json();
console.log(data); // { status: 'ok', timestamp: '...' }
```

### Test File Download

```typescript
// In browser console
const token = localStorage.getItem('token');
const response = await fetch('/uploads/customers/sample-id-1.pdf', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
console.log('File size:', blob.size);
```

### Test WebSocket

```typescript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL);
socket.on('connect', () => {
  console.log('WebSocket connected!');
});
```

---

## 🚨 Common Issues & Solutions

### Issue: CORS Errors

**Symptom:** Browser shows CORS policy errors

**Solution:**
```typescript
// server/src/index.ts
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### Issue: 404 on Static Files

**Symptom:** `/uploads/...` returns 404

**Solutions:**
1. Check backend is serving static files:
   ```typescript
   app.use('/uploads', express.static('uploads'));
   ```

2. Check Vite proxy configuration:
   ```typescript
   '/uploads': {
     target: 'http://localhost:5000',
     changeOrigin: true,
   }
   ```

3. Verify files exist:
   ```bash
   ls -R server/uploads/
   ```

### Issue: Unauthorized (401)

**Symptom:** API returns 401 errors

**Solutions:**
1. Check token exists:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```

2. Verify Authorization header:
   ```javascript
   // Should be: Bearer <token>
   ```

3. Check token expiration (JWT default: 24h)

---

## 📊 Request/Response Examples

### Customer List Request

```http
GET /api/customers HTTP/1.1
Host: localhost:5173
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Proxied to:**
```http
GET /api/customers HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "fullName": "أحمد محمد السعيد",
      "nationalIdDocument": "/uploads/customers/sample-id-1.pdf",
      ...
    }
  ]
}
```

### File Download Request

```http
GET /uploads/customers/sample-id-1.pdf HTTP/1.1
Host: localhost:5173
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Proxied to:**
```http
GET /uploads/customers/sample-id-1.pdf HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 1234

%PDF-1.4
...
```

---

## 🎯 Best Practices

### 1. Always Use Environment Variables

❌ **Bad:**
```typescript
const apiUrl = 'http://localhost:5000';
```

✅ **Good:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### 2. Use Relative URLs in Development

❌ **Bad:**
```typescript
fetch('http://localhost:5000/api/customers')
```

✅ **Good:**
```typescript
fetch('/api/customers') // Proxied by Vite
```

### 3. Centralize API Configuration

❌ **Bad:**
```typescript
// Scattered axios calls
axios.get('http://localhost:5000/api/customers')
```

✅ **Good:**
```typescript
// Use centralized api instance
import api from '../lib/api';
api.get('/customers')
```

### 4. Handle Both Dev and Prod

✅ **Good:**
```typescript
const isDevelopment = import.meta.env.DEV;
const apiBaseUrl = isDevelopment ? '' : getApiBaseUrl();
```

---

## 📚 Related Documentation

- [DOWNLOAD_FEATURE.md](./DOWNLOAD_FEATURE.md) - Download functionality details
- [CREDENTIALS.md](./CREDENTIALS.md) - All login credentials
- [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) - Setup instructions

---

**Platform Owner:** Asif Mohamed  
**Email:** a.mohamed121991@outlook.com  
**Repository:** [baron_on_Asif-platform](https://github.com/asif-mohamed/baron_on_Asif-platform)

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready
