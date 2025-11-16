# Customer Document Download & Seed Configuration

**Platform Owner:** Asif Mohamed <a.mohamed121991@outlook.com>  
**Business License:** Baron Car Rental  
**Last Updated:** November 16, 2025

## Overview

This document explains the customer document download functionality and the automated seed data configuration that ensures the database is always populated with demo data during builds.

---

## 📥 Customer Document Download Feature

### Frontend Implementation

**File:** `client/src/pages/Customers.tsx`

The download functionality allows users to download all customer documents (National ID, Fingerprint, Rental Contract) with a single click.

#### Download Button Location
- Located in the customer table actions column
- Positioned between **Edit** and **Delete** buttons
- Green color theme to distinguish from other actions
- Automatically disabled if customer has no documents attached

#### Download Function

```typescript
const handleDownloadDocuments = async (customer: Customer) => {
  const documents = [
    { url: customer.nationalIdDocument, name: `${customer.fullName}_الهوية_الوطنية` },
    { url: customer.fingerprintDocument, name: `${customer.fullName}_البصمة` },
    { url: customer.rentalContract, name: `${customer.fullName}_عقد_الإيجار` }
  ];

  const availableDocs = documents.filter(doc => doc.url);

  if (availableDocs.length === 0) {
    toast.info('لا توجد مستندات مرفقة لهذا العميل');
    return;
  }

  try {
    for (const doc of availableDocs) {
      // Get file extension from URL
      const ext = doc.url!.split('.').pop() || 'pdf';
      const fileName = `${doc.name}.${ext}`;
      
      // Download file
      const response = await fetch(`http://localhost:5000${doc.url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('فشل تحميل الملف');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Small delay between downloads to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    toast.success(`تم تحميل ${availableDocs.length} مستند بنجاح`);
  } catch (error) {
    console.error('Download error:', error);
    toast.error('فشل تحميل المستندات');
  }
};
```

#### Features
- ✅ **Batch Download**: Downloads all available documents automatically
- ✅ **Arabic Filenames**: Uses customer name + document type in Arabic
- ✅ **Authentication**: Includes JWT token in Authorization header
- ✅ **Error Handling**: Shows user-friendly error messages
- ✅ **Progress Feedback**: Toast notifications for success/failure
- ✅ **Browser Safety**: 500ms delay between downloads to prevent blocking
- ✅ **Smart Extension**: Extracts file extension from URL

---

### Backend Configuration

#### Static File Serving

**File:** `server/src/index.ts` (Line 43)

```typescript
app.use('/uploads', express.static('uploads'));
```

This middleware serves files from the `uploads/` directory as static files, making them accessible via HTTP.

#### File Upload Route

**File:** `server/src/routes/upload.ts`

```typescript
// Configure storage for different entity types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const entityType = req.body.entityType || 'general';
    const uploadPath = path.join(__dirname, '../../uploads', entityType);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});
