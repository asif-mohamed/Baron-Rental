# 🧪 Baron - Beta Testing Checklist

**Version**: 1.0.0-beta  
**Last Updated**: $(Get-Date)  
**Deployment Status**: Ready for Beta Testing

---

## 📋 Pre-Deployment Verification

### ✅ System Requirements
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ running (or SQLite configured)
- [ ] Git installed
- [ ] Minimum 4GB RAM available
- [ ] Port 5000 (backend) and 5173 (frontend) available

### ✅ Database Setup
- [ ] Database credentials configured in `.env`
- [ ] Prisma schema migrated (`npm run prisma:migrate`)
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Seed data loaded (`npm run seed`)
- [ ] Verify all 6 demo users created (Admin, Manager, Reception, Warehouse, Accountant, Mechanic)

### ✅ Backend Configuration
- [ ] `.env` file created in `server/` directory
- [ ] `JWT_SECRET` set (minimum 32 characters)
- [ ] `DATABASE_URL` configured correctly
- [ ] `CLIENT_URL` set to `http://localhost:5173` (dev) or production URL
- [ ] `UPLOAD_DIR` directory exists and has write permissions
- [ ] Dependencies installed (`npm install`)
- [ ] TypeScript compiled without errors (`npm run build`)

### ✅ Frontend Configuration
- [ ] Dependencies installed in `client/` directory (`npm install`)
- [ ] API endpoint configured (check `src/lib/api.ts`)
- [ ] Vite config correct (`vite.config.ts`)
- [ ] Tailwind CSS compiled correctly
- [ ] Build completes without errors (`npm run build`)

### ✅ Feature Verification
- [ ] All 14 pages load without errors
- [ ] Authentication flow works (login, logout, token refresh)
- [ ] All 6 role-based dashboards display correctly
- [ ] API endpoints responding (check `/api/health`)
- [ ] Socket.io connection established
- [ ] File upload functionality working
- [ ] Date formats displaying as DD/MM/YYYY
- [ ] Arabic labels rendering correctly

---

## 🧪 Beta Testing Phases

### Phase 1: Core Functionality Testing (Week 1)

#### Authentication & Authorization
**Tester Role**: All
- [ ] Login with each of 6 demo accounts
- [ ] Verify role-specific dashboard displays
- [ ] Test logout and session expiration
- [ ] Verify unauthorized page access blocked
- [ ] Test password requirements

**Expected Outcome**: All users can log in, see appropriate dashboards, logout cleanly

---

#### Fleet Management
**Tester Role**: Admin, Manager, Warehouse
- [ ] Create new vehicle (all required fields)
- [ ] Update vehicle details
- [ ] Change vehicle status (Available, Rented, Maintenance, Out of Service)
- [ ] Verify soft delete (vehicle hidden but retrievable)
- [ ] Search and filter vehicles
- [ ] Upload vehicle documents

**Expected Outcome**: Full CRUD operations work, status changes reflect immediately

**Test Cases**:
1. Create car with Arabic plate number "أ ب ج 1234"
2. Upload car images and documents
3. Change status to "Maintenance" → verify in Maintenance module
4. Soft delete → verify not shown in active list but exists in database

---

#### Customer Management
**Tester Role**: Admin, Manager, Reception
- [ ] Create customer with ID card number
- [ ] Upload customer documents (ID scan, fingerprint)
- [ ] Search customers by name, phone, ID
- [ ] Update customer details
- [ ] Verify soft delete
- [ ] Test duplicate ID card validation

**Expected Outcome**: Customer data persists, documents upload successfully, search works

**Test Cases**:
1. Create customer "محمد أحمد" with phone "0500123456"
2. Upload ID card scan
3. Search by partial name "محمد"
4. Update phone number
5. Attempt duplicate ID card → should fail

---

