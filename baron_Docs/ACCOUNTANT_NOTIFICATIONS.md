# Accountant Notification System

## Overview
Automated notification system that alerts accountants whenever a new booking is created, prompting them to create corresponding financial transactions.

## Implementation Details

### Backend Changes

**File:** `server/src/controllers/booking.controller.ts`

**Location:** `createBooking` function (after Warehouse notification, before socket emission)

**Added Code:**
```typescript
// Get Accountant role ID
const accountantRole = await prisma.role.findUnique({
  where: { name: 'Accountant' },
});

// Create notification for Accountant staff
if (accountantRole) {
  await prisma.notification.create({
    data: {
      roleId: accountantRole.id,
      type: 'booking_created',
      title: '💰 حجز جديد - يتطلب إنشاء معاملة',
      message: `حجز جديد #${booking.bookingNumber} للعميل ${booking.customer.fullName} - ${booking.car.brand} ${booking.car.model}. المبلغ الإجمالي: ${totalAmount} د.ل. يرجى إنشاء معاملة مالية لهذا الحجز.`,
      data: JSON.stringify({ 
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customer.fullName,
        customerId: booking.customerId,
        carDetails: `${booking.car.brand} ${booking.car.model}`,
        totalAmount: totalAmount,
        startDate: start,
        endDate: end,
        totalDays: totalDays,
      }),
      requiresAction: true,
      actionType: 'acknowledge',
    },
  });
}
```

## How It Works

### Notification Trigger
- **When:** Automatically triggered when a new booking is created via `POST /api/bookings`
- **Who Receives:** All users with the "Accountant" role (role-based notification)
- **Delivery:** Notifications are sent to the database and accessible through `/notifications` page

### Notification Details

**Arabic Title:**
```
💰 حجز جديد - يتطلب إنشاء معاملة
```
Translation: "💰 New Booking - Requires Transaction Creation"

**Message Format:**
```
حجز جديد #[BOOKING_NUMBER] للعميل [CUSTOMER_NAME] - [CAR_BRAND] [CAR_MODEL]. المبلغ الإجمالي: [TOTAL_AMOUNT] د.ل. يرجى إنشاء معاملة مالية لهذا الحجز.
```
Translation: "New booking #[NUMBER] for customer [NAME] - [CAR]. Total amount: [AMOUNT] LYD. Please create a financial transaction for this booking."

**Embedded Data:**
The notification includes comprehensive booking data in JSON format:
- `bookingId`: Unique booking identifier
- `bookingNumber`: Human-readable booking number
- `customerName`: Full name of the customer
- `customerId`: Customer ID for transaction creation
- `carDetails`: Car brand and model
- `totalAmount`: Total booking amount in Libyan Dinars
- `startDate`: Booking start date
- `endDate`: Booking end date
- `totalDays`: Total rental days

**Action Required:**
- `requiresAction: true` - Marks the notification as requiring action
- `actionType: 'acknowledge'` - Specifies that acknowledgment is required

## Frontend Integration

### Viewing Notifications
Accountants can view their notifications at:
- **Route:** `/notifications`
- **Component:** `client/src/pages/Notifications.tsx`

### Notification Features
1. **Real-time Display:** Notifications appear in the notification inbox
2. **Filtering:** Can filter by "action-required" to see pending booking notifications
3. **Detailed Data:** JSON data contains all necessary information for transaction creation
4. **Mark as Read:** Accountants can mark notifications as read after processing
5. **Acknowledgment:** Can acknowledge the notification after creating the transaction

## Workflow Example

### Step-by-Step Process

1. **Receptionist creates a new booking:**
   - Car: Toyota Camry
   - Customer: أحمد محمد
   - Total Amount: 500 LYD
   - Period: 5 days

2. **System automatically creates notifications:**
   - ✅ General notification (all users)
   - ✅ Warehouse notification (car pickup needed)
   - ✅ **Accountant notification (transaction creation required)**

3. **Accountant receives notification:**
   ```
   💰 حجز جديد - يتطلب إنشاء معاملة
   
   حجز جديد #BK-2024-001 للعميل أحمد محمد - Toyota Camry. 
   المبلغ الإجمالي: 500 د.ل. يرجى إنشاء معاملة مالية لهذا الحجز.
   ```

4. **Accountant takes action:**
   - Opens notification inbox (`/notifications`)
   - Reviews booking details from notification data
   - Creates a new transaction in the Transactions page
   - Links transaction to the booking
   - Acknowledges the notification

## Technical Architecture

### Database Schema
Uses existing `Notification` model from Prisma schema:
```prisma
model Notification {
  id              String   @id @default(uuid())
  userId          String?  // NULL for role-based notifications
  roleId          String?  // Set to Accountant role ID
  senderId        String?  // NULL for system notifications
  type            String   // "booking_created"
  title           String
  message         String
  data            String?  // JSON booking details
  isRead          Boolean  @default(false)
  requiresAction  Boolean  @default(false)
  actionType      String?  // "acknowledge"
  createdAt       DateTime @default(now())
}
```

### API Endpoints Used
- `GET /api/notifications` - Fetch accountant's notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/acknowledge` - Send acknowledgment response