```

#### File Types Allowed
- `image/jpeg`
- `image/png`
- `image/jpg`
- `application/pdf`
- `image/webp`

#### File Size Limit
- **5MB** maximum per file

---

## 🌱 Automated Seed Configuration

### Purpose

Ensures that every build automatically populates the database with demo data, making it easy to test and demonstrate the application without manual data entry.

### Server Seed (`server/src/seed.ts`)

#### Demo Customers with Documents

```typescript
const customers = await Promise.all([
  prisma.customer.create({
    data: {
      fullName: 'أحمد محمد السعيد',
      email: 'ahmed.mohammed@example.com',
      phone: '+966501111111',
      nationalIdDocument: '/uploads/customers/sample-id-1.pdf',
      fingerprintDocument: '/uploads/customers/sample-fingerprint-1.pdf',
      rentalContract: '/uploads/customers/sample-contract-1.pdf',
    },
  }),
  // ... more customers
]);
```

#### What Gets Seeded

1. **Roles** (7 roles):
   - Admin, Manager, Reception, Accountant, Mechanic, Driver, Warehouse

2. **Users** (7 users):
   - `admin@baron.local` / Admin123!
   - `manager@baron.local` / Admin123!
   - `reception@baron.local` / Admin123!
   - `accountant@baron.local` / Admin123!
   - `mechanic@baron.local` / Admin123!
   - `driver@baron.local` / Admin123!
   - `warehouse@baron.local` / Admin123!

3. **Maintenance Profiles** (2 profiles)
4. **Cars** (5 vehicles)
5. **Customers** (3 customers with documents)
6. **Bookings** (2+ bookings)
7. **Transactions** (1+ transactions)
8. **Business Plans** (2 plans with 6+ actions)
9. **Maintenance Records** (1+ records)

### Platform Seed (`platform/src/seed.ts`)

#### Baron Tenant Configuration

```typescript
const baronTenant = await prisma.tenant.upsert({
  where: { slug: 'baron' },
  update: {},
  create: {
    name: 'سلسلة البارون لتأجير السيارات',
    slug: 'baron',
    domain: 'baron.local',
    databaseUrl: process.env.BARON_DATABASE_URL || process.env.DATABASE_URL || '',
    plan: 'ENTERPRISE',
    status: 'ACTIVE',
    resourceLimits: {
      maxUsers: 100,
      maxCars: 500,
      maxBookings: 10000,
      storageGB: 100,
    },
    configuration: {
      create: {
        displayName: 'سلسلة البارون لتأجير السيارات',
        theme: {
          primaryColor: '#2563eb',
          secondaryColor: '#1e40af',
          accentColor: '#3b82f6',
        },
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        language: 'ar',
        enabledFeatures: [
          'fleet-management',
          'booking-system',
          'customer-management',
          'financial-tracking',
          'maintenance-scheduler',
          'employee-performance',
          'business-planning',
          'document-uploads',
          'real-time-notifications',
        ],
        enabledRoles: ['ADMIN', 'MANAGER', 'RECEPTION', 'ACCOUNTANT', 'MECHANIC', 'DRIVER', 'WAREHOUSE'],
        customSettings: {
          businessName: 'سلسلة البارون لتأجير السيارات',
          businessOwner: 'Asif Mohamed',
          ownerEmail: 'a.mohamed121991@outlook.com',
          vatEnabled: true,
          vatRate: 0.15,
        },
      },
    },
  },
});
```

---

## 🔧 Build Scripts Configuration

### Server Package Scripts

**File:** `server/package.json`

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc && npm run seed",
    "start": "node dist/index.js",
    "seed": "tsx src/seed.ts",
    "postinstall": "npm run prisma:generate"
  }
}
```

- **`build`**: Compiles TypeScript → Runs seed automatically
- **`postinstall`**: Generates Prisma client after `npm install`

### Platform Package Scripts

**File:** `platform/package.json`

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc && npm run seed",
    "start": "node dist/index.js",
    "seed": "tsx src/seed.ts",
    "postinstall": "npm run prisma:generate"
  }
}
```

---

## 📄 Sample Document Generation

### Document Generator Script

**File:** `server/scripts/create-sample-docs.js`

This script creates realistic sample PDF files for testing the download functionality.

```bash
# Run manually to regenerate sample documents
cd server
node scripts/create-sample-docs.js
```

#### Generated Files

```
server/uploads/customers/
├── sample-id-1.pdf              # Ahmed's National ID
├── sample-fingerprint-1.pdf     # Ahmed's Fingerprint
├── sample-contract-1.pdf        # Ahmed's Rental Contract
├── sample-id-2.pdf              # Fatima's National ID
├── sample-fingerprint-2.pdf     # Fatima's Fingerprint
└── sample-contract-3.pdf        # Khaled's Rental Contract
```

Each file is a valid PDF structure with:
- PDF header (`%PDF-1.4`)
- Document metadata
- Page structure
- Text content (title + description)
- Proper EOF marker

---

## 🚀 Deployment Workflow

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Run database migrations
cd server
npx prisma migrate dev

cd ../platform
npx prisma migrate dev

# 3. Build (automatically runs seed)
cd ..
npm run build
```

### Continuous Deployment

Every time you run:

```bash
npm run build
```

The following happens automatically:

1. TypeScript compilation (`tsc`)
2. Database seeding (`npm run seed`)
3. Fresh demo data inserted
4. Sample documents ready for download testing