#### Booking System
**Tester Role**: Admin, Manager, Reception
- [ ] Check car availability (date range selection)
- [ ] Create booking with customer and car
- [ ] Verify automatic price calculation
- [ ] Test booking overlap prevention
- [ ] Mark booking as "Picked Up"
- [ ] Mark booking as "Returned"
- [ ] Cancel booking
- [ ] Verify booking appears in Reports

**Expected Outcome**: Bookings created without conflicts, prices calculated correctly, status updates work

**Test Cases**:
1. Book car for 3 days (e.g., 01/01/2025 - 04/01/2025)
2. Verify price = (3 × daily_rate) + extras + tax - discount
3. Attempt overlapping booking for same car → should fail
4. Pick up booking → status changes to "Active"
5. Return booking → status changes to "Completed", car available again

---

#### Transactions & Finance
**Tester Role**: Admin, Manager, Accountant
- [ ] Create income transaction (rental payment)
- [ ] Create expense transaction (fuel, maintenance)
- [ ] Verify Arabic transaction type labels
- [ ] Filter by date range
- [ ] Filter by transaction type
- [ ] View transaction details
- [ ] Update/delete transaction
- [ ] Verify totals in Finance page

**Expected Outcome**: All transaction types work, filtering accurate, totals calculate correctly

**Test Cases**:
1. Create "دفع إيجار" (Rental Payment) for 1000 SAR
2. Create "صيانة" (Maintenance) expense for 500 SAR
3. Filter for current month
4. Verify Finance page shows: Revenue = 1000, Expenses = 500, Net = 500

---

#### Maintenance System
**Tester Role**: Admin, Manager, Mechanic, Warehouse
- [ ] Create maintenance record manually
- [ ] Verify auto-creation when car status changed to "Maintenance"
- [ ] Update maintenance record (add notes, cost)
- [ ] Complete maintenance (change status to "Completed")
- [ ] Verify car status changes back to "Available"
- [ ] View maintenance history per vehicle
- [ ] Test maintenance profiles (scheduled maintenance)

**Expected Outcome**: Maintenance records create automatically, history tracking works, car availability updates

**Test Cases**:
1. Change car status to "Maintenance" in Fleet page
2. Check Maintenance page → new record should exist
3. Add notes "تغيير زيت" (Oil change), cost 200 SAR
4. Complete maintenance
5. Verify car now shows "Available" in Fleet

---

### Phase 2: Advanced Features Testing (Week 2)

#### Reports & Analytics
**Tester Role**: Admin, Manager, Accountant
- [ ] View dashboard statistics (total revenue, expenses, net profit)
- [ ] Verify fleet statistics (total cars, rented, in maintenance)
- [ ] Test monthly filtering
- [ ] Export report as PDF
- [ ] Export report as Excel
- [ ] Verify data matches Transactions and Bookings

**Expected Outcome**: Reports display real data, exports work, calculations accurate

**Test Cases**:
1. Create 3 bookings, 2 income transactions, 1 expense
2. Open Reports page
3. Verify "Total Revenue" matches sum of income transactions + booking payments
4. Verify "Total Expenses" matches sum of expense transactions
5. Export PDF → file downloads successfully
6. Open Excel export → data matches screen

---

#### Notification System (Multi-User)
**Tester Role**: All roles
- [ ] Admin sends notification to Manager → Manager receives it
- [ ] Manager sends notification to Reception → Reception receives it
- [ ] Admin sends multi-recipient notification → all selected users receive it
- [ ] Test 12+ notification types (each has correct icon and Arabic label)
- [ ] Acknowledge notification → disappears from unread list
- [ ] View "Sent" notifications → see previously sent messages
- [ ] Test global broadcast (all users receive)
- [ ] Verify cross-account delivery
- [ ] Test real-time delivery (Socket.io - should appear immediately)
- [ ] Test notification sound plays

**Expected Outcome**: All users receive notifications in real-time, can send to others based on role, notification types display correctly