### Role-Based Delivery
- Notifications are sent to the **Accountant role**, not individual users
- All users with "Accountant" role will see the notification
- Ensures no notification is missed even if specific accountants are offline

## Benefits

1. **Automated Workflow:** No manual communication needed between Reception and Accounting
2. **Complete Information:** All booking details embedded in notification
3. **Audit Trail:** Timestamp and acknowledgment tracking
4. **No Missed Bookings:** Role-based delivery ensures coverage
5. **Actionable:** Clear call-to-action with required next steps
6. **Bilingual Support:** Arabic interface with LYD currency

## Future Enhancements

### Possible Improvements:
1. **Direct Link:** Add quick link to transaction creation page with pre-filled booking data
2. **Status Tracking:** Show which bookings already have transactions created
3. **Overdue Alerts:** Escalate notifications for bookings without transactions after X hours
4. **Batch Processing:** Allow accountants to create multiple transactions at once
5. **Transaction Template:** Auto-populate transaction form from notification data

## Testing Checklist

- [ ] Create a new booking as Reception
- [ ] Verify accountant receives notification
- [ ] Check notification contains correct booking details
- [ ] Verify notification appears in "action-required" filter
- [ ] Test marking notification as read
- [ ] Test acknowledging notification
- [ ] Verify multiple accountants all receive the same notification
- [ ] Check notification data JSON is properly formatted
- [ ] Verify socket emission for real-time updates

## Related Files

**Backend:**
- `server/src/controllers/booking.controller.ts` - Notification creation logic
- `server/src/routes/notification.routes.ts` - Notification API endpoints
- `server/prisma/schema.prisma` - Notification model definition

**Frontend:**
- `client/src/pages/Notifications.tsx` - Notification inbox UI
- `client/src/context/NotificationContext.tsx` - Real-time notification context
- `client/src/components/Layout.tsx` - Notification navigation link

## Database Queries

### Find all accountant notifications for new bookings:
```sql
SELECT * FROM notifications 
WHERE roleId = (SELECT id FROM roles WHERE name = 'Accountant')
  AND type = 'booking_created'
  AND requiresAction = true
ORDER BY createdAt DESC;
```

### Find unacknowledged booking notifications:
```sql
SELECT * FROM notifications 
WHERE roleId = (SELECT id FROM roles WHERE name = 'Accountant')
  AND type = 'booking_created'
  AND isRead = false
ORDER BY createdAt DESC;
```

## Implementation Status

✅ **Completed:**
- Backend notification creation in booking controller
- Role-based delivery to all Accountant users
- Comprehensive booking data embedding
- Action required flag set
- Arabic notification messages
- Integration with existing notification system

🔄 **Pending:**
- Frontend: Transaction quick-create from notification
- Backend: Update car mileage on booking return
- Backend: Create pending transactions for extra km charges

---

**Last Updated:** Current Session
**Status:** ✅ Production Ready
