# API Documentation Examples

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@baron.local",
  "password": "Admin123!"
}

Response:
{
  "user": {
    "id": "...",
    "email": "admin@baron.local",
    "fullName": "مدير النظام",
    "role": "Admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}

Response:
{
  "user": {
    "id": "...",
    "email": "admin@baron.local",
    "fullName": "مدير النظام",
    "role": {
      "id": "...",
      "name": "Admin",
      "description": "Full system access"
    }
  }
}
```

## Cars

### Get Available Cars
```http
GET /api/cars/available?startDate=2024-11-15&endDate=2024-11-20
Authorization: Bearer {token}

Response:
{
  "cars": [
    {
      "id": "...",
      "brand": "تويوتا",
      "model": "كامري",
      "year": 2023,
      "plateNumber": "أ ب ج 1234",
      "dailyRate": 200,
      "category": "sedan"
    }
  ]
}
```

### Create Car
```http
POST /api/cars
Authorization: Bearer {token}
Content-Type: application/json

{
  "brand": "هيونداي",
  "model": "سوناتا",
  "year": 2024,
  "plateNumber": "س ص ع 9999",
  "color": "أبيض",
  "dailyRate": 220,
  "mileage": 0,
  "status": "available",
  "condition": "excellent",
  "fuelType": "petrol",
  "transmission": "automatic",
  "seats": 5,
  "category": "sedan"
}

Response:
{
  "car": { ...car object }
}
```

## Bookings

### Check Availability
```http
POST /api/bookings/check-availability
Authorization: Bearer {token}
Content-Type: application/json

{
  "carId": "car-uuid",
  "startDate": "2024-11-15T00:00:00Z",
  "endDate": "2024-11-20T00:00:00Z"
}

Response:
{
  "available": true,
  "conflicts": []
}
```

### Create Booking
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "carId": "car-uuid",
  "customerId": "customer-uuid",
  "startDate": "2024-11-15T00:00:00Z",
  "endDate": "2024-11-20T00:00:00Z",
  "dailyRate": 200,
  "extras": 50,
  "taxes": 37.5,
  "discount": 0,
  "notes": "ملاحظات الحجز"
}

Response:
{
  "booking": {
    "id": "...",
    "bookingNumber": "BK-202411-001234",
    "carId": "...",
    "customerId": "...",
    "startDate": "2024-11-15T00:00:00.000Z",
    "endDate": "2024-11-20T00:00:00.000Z",
    "totalDays": 5,
    "dailyRate": 200,
    "subtotal": 1000,
    "extras": 50,
    "taxes": 37.5,
    "discount": 0,
    "totalAmount": 1087.5,
    "paidAmount": 0,
    "status": "confirmed",
    "car": { ...car object },
    "customer": { ...customer object }
  }
}
```

### Pickup Booking
```http
PATCH /api/bookings/{id}/pickup
Authorization: Bearer {token}

Response:
{
  "booking": {
    ...booking object with status: "active", pickupDate set
  }
}
```

### Return Booking
```http
PATCH /api/bookings/{id}/return
Authorization: Bearer {token}
Content-Type: application/json

{
  "mileage": 15500
}

Response:
{
  "booking": {
    ...booking object with status: "completed", returnDate set
  }
}
```

## Customers

### Search Customers
```http
GET /api/customers/search?q=أحمد
Authorization: Bearer {token}

Response:
{
  "customers": [
    {
      "id": "...",
      "fullName": "أحمد محمد السعيد",
      "phone": "+966501111111",
      "email": "ahmed.mohammed@example.com"
    }
  ]
}
```

### Create Customer
```http
POST /api/customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "علي أحمد الغامدي",
  "email": "ali@example.com",
  "phone": "+966505555555",
  "address": "الرياض، حي النخيل",
  "licenseNumber": "L123456",
  "licenseExpiry": "2026-12-31T00:00:00Z",
  "nationalId": "1234567890"
}

Response:
{
  "customer": { ...customer object }
}
```

## Transactions

### Create Transaction
```http
POST /api/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingId": "booking-uuid",
  "type": "payment",
  "category": "rental",
  "amount": 500,
  "paymentMethod": "cash",
  "description": "دفعة مقدمة"
}

Response:
{
  "transaction": {
    "id": "...",
    "amount": 500,
    "type": "payment",
    "category": "rental",
    "paymentMethod": "cash",
    "transactionDate": "2024-11-10T...",
    "booking": { ...booking object }
  }
}
```

## Maintenance

### Create Maintenance Record
```http
POST /api/maintenance
Authorization: Bearer {token}
Content-Type: application/json

{
  "carId": "car-uuid",
  "type": "routine",
  "description": "تغيير زيت وفلاتر",
  "cost": 350,
  "serviceDate": "2024-11-10T00:00:00Z",
  "nextServiceDate": "2025-02-10T00:00:00Z",
  "status": "completed"
}

Response:
{
  "record": { ...maintenance record object }
}
```

## Reports

### Dashboard Stats
```http
GET /api/reports/dashboard
Authorization: Bearer {token}

Response:
{
  "stats": {
    "fleet": {
      "total": 15,
      "available": 8,
      "rented": 5,
      "maintenance": 2
    },
    "customers": 45,
    "bookings": {
      "active": 5,
      "today": 2
    },
    "revenue": {
      "month": 125000
    }
  }
}
```

### Revenue Report
```http
GET /api/reports/revenue?startDate=2024-11-01&endDate=2024-11-30
Authorization: Bearer {token}

Response:
{
  "transactions": [
    {
      "id": "...",
      "amount": 500,
      "type": "payment",
      "transactionDate": "2024-11-05T...",
      ...
    }
  ]
}
```

### Export Report
```http
POST /api/reports/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "bookings",
  "startDate": "2024-11-01",
  "endDate": "2024-11-30"
}

Response:
{
  "data": [ ...array of booking records ]
}
```

## File Attachments

### Upload File
```http
POST /api/attachments/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: (binary file)
- entityType: "car"
- entityId: "car-uuid"

Response:
{
  "attachment": {
    "id": "...",
    "fileName": "1234567890-document.pdf",
    "originalName": "document.pdf",
    "fileSize": 125000,
    "mimeType": "application/pdf",
    "filePath": "uploads/1234567890-document.pdf"
  }
}
```

### Download File
```http
GET /api/attachments/download/{attachment-id}
Authorization: Bearer {token}

Response: Binary file download
```

## WebSocket Events

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected');
});
```

### Listen for Events
```javascript
// New booking created
socket.on('booking:created', (booking) => {
  console.log('New booking:', booking);
});

// Vehicle picked up
socket.on('booking:pickup', (booking) => {
  console.log('Pickup:', booking);
});

// Overdue booking
socket.on('booking:overdue', (booking) => {
  console.log('Overdue:', booking);
});

// Pickup due today
socket.on('booking:pickup_due', (booking) => {
  console.log('Pickup due:', booking);
});

// Maintenance required
socket.on('maintenance:due', (car) => {
  console.log('Maintenance due:', car);
});
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error"
}
```