**Test Cases**:
1. Login as Admin, send "حجز جديد" (New Booking) notification to Manager
2. Login as Manager in different browser → notification appears instantly
3. Manager clicks notification → marked as read
4. Login as Reception, send notification to Admin
5. Verify Admin receives it (cross-account delivery)
6. Admin sends multi-recipient notification to [Manager, Accountant, Reception]
7. Verify all 3 users receive the same notification
8. Check "Sent" tab → see sent notification with timestamp

---

#### Employee Management
**Tester Role**: Admin, Manager
- [ ] Create new user account
- [ ] Assign role (test each of 6 roles)
- [ ] Update user details (name, email, phone)
- [ ] Deactivate user
- [ ] Verify deactivated user cannot login
- [ ] Reactivate user
- [ ] Test role-based permissions (e.g., Reception cannot access Admin features)

**Expected Outcome**: User CRUD works, role assignment persists, permissions enforced

**Test Cases**:
1. Admin creates new user "Ahmed Ali" with role "Mechanic"
2. Login as Ahmed Ali → sees Mechanic dashboard
3. Ahmed Ali attempts to access "Users" page → blocked (403 Forbidden)
4. Admin deactivates Ahmed Ali
5. Ahmed Ali attempts login → fails with "Account deactivated" message

---

#### Employee Performance
**Tester Role**: Admin, Manager
- [ ] View performance analytics per employee
- [ ] Verify booking count per user
- [ ] Verify transaction count per user
- [ ] Filter by date range
- [ ] Export performance report

**Expected Outcome**: Performance data accurate, matches bookings/transactions created by each user

**Test Cases**:
1. Reception user creates 3 bookings
2. Open Performance page
3. Verify Reception user shows "3 bookings"
4. Accountant creates 2 transactions
5. Verify Accountant shows "2 transactions"

---

#### Business Planner
**Tester Role**: Admin, Manager
- [ ] Create business plan (quarterly, annual)
- [ ] Set revenue and expense targets
- [ ] Update plan
- [ ] **⚠️ Known Issue**: Delete plan (may fail due to missing ID - test and report)
- [ ] View plan progress vs actual performance

**Expected Outcome**: Plans create and update successfully (delete may fail - document if happens)

**Test Cases**:
1. Create plan "Q1 2025" with revenue target 50000 SAR
2. Update plan to 60000 SAR
3. Attempt to delete plan → **if fails, document error message**
4. View plan → verify displays correctly

---

#### Settings & Profile
**Tester Role**: All roles
- [ ] Update user profile (name, phone)
- [ ] Change password
- [ ] Update system settings (Admin only)
- [ ] Verify settings persist after logout/login

**Expected Outcome**: Profile updates save, password change works, settings apply system-wide

**Test Cases**:
1. Login as Admin, change name from "Admin User" to "Administrator"
2. Logout and login → name should be "Administrator"
3. Change password from "Admin123!" to "NewPass123!"
4. Logout and login with new password → success
5. Update system settings (e.g., company name)
6. Verify new company name displays in header

---

### Phase 3: Cross-Module Integration Testing (Week 3)

#### Booking → Transaction Flow
**Tester**: Reception + Accountant
- [ ] Reception creates booking
- [ ] Accountant creates rental payment transaction linked to booking
- [ ] Verify transaction appears in Finance reports
- [ ] Verify booking payment status updates

**Expected Outcome**: Booking and transaction data synchronized

---

#### Fleet → Maintenance Flow
**Tester**: Warehouse + Mechanic
- [ ] Warehouse changes car status to "Maintenance"
- [ ] Mechanic sees new maintenance record
- [ ] Mechanic completes maintenance
- [ ] Warehouse sees car available again

**Expected Outcome**: Fleet status and maintenance records synchronized

---

#### Performance → Planner Flow
**Tester**: Manager
- [ ] Create business plan with targets
- [ ] View performance page
- [ ] Compare actual performance vs plan targets
- [ ] Verify calculations match

