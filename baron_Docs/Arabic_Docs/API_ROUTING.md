# معمارية توجيه API - منصة نيكسس

**مالك المنصة:** عاصف محمد <a.mohamed121991@outlook.com>  
**التاريخ:** 16 نوفمبر 2025

---

## 🏗️ نظرة عامة على المعمارية

```
┌────────────────────────────────────────────────────┐
│          منصة نيكسس (المنفذ 6000)                  │
│  - Platform API (إدارة المستأجرين والتنسيق)       │
│  - خادم SSH (الوصول إلى كود المنصة)              │
│  - خادم WebSocket (أحداث المنصة الفورية)         │
└────────────────────────────────────────────────────┘
                       ↓ ينسق
┌────────────────────────────────────────────────────┐
│           خادم البارون الخلفي (المنفذ 5000)         │
│  - REST API (/api/*)                              │
│  - ملفات ثابتة (/uploads/*)                       │
│  - WebSocket (Socket.IO للتحديثات الفورية)       │
└────────────────────────────────────────────────────┘
                       ↑ طلبات
┌────────────────────────────────────────────────────┐
│          واجهة البارون الأمامية (المنفذ 5173)      │
│  - تطبيق React                                    │
│  - خادم Vite التطويري (مع proxy)                  │
│  - نسخة الإنتاج (يتم تقديمها بواسطة Nginx/CDN)   │
└────────────────────────────────────────────────────┘
```

---

## 🔄 تدفق الطلبات

### وضع التطوير (Development Mode)

**مع Vite Proxy:**

```
طلب من الواجهة → Vite Proxy → الخادم الخلفي → الاستجابة
   (المنفذ 5173)    (localhost)   (المنفذ 5000)

مثال:
  fetch('/api/customers')
    ↓
  Vite يوجه إلى http://localhost:5000/api/customers
    ↓
  الخادم الخلفي يعالج الطلب
    ↓
  الاستجابة تُرجع عبر الـ proxy
```

### وضع الإنتاج (Production Mode)

**استدعاءات API مباشرة:**

```
طلب من الواجهة → Backend API → الاستجابة
 (CDN/Nginx)       (VITE_API_URL)

مثال:
  fetch('http://api.baron.com/api/customers')
    ↓
  الخادم الخلفي يعالج الطلب
    ↓
  استجابة مباشرة
```

---

## 📁 توجيه تحميل الملفات

### تقديم الملفات الثابتة

**إعداد الخادم الخلفي:**

```typescript
// server/src/index.ts
app.use('/uploads', express.static('uploads'));
```

يقدم الملفات من مجلد `uploads/` على المسار `/uploads`

### منطق التحميل في الواجهة

```typescript
const isDevelopment = import.meta.env.DEV;
const apiBaseUrl = isDevelopment ? '' : getApiBaseUrl();

// في التطوير: fetch('/uploads/customers/file.pdf') 
//   → يُوجه إلى localhost:5000 عبر proxy

// في الإنتاج: fetch('http://api.baron.com/uploads/customers/file.pdf')
const response = await fetch(`${apiBaseUrl}${doc.url}`);
```

---

## ⚙️ إعداد Vite Proxy

**الملف:** `client/vite.config.ts`

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

**ما الذي يُوجه:**
- `/api/*` → `http://localhost:5000/api/*`
- `/uploads/*` → `http://localhost:5000/uploads/*`
- `/socket.io` → اتصال WebSocket

---

## 🌍 متغيرات البيئة

### متغيرات الواجهة الأمامية

**الملف:** `client/.env`

```bash
# عنوان URL للخادم الخلفي
VITE_API_URL=http://localhost:5000

# عنوان URL لـ WebSocket
VITE_WS_URL=ws://localhost:5000

# عنوان URL للمنصة
VITE_PLATFORM_API_URL=http://localhost:6000
```

### دعم TypeScript

**الملف:** `client/src/vite-env.d.ts`

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

---

## 🔧 دوال مساعدة API

### عميل API الأساسي

**الملف:** `client/src/lib/api.ts`

```typescript
import axios from 'axios';

// الحصول على عنوان API من متغير البيئة
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة رمز التوثيق إلى الطلبات
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// تصدير عنوان API الأساسي للوصول إلى الملفات الثابتة
export const getApiBaseUrl = () => API_BASE_URL;

export default api;
```

### الاستخدام في المكونات

```typescript
import api, { getApiBaseUrl } from '../lib/api';

// لاستدعاءات API
const response = await api.get('/customers');

// لتحميل الملفات الثابتة
const apiBaseUrl = getApiBaseUrl();
const fileUrl = `${apiBaseUrl}/uploads/customers/document.pdf`;
```

---

## 🔐 تدفق التوثيق

### إدارة الرموز

