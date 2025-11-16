# دليل التثبيت الشامل - منصة نيكسس وتطبيق البارون

**مالك المنصة:** اصف محمد <a.mohamed121991@outlook.com>  
**الترخيص التجاري:** سلسلة البارون لتأجير السيارات  
**التاريخ:** 16 نوفمبر 2025

---

## 📋 نظرة عامة

هذا الدليل يشرح خطوة بخطوة كيفية تثبيت وإعداد منصة نيكسس (Nexus Platform) وتطبيق سلسلة البارون لتأجير السيارات على نظام التشغيل Windows.

---

## 🔧 متطلبات النظام

### البرامج المطلوبة

1. **Node.js** (الإصدار 18 أو أحدث)
   - تحميل من: https://nodejs.org/
   - تحقق من التثبيت: `node --version`

2. **PostgreSQL** (الإصدار 14 أو أحدث)
   - تحميل من: https://www.postgresql.org/download/
   - تحقق من التثبيت: `psql --version`

3. **Git** (لإدارة الإصدارات)
   - تحميل من: https://git-scm.com/
   - تحقق من التثبيت: `git --version`

4. **PowerShell** (مثبت مسبقاً على Windows)
   - الإصدار 5.1 أو أحدث

### متطلبات الأجهزة

- **المعالج:** رباعي النواة أو أفضل
- **الذاكرة:** 8 جيجابايت RAM كحد أدنى (16 جيجابايت موصى به)
- **المساحة:** 10 جيجابايت مساحة حرة على القرص
- **نظام التشغيل:** Windows 10/11 أو Windows Server 2019+

---

## 📥 تحميل الكود المصدري

### استنساخ المستودع من GitHub

```powershell
# انتقل إلى المجلد المطلوب
cd C:\Users\YourName\Desktop

# استنسخ المستودع
git clone https://github.com/asif-mohamed/baron_on_Nexus-Platform.git

# ادخل إلى مجلد المشروع
cd baron_on_Nexus-Platform
```

---

## 🗄️ إعداد قاعدة البيانات

### 1. تشغيل خادم PostgreSQL

```powershell
# تأكد من تشغيل خدمة PostgreSQL
Get-Service postgresql* | Start-Service
```

### 2. إنشاء قواعد البيانات

```powershell
# افتح PowerShell كمسؤول وقم بتشغيل السكريبت
.\setup-database.ps1
```

**أو يدوياً:**

```sql
-- اتصل بـ PostgreSQL
psql -U postgres

-- أنشئ قاعدة بيانات المنصة
CREATE DATABASE baron_platform;

-- أنشئ قاعدة بيانات التطبيق
CREATE DATABASE baron_app;

-- أنشئ مستخدم قاعدة البيانات
CREATE USER baron_user WITH PASSWORD 'YourSecurePassword123!';

-- امنح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE baron_platform TO baron_user;
GRANT ALL PRIVILEGES ON DATABASE baron_app TO baron_user;
```

---

## 🏗️ تثبيت منصة نيكسس (Platform)

### 1. الانتقال إلى مجلد المنصة

```powershell
cd platform
```

### 2. تثبيت الحزم

```powershell
npm install
```

### 3. إعداد متغيرات البيئة

```powershell
# انسخ ملف المثال
Copy-Item .env.example .env

# عدّل الملف حسب إعداداتك
notepad .env
```

**محتويات `.env`:**

```bash
# ============================================================================
# NEXUS PLATFORM - Environment Configuration
# Platform Owner: Asif Mohamed <a.mohamed121991@outlook.com>
# ============================================================================

# Platform Server
PLATFORM_PORT=6000
PLATFORM_HOST=localhost

# SSH Server
SSH_PORT=2222
SSH_HOST=0.0.0.0

# Platform Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!@#Platform

# Database
DATABASE_URL="postgresql://baron_user:YourPassword@localhost:5432/baron_platform"

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Platform Features
ENABLE_SSH_SERVER=true
ENABLE_WS_SERVER=true
```

### 4. تطبيق الترحيلات (Migrations)

```powershell
npx prisma migrate dev
```

### 5. توليد Prisma Client

```powershell
npx prisma generate
```

### 6. ملء قاعدة البيانات بالبيانات التجريبية

```powershell
npm run seed
```

### 7. بناء المشروع

```powershell
npm run build
```

### 8. تشغيل المنصة

```powershell
# للتطوير
npm run dev

# للإنتاج
npm start
```

**التحقق من التشغيل:**
- افتح المتصفح على: `http://localhost:6000`
- يجب أن ترى رسالة: "Nexus Platform is running"

---

## 🔙 تثبيت الخادم الخلفي (Backend)

### 1. فتح نافذة PowerShell جديدة

```powershell
cd C:\Users\YourName\Desktop\baron_on_Nexus-Platform\server
```

### 2. تثبيت الحزم

```powershell
npm install
```

### 3. إعداد متغيرات البيئة

```powershell
Copy-Item .env.example .env
notepad .env
```

**محتويات `.env`:**

```bash
# Database
DATABASE_URL="postgresql://baron_user:YourPassword@localhost:5432/baron_app"

# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Platform API
PLATFORM_API_URL=http://localhost:6000
```

### 4. تطبيق الترحيلات

```powershell
npx prisma migrate dev
```

### 5. توليد Prisma Client

```powershell
npx prisma generate
```

### 6. ملء قاعدة البيانات

```powershell
npm run seed
```

**البيانات المولدة:**
- 7 مستخدمين (أدوار مختلفة)
- 5 سيارات
- 3 عملاء (مع مستندات)
- حجوزات ومعاملات تجريبية

### 7. تشغيل الخادم

```powershell
# للتطوير
npm run dev

# للإنتاج
npm run build
npm start
```