**Expected Outcome**: Performance data compared against plan targets accurately

---

## 🐛 Bug Reporting Template

When you encounter an issue, please provide:

```markdown
### Bug Report

**Date**: [DD/MM/YYYY]
**Tester**: [Your Name]
**Role**: [Admin/Manager/Reception/etc.]

**Description**: [What happened?]

**Steps to Reproduce**:
1. [First action]
2. [Second action]
3. [Third action]

**Expected Behavior**: [What should have happened?]

**Actual Behavior**: [What actually happened?]

**Screenshot**: [Attach if possible]

**Console Errors**: [Check browser console (F12) and paste any errors]

**Severity**: 
- [ ] Critical (system crashes, data loss)
- [ ] High (feature broken, cannot proceed)
- [ ] Medium (feature works but has issues)
- [ ] Low (cosmetic, minor inconvenience)

**Browser**: [Chrome, Firefox, Edge, Safari]
**OS**: [Windows, macOS, Linux]
```

---

## 💡 Feature Request Template

```markdown
### Feature Request

**Date**: [DD/MM/YYYY]
**Requester**: [Your Name]
**Role**: [Admin/Manager/Reception/etc.]

**Feature Description**: [What feature do you want?]

**Use Case**: [Why do you need it? What problem does it solve?]

**Priority**: 
- [ ] Must-have (critical for operations)
- [ ] Should-have (important but not blocking)
- [ ] Nice-to-have (enhancement)

**Suggested Solution**: [If you have ideas on how to implement]
```

---

## 📊 Beta Testing Success Criteria

To promote Baron to **Alpha Phase**, we need:

### Minimum Requirements:
- ✅ **10+ Real Users** tested across all 6 roles
- ✅ **All Critical Bugs Fixed** (severity: Critical or High)
- ✅ **Core Features Validated**:
  - [ ] Authentication: 100% working
  - [ ] Fleet Management: 100% working
  - [ ] Customer Management: 100% working
  - [ ] Booking System: 100% working
  - [ ] Transactions: 100% working
  - [ ] Maintenance: 100% working
  - [ ] Notifications: 100% working (multi-user verified)
  - [ ] Reports: 100% working (real data verified)

### Performance Benchmarks:
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms for most endpoints
- [ ] No memory leaks during 8+ hour usage
- [ ] Handles 5+ concurrent users without issues

### User Satisfaction:
- [ ] 80%+ of users rate system as "Good" or "Excellent"
- [ ] 90%+ of core workflows can be completed without assistance
- [ ] Minimal complaints about UI/UX

### Documentation:
- [ ] All features documented
- [ ] Installation guide validated by non-developer
- [ ] API documentation complete
- [ ] User manual created (in Arabic)

---

## 🚀 Alpha Promotion Checklist

Once beta testing complete:

- [ ] All critical and high-severity bugs fixed
- [ ] 10+ user feedback forms collected
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Code review completed
- [ ] Documentation reviewed and updated
- [ ] User training materials prepared
- [ ] Production deployment plan finalized
- [ ] Backup and disaster recovery tested
- [ ] Support process defined

**Alpha Release Date Target**: [To be determined based on beta results]

---

## 📞 Support & Questions

**During Beta Testing**:
- Report bugs using the template above
- Submit feature requests
- Ask questions in team chat or email

**Development Team Contact**: [Your contact information]

---

## ✅ Daily Testing Checklist

**Quick daily verification** (15 minutes):

- [ ] Login works for all 6 roles
- [ ] Create 1 booking
- [ ] Create 1 transaction
- [ ] Send 1 notification
- [ ] Check Reports page displays data
- [ ] No console errors
- [ ] All pages load correctly

**Run this daily during beta testing to catch regressions quickly.**

---

**Remember**: The goal of beta testing is to find issues before real production use. Report everything, even small UI issues. Your feedback is critical for making Baron production-ready!

**Thank you for participating in Baron Beta Testing! 🚗✨**