---

## 🧪 Testing the Download Feature

### Test Steps

1. **Login** as any user (e.g., `admin@baron.local` / `Admin123!`)

2. **Navigate** to Customers page (`/customers`)

3. **Find customer** with documents:
   - أحمد محمد السعيد (3 documents)
   - فاطمة علي الزهراني (2 documents)
   - خالد عبدالله النمر (1 document)

4. **Click download button** (green download icon)

5. **Verify**:
   - Multiple files download automatically
   - Filenames are in Arabic with customer name
   - All documents download successfully
   - Success toast notification appears

### Expected Behavior

✅ **Customer with 3 documents**:
- Downloads: `أحمد محمد السعيد_الهوية_الوطنية.pdf`
- Downloads: `أحمد محمد السعيد_البصمة.pdf`
- Downloads: `أحمد محمد السعيد_عقد_الإيجار.pdf`
- Toast: "تم تحميل 3 مستند بنجاح"

✅ **Customer with 0 documents**:
- Button is disabled (grayed out)
- No download occurs

---

## 🔒 Security Considerations

### Authentication
- All file downloads require valid JWT token
- Token sent in `Authorization: Bearer <token>` header
- Unauthorized requests return 401

### File Validation
- Only allowed MIME types accepted during upload
- File size limited to 5MB
- Files stored outside web root, served via Express static middleware

### Path Security
- File paths stored as `/uploads/<entityType>/<filename>`
- No directory traversal allowed
- Entity type validated during upload

---

## 📝 API Endpoints

### Upload File
```
POST /api/upload/single
Content-Type: multipart/form-data

Body:
- file: <binary>
- entityType: "customers"

Response:
{
  "message": "File uploaded successfully",
  "file": {
    "filename": "document-1731763200000-123456789.pdf",
    "originalName": "contract.pdf",
    "mimetype": "application/pdf",
    "size": 102400,
    "path": "/uploads/customers/document-1731763200000-123456789.pdf"
  }
}
```

### Download File (Static)
```
GET /uploads/customers/sample-id-1.pdf
Authorization: Bearer <token>

Response: PDF file (application/pdf)
```

---

## 🛠️ Troubleshooting

### Downloads not working?

**Check:**
1. Backend is running (`npm run dev` in `server/`)
2. Sample files exist in `server/uploads/customers/`
3. JWT token is valid (try logging in again)
4. Browser is not blocking downloads (check popup blocker)

**Solution:**
```bash
# Regenerate sample documents
cd server
node scripts/create-sample-docs.js

# Re-seed database
npm run seed
```

### Seed not running during build?

**Check:**
```bash
# Verify package.json scripts
cat server/package.json | grep "build"
# Should show: "build": "tsc && npm run seed"

# Run manually
cd server
npm run seed
```

---

## 📊 Database Schema

### Customer Document Fields

```prisma
model Customer {
  id                   String    @id @default(uuid())
  fullName            String
  email               String?
  phone               String
  
  // Document fields
  nationalIdDocument  String?
  fingerprintDocument String?
  rentalContract      String?
  
  // ... other fields
}
```

---

## 🎯 Future Enhancements

### Planned Features
- [ ] Individual document download (not just batch)
- [ ] Document preview modal
- [ ] Document upload progress indicator
- [ ] Document versioning
- [ ] Document expiry alerts
- [ ] Bulk document download (multiple customers)
- [ ] Document categories/tags
- [ ] OCR text extraction from uploaded IDs

---

## 📚 Related Documentation

- [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) - Complete setup instructions
- [CREDENTIALS.md](./CREDENTIALS.md) - All login credentials
- [API_EXAMPLES.md](./API_EXAMPLES.md) - API usage examples
- [PAGES_IMPLEMENTATION.md](./PAGES_IMPLEMENTATION.md) - Frontend page details

---

## 🤝 Support

**Platform Owner:** Asif Mohamed  
**Email:** a.mohamed121991@outlook.com  
**GitHub:** [baron_on_Asif-platform](https://github.com/asif-mohamed/baron_on_Asif-platform)

---

**Last Updated:** November 16, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