**التحقق:**
- افتح: `http://localhost:5000/api/health`
- يجب أن ترى: `{"status":"ok","timestamp":"..."}`

---

## 🎨 تثبيت الواجهة الأمامية (Frontend)

### 1. فتح نافذة PowerShell جديدة

```powershell
cd C:\Users\YourName\Desktop\baron_on_Nexus-Platform\client
```

### 2. تثبيت الحزم

```powershell
npm install
```

### 3. إعداد متغيرات البيئة

```powershell
Copy-Item .env.example .env
notepad .env
```

**محتويات `.env`:**

```bash
# Baron Backend API URL
VITE_API_URL=http://localhost:5000

# Baron WebSocket URL
VITE_WS_URL=ws://localhost:5000

# Platform API URL
VITE_PLATFORM_API_URL=http://localhost:6000

# Application Name
VITE_APP_NAME=Baron Car Rental

# Platform Branding
VITE_PLATFORM_NAME=Nexus Platform
```

### 4. تشغيل الواجهة

```powershell
# للتطوير
npm run dev

# للإنتاج
npm run build
npm run preview
```

**التحقق:**
- افتح المتصفح على: `http://localhost:5173`
- يجب أن ترى صفحة تسجيل الدخول

---

## 🚀 التشغيل السريع (Master Setup)

### استخدام سكريبت master-setup.ps1

```powershell
# من مجلد المشروع الرئيسي
.\master-setup.ps1
```

**هذا السكريبت يقوم بـ:**
1. التحقق من تثبيت Node.js و PostgreSQL
2. إنشاء ملفات `.env` من `.env.example`
3. تثبيت حزم npm لجميع المشاريع
4. تطبيق الترحيلات
5. ملء قواعد البيانات
6. بناء المشاريع
7. إعطاء تعليمات التشغيل

---

## 🔐 بيانات الدخول الافتراضية

### منصة نيكسس (Platform)

**مدير المنصة:**
- SSH Username: `admin`
- SSH Password: `Admin123!@#Platform`
- SSH Port: `2222`

**Platform API:**
- Username: `admin`
- Password: `Admin123!@#Platform`
- API URL: `http://localhost:6000`

### تطبيق البارون

**جميع المستخدمين يستخدمون كلمة المرور:** `Admin123!`

| الدور | البريد الإلكتروني | الصلاحيات |
|-------|-------------------|-----------|
| مدير عام | admin@baron.local | كامل الصلاحيات |
| مدير | manager@baron.local | إدارة العمليات |
| استقبال | reception@baron.local | إدارة الحجوزات والعملاء |
| محاسب | accountant@baron.local | إدارة المالية |
| ميكانيكي | mechanic@baron.local | إدارة الصيانة |
| سائق | driver@baron.local | عرض الحجوزات |
| مستودع | warehouse@baron.local | إدارة المخزون |

---

## ✅ التحقق من التثبيت

### 1. فحص جميع الخدمات

```powershell
# تحقق من المنصة
curl http://localhost:6000

# تحقق من الخادم الخلفي
curl http://localhost:5000/api/health

# تحقق من الواجهة
# افتح المتصفح على http://localhost:5173
```

### 2. اختبار تسجيل الدخول

1. افتح `http://localhost:5173`
2. استخدم: `admin@baron.local` / `Admin123!`
3. يجب أن تُوجه إلى لوحة التحكم

### 3. اختبار API

```powershell
# احصل على قائمة السيارات (بعد تسجيل الدخول)
$token = "YOUR_JWT_TOKEN"
curl -H "Authorization: Bearer $token" http://localhost:5000/api/cars
```

---

## 🔧 حل المشاكل الشائعة

### المشكلة: فشل الاتصال بقاعدة البيانات

**الحل:**
```powershell
# تأكد من تشغيل PostgreSQL
Get-Service postgresql* | Start-Service

# تحقق من صحة DATABASE_URL في ملفات .env
```

### المشكلة: Port already in use

**الحل:**
```powershell
# ابحث عن العملية التي تستخدم المنفذ
netstat -ano | findstr :5000

# أوقف العملية
taskkill /PID [PID_NUMBER] /F
```

### المشكلة: npm install يفشل

**الحل:**
```powershell
# امسح الذاكرة المؤقتة
npm cache clean --force

# حاول مرة أخرى
npm install
```

### المشكلة: Prisma migration يفشل

**الحل:**
```powershell
# أعد تعيين قاعدة البيانات
npx prisma migrate reset

# طبق الترحيلات من جديد
npx prisma migrate dev
```

---

## 📚 الخطوات التالية

بعد التثبيت الناجح:

1. **راجع الوثائق:**
   - [بيانات الاعتماد](./CREDENTIALS.md) - معلومات الدخول الكاملة
   - [أمثلة API](./API_EXAMPLES.md) - كيفية استخدام APIs
   - [معمارية التوجيه](./API_ROUTING.md) - فهم تدفق البيانات

2. **استكشف التطبيق:**
   - جرب جميع الأدوار
   - أنشئ حجوزات جديدة
   - جرب ميزة تحميل المستندات

3. **التطوير:**
   - راجع [تطبيق الصفحات](./PAGES_IMPLEMENTATION.md)
   - اطلع على [ربط الواجهة](./FRONTEND_WIRING_STATUS.md)

---

## 📞 الدعم الفني

**مالك المنصة:** عاصف محمد  
**البريد الإلكتروني:** a.mohamed121991@outlook.com  
**المستودع:** [baron_on_Nexus-Platform](https://github.com/asif-mohamed/baron_on_Nexus-Platform)

---

**آخر تحديث:** 16 نوفمبر 2025  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للإنتاج