```
1. تسجيل دخول المستخدم
   ↓
2. POST /api/auth/login
   ↓
3. الخادم الخلفي يتحقق من البيانات
   ↓
4. يُرجع رمز JWT
   ↓
5. الواجهة الأمامية تُخزن في localStorage
   ↓
6. جميع الطلبات اللاحقة تتضمن الرمز في Authorization header
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

### Response Interceptor (تسجيل خروج تلقائي)

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

## 📦 سيناريوهات النشر

### التطوير المحلي

```bash
# تشغيل الخدمات
cd server && npm run dev    # المنفذ 5000
cd client && npm run dev    # المنفذ 5173
cd platform && npm run dev  # المنفذ 6000

# الواجهة الأمامية تستخدم Vite proxy
# جميع الطلبات إلى /api/* و /uploads/* تُوجه إلى localhost:5000
```

### نشر Docker

**متغيرات البيئة:**
```bash
VITE_API_URL=http://backend:5000
VITE_PLATFORM_API_URL=http://platform:6000
```

### نشر الإنتاج

```bash
# الواجهة الأمامية تُبنى كملفات ثابتة
cd client && npm run build

# تُقدم بواسطة Nginx/CDN
# استدعاءات API تذهب مباشرة إلى عنوان الخادم الخلفي
```

**متغيرات البيئة:**
```bash
VITE_API_URL=https://api.baron.com
VITE_PLATFORM_API_URL=https://platform.baron.com
```

---

## 🧪 اختبار التوجيه

### اختبار اتصال API

```typescript
// في console المتصفح
const response = await fetch('/api/health');
const data = await response.json();
console.log(data); // { status: 'ok', timestamp: '...' }
```

### اختبار تحميل الملفات

```typescript
// في console المتصفح
const token = localStorage.getItem('token');
const response = await fetch('/uploads/customers/sample-id-1.pdf', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
console.log('حجم الملف:', blob.size);
```

---

## 🚨 المشاكل الشائعة والحلول

### مشكلة: أخطاء CORS

**الأعراض:** المتصفح يعرض أخطاء CORS policy

**الحل:**
```typescript
// server/src/index.ts
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### مشكلة: 404 على الملفات الثابتة

**الأعراض:** `/uploads/...` يُرجع 404

**الحلول:**

1. تحقق من تقديم الملفات الثابتة:
   ```typescript
   app.use('/uploads', express.static('uploads'));
   ```

2. تحقق من إعداد Vite proxy:
   ```typescript
   '/uploads': {
     target: 'http://localhost:5000',
     changeOrigin: true,
   }
   ```

3. تحقق من وجود الملفات:
   ```bash
   ls -R server/uploads/
   ```

### مشكلة: Unauthorized (401)

**الأعراض:** API يُرجع أخطاء 401

**الحلول:**

1. تحقق من وجود الرمز:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```

2. تحقق من Authorization header:
   ```javascript
   // يجب أن يكون: Bearer <token>
   ```

3. تحقق من انتهاء صلاحية الرمز (JWT الافتراضي: 24 ساعة)

---

## 📊 أمثلة الطلبات والاستجابات

### طلب قائمة العملاء

```http
GET /api/customers HTTP/1.1
Host: localhost:5173
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**يُوجه إلى:**
```http
GET /api/customers HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**الاستجابة:**
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

### طلب تحميل ملف

```http
GET /uploads/customers/sample-id-1.pdf HTTP/1.1
Host: localhost:5173
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**يُوجه إلى:**
```http
GET /uploads/customers/sample-id-1.pdf HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**الاستجابة:**
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 1234

%PDF-1.4
...
```

---

## 🎯 أفضل الممارسات

### 1. استخدم دائماً متغيرات البيئة

❌ **خطأ:**
```typescript
const apiUrl = 'http://localhost:5000';
```

✅ **صحيح:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### 2. استخدم عناوين URL نسبية في التطوير

❌ **خطأ:**
```typescript
fetch('http://localhost:5000/api/customers')
```

✅ **صحيح:**
```typescript
fetch('/api/customers') // يُوجه بواسطة Vite
```

### 3. مركز إعداد API

❌ **خطأ:**
```typescript
// استدعاءات axios متفرقة
axios.get('http://localhost:5000/api/customers')
```

✅ **صحيح:**
```typescript
// استخدم مثيل api المركزي
import api from '../lib/api';
api.get('/customers')
```

### 4. تعامل مع التطوير والإنتاج

✅ **صحيح:**
```typescript
const isDevelopment = import.meta.env.DEV;
const apiBaseUrl = isDevelopment ? '' : getApiBaseUrl();
```

---

## 📚 وثائق ذات صلة

- [دليل التثبيت](./INSTALLATION_GUIDE.md) - تعليمات الإعداد
- [بيانات الاعتماد](./CREDENTIALS.md) - معلومات تسجيل الدخول
- [أمثلة API](./API_EXAMPLES.md) - أمثلة استخدام APIs

---

**مالك المنصة:** عاصف محمد  
**البريد الإلكتروني:** a.mohamed121991@outlook.com  
**المستودع:** [baron_on_Nexus-Platform](https://github.com/asif-mohamed/baron_on_Nexus-Platform)

---

**آخر تحديث:** 16 نوفمبر 2025  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للإنتاج
