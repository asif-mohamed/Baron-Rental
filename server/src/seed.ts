import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full system access',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Manager' },
      update: {},
      create: {
        name: 'Manager',
        description: 'Management access',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Reception' },
      update: {},
      create: {
        name: 'Reception',
        description: 'Reception staff',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Warehouse' },
      update: {},
      create: {
        name: 'Warehouse',
        description: 'Warehouse staff',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Accountant' },
      update: {},
      create: {
        name: 'Accountant',
        description: 'Finance and accounting',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Mechanic' },
      update: {},
      create: {
        name: 'Mechanic',
        description: 'Maintenance staff',
      },
    }),
  ]);

  console.log('✅ Roles created');

  // Get role references for later use
  const adminRole = roles.find(r => r.name === 'Admin')!;
  const managerRole = roles.find(r => r.name === 'Manager')!;
  const receptionRole = roles.find(r => r.name === 'Reception')!;
  const warehouseRole = roles.find(r => r.name === 'Warehouse')!;
  const accountantRole = roles.find(r => r.name === 'Accountant')!;
  const mechanicRole = roles.find(r => r.name === 'Mechanic')!;

  // Create Permissions
  const resources = ['cars', 'customers', 'bookings', 'transactions', 'maintenance', 'reports', 'users'];
  const actions = ['create', 'read', 'update', 'delete'];

  for (const resource of resources) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: {
          resource_action: { resource, action },
        },
        update: {},
        create: {
          resource,
          action,
          description: `${action} ${resource}`,
        },
      });
    }
  }

  console.log('✅ Permissions created');

  // Assign all permissions to Admin role
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Admin permissions assigned');

  // Helper function to assign permission
  const assignPermission = async (role: any, resource: string, action: string) => {
    const permission = allPermissions.find(p => p.resource === resource && p.action === action);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  };

  // MANAGER: Can manage everything except users
  console.log('Assigning Manager permissions...');
  const managerResources = ['cars', 'customers', 'bookings', 'transactions', 'maintenance', 'reports'];
  const managerActions = ['create', 'read', 'update', 'delete'];
  for (const resource of managerResources) {
    for (const action of managerActions) {
      await assignPermission(managerRole, resource, action);
    }
  }

  // RECEPTION: Can manage customers, bookings, and view cars
  console.log('Assigning Reception permissions...');
  await assignPermission(receptionRole, 'customers', 'create');
  await assignPermission(receptionRole, 'customers', 'read');
  await assignPermission(receptionRole, 'customers', 'update');
  await assignPermission(receptionRole, 'bookings', 'create');
  await assignPermission(receptionRole, 'bookings', 'read');
  await assignPermission(receptionRole, 'bookings', 'update');
  await assignPermission(receptionRole, 'cars', 'read');
  await assignPermission(receptionRole, 'transactions', 'read');

  // WAREHOUSE: Can manage cars and view bookings
  console.log('Assigning Warehouse permissions...');
  await assignPermission(warehouseRole, 'cars', 'create');
  await assignPermission(warehouseRole, 'cars', 'read');
  await assignPermission(warehouseRole, 'cars', 'update');
  await assignPermission(warehouseRole, 'cars', 'delete');
  await assignPermission(warehouseRole, 'bookings', 'read');
  await assignPermission(warehouseRole, 'bookings', 'update');
  await assignPermission(warehouseRole, 'maintenance', 'read');
  await assignPermission(warehouseRole, 'maintenance', 'create');

  // ACCOUNTANT: Can manage transactions and view reports
  console.log('Assigning Accountant permissions...');
  await assignPermission(accountantRole, 'transactions', 'create');
  await assignPermission(accountantRole, 'transactions', 'read');
  await assignPermission(accountantRole, 'transactions', 'update');
  await assignPermission(accountantRole, 'transactions', 'delete');
  await assignPermission(accountantRole, 'reports', 'read');
  await assignPermission(accountantRole, 'bookings', 'read');
  await assignPermission(accountantRole, 'bookings', 'update'); // Needed to update paidAmount when creating transactions
  await assignPermission(accountantRole, 'customers', 'read');

  // MECHANIC: Can manage maintenance and view cars
  console.log('Assigning Mechanic permissions...');
  await assignPermission(mechanicRole, 'maintenance', 'create');
  await assignPermission(mechanicRole, 'maintenance', 'read');
  await assignPermission(mechanicRole, 'maintenance', 'update');
  await assignPermission(mechanicRole, 'maintenance', 'delete');
  await assignPermission(mechanicRole, 'cars', 'read');
  await assignPermission(mechanicRole, 'cars', 'update');

  console.log('✅ All role permissions assigned');

  // Create and assign notification permissions to all roles
  console.log('Creating notification permissions...');
  const notificationPermissions = await Promise.all([
    prisma.permission.upsert({
      where: {
        resource_action: { resource: 'notifications', action: 'create' },
      },
      update: {},
      create: {
        resource: 'notifications',
        action: 'create',
        description: 'Create and send notifications',
      },
    }),
    prisma.permission.upsert({
      where: {
        resource_action: { resource: 'notifications', action: 'read' },
      },
      update: {},
      create: {
        resource: 'notifications',
        action: 'read',
        description: 'Read notifications',
      },
    }),
    prisma.permission.upsert({
      where: {
        resource_action: { resource: 'notifications', action: 'delete' },
      },
      update: {},
      create: {
        resource: 'notifications',
        action: 'delete',
        description: 'Delete notifications',
      },
    }),
  ]);

  console.log('✅ Notification permissions created');

  // Assign notification permissions to all roles
  console.log('Assigning notification permissions to all roles...');
  for (const role of roles) {
    for (const permission of notificationPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('✅ Notification permissions assigned to all roles');

  // Create Demo Users for all roles
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@baron.local' },
    update: {},
    create: {
      email: 'admin@baron.local',
      password: hashedPassword,
      fullName: 'مدير النظام',
      phone: '+966501234567',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log('✅ Admin user created (admin@baron.local / Admin123!)');

  // Create Manager user
  await prisma.user.upsert({
    where: { email: 'manager@baron.local' },
    update: {},
    create: {
      email: 'manager@baron.local',
      password: hashedPassword,
      fullName: 'أحمد المدير',
      phone: '+966502345678',
      roleId: managerRole.id,
      isActive: true,
    },
  });

  console.log('✅ Manager user created (manager@baron.local / Admin123!)');

  // Create Reception user
  await prisma.user.upsert({
    where: { email: 'reception@baron.local' },
    update: {},
    create: {
      email: 'reception@baron.local',
      password: hashedPassword,
      fullName: 'فاطمة الاستقبال',
      phone: '+966503456789',
      roleId: receptionRole.id,
      isActive: true,
    },
  });

  console.log('✅ Reception user created (reception@baron.local / Admin123!)');

  // Create Warehouse user
  await prisma.user.upsert({
    where: { email: 'warehouse@baron.local' },
    update: {},
    create: {
      email: 'warehouse@baron.local',
      password: hashedPassword,
      fullName: 'محمد المستودع',
      phone: '+966504567890',
      roleId: warehouseRole.id,
      isActive: true,
    },
  });

  console.log('✅ Warehouse user created (warehouse@baron.local / Admin123!)');

  // Create Accountant user
  await prisma.user.upsert({
    where: { email: 'accountant@baron.local' },
    update: {},
    create: {
      email: 'accountant@baron.local',
      password: hashedPassword,
      fullName: 'سارة المحاسبة',
      phone: '+966505678901',
      roleId: accountantRole.id,
      isActive: true,
    },
  });

  console.log('✅ Accountant user created (accountant@baron.local / Admin123!)');

  // Create Mechanic user
  await prisma.user.upsert({
    where: { email: 'mechanic@baron.local' },
    update: {},
    create: {
      email: 'mechanic@baron.local',
      password: hashedPassword,
      fullName: 'خالد الميكانيكي',
      phone: '+966506789012',
      roleId: mechanicRole.id,
      isActive: true,
    },
  });

  console.log('✅ Mechanic user created (mechanic@baron.local / Admin123!)');

  // Create Maintenance Profiles
  const maintenanceProfiles = await Promise.all([
    prisma.maintenanceProfile.create({
      data: {
        name: 'صيانة عادية',
        mileageThreshold: 5000,
        daysThreshold: 90,
        description: 'صيانة دورية كل 5000 كم أو 3 أشهر',
      },
    }),
    prisma.maintenanceProfile.create({
      data: {
        name: 'صيانة مكثفة',
        mileageThreshold: 10000,
        daysThreshold: 180,
        description: 'صيانة شاملة كل 10000 كم أو 6 أشهر',
      },
    }),
  ]);

  console.log('✅ Maintenance profiles created');

  // Create Demo Cars
  const cars = await Promise.all([
    prisma.car.upsert({
      where: { vin: 'JT2BF28K123456789' },
      update: {},
      create: {
        brand: 'تويوتا',
        model: 'كامري',
        year: 2023,
        plateNumber: 'أ ب ج 1234',
        color: 'أبيض',
        vin: 'JT2BF28K123456789',
        dailyRate: 200,
        mileage: 15000,
        status: 'available',
        condition: 'excellent',
        fuelType: 'petrol',
        transmission: 'automatic',
        seats: 5,
        category: 'sedan',
        purchaseDate: new Date('2023-01-15'),
        purchasePrice: 85000,
        maintenanceProfileId: maintenanceProfiles[0].id,
      },
    }),
    prisma.car.upsert({
      where: { vin: 'KMHCT4AE8EU123456' },
      update: {},
      create: {
        brand: 'هيونداي',
        model: 'توسان',
        year: 2024,
        plateNumber: 'د ه و 5678',
        color: 'أسود',
        vin: 'KMHCT4AE8EU123456',
        dailyRate: 250,
        mileage: 8000,
        status: 'available',
        condition: 'excellent',
        fuelType: 'petrol',
        transmission: 'automatic',
        seats: 5,
        category: 'suv',
        purchaseDate: new Date('2024-03-20'),
        purchasePrice: 120000,
        maintenanceProfileId: maintenanceProfiles[0].id,
      },
    }),
    prisma.car.upsert({
      where: { vin: '1C4RJFAG3FC123456' },
      update: {},
      create: {
        brand: 'جيب',
        model: 'رانجلر',
        year: 2023,
        plateNumber: 'ز ح ط 9012',
        color: 'أخضر',
        vin: '1C4HJXDG7KW123456',
        dailyRate: 350,
        mileage: 12000,
        status: 'rented',
        condition: 'good',
        fuelType: 'petrol',
        transmission: 'automatic',
        seats: 5,
        category: 'suv',
        purchaseDate: new Date('2023-06-10'),
        purchasePrice: 180000,
        maintenanceProfileId: maintenanceProfiles[1].id,
      },
    }),
    prisma.car.upsert({
      where: { vin: '3N1AB8BV0MY123456' },
      update: {},
      create: {
        brand: 'نيسان',
        model: 'سنترا',
        year: 2022,
        plateNumber: 'ي ك ل 3456',
        color: 'فضي',
        vin: '3N1AB8BV0MY123456',
        dailyRate: 150,
        mileage: 28000,
        status: 'available',
        condition: 'good',
        fuelType: 'petrol',
        transmission: 'automatic',
        seats: 5,
        category: 'economy',
        purchaseDate: new Date('2022-09-05'),
        purchasePrice: 65000,
        maintenanceProfileId: maintenanceProfiles[0].id,
      },
    }),
    prisma.car.upsert({
      where: { vin: 'JTHBK1GG8L2123456' },
      update: {},
      create: {
        brand: 'لكزس',
        model: 'ES',
        year: 2024,
        plateNumber: 'م ن س 7890',
        color: 'أسود',
        vin: 'JTHBK1GG8L2123456',
        dailyRate: 450,
        mileage: 3000,
        status: 'available',
        condition: 'excellent',
        fuelType: 'hybrid',
        transmission: 'automatic',
        seats: 5,
        category: 'luxury',
        purchaseDate: new Date('2024-05-01'),
        purchasePrice: 250000,
        maintenanceProfileId: maintenanceProfiles[1].id,
      },
    }),
  ]);

  console.log('✅ Demo cars created');

  // Create Demo Customers with Document References
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        fullName: 'أحمد محمد السعيد',
        email: 'ahmed.mohammed@example.com',
        phone: '+966501111111',
        address: 'الرياض، حي الملقا',
        licenseNumber: 'L12345678',
        licenseExpiry: new Date('2026-12-31'),
        nationalId: '1234567890',
        dateOfBirth: new Date('1990-05-15'),
        nationalIdDocument: '/uploads/customers/sample-id-1.pdf',
        fingerprintDocument: '/uploads/customers/sample-fingerprint-1.pdf',
        rentalContract: '/uploads/customers/sample-contract-1.pdf',
      },
    }),
    prisma.customer.create({
      data: {
        fullName: 'فاطمة علي الزهراني',
        email: 'fatima.ali@example.com',
        phone: '+966502222222',
        address: 'جدة، حي الروضة',
        licenseNumber: 'L98765432',
        licenseExpiry: new Date('2025-08-20'),
        nationalId: '9876543210',
        dateOfBirth: new Date('1988-11-22'),
        nationalIdDocument: '/uploads/customers/sample-id-2.pdf',
        fingerprintDocument: '/uploads/customers/sample-fingerprint-2.pdf',
      },
    }),
    prisma.customer.create({
      data: {
        fullName: 'خالد عبدالله النمر',
        email: 'khaled.abdullah@example.com',
        phone: '+966503333333',
        address: 'الدمام، حي الفيصلية',
        licenseNumber: 'L55566677',
        licenseExpiry: new Date('2027-03-10'),
        nationalId: '5556667778',
        dateOfBirth: new Date('1985-03-08'),
        rentalContract: '/uploads/customers/sample-contract-3.pdf',
      },
    }),
  ]);

  console.log('✅ Demo customers created');

  // Create Demo Bookings
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        bookingNumber: 'BK-202411-001',
        carId: cars[2].id, // Jeep Wrangler (rented)
        customerId: customers[0].id,
        userId: adminUser.id,
        startDate: tomorrow,
        endDate: nextWeek,
        totalDays: 6,
        dailyRate: 350,
        subtotal: 2100,
        extras: 0,
        taxes: 315,
        discount: 0,
        totalAmount: 2415,
        paidAmount: 1000,
        status: 'active',
        pickupDate: tomorrow,
        initialOdometer: 12000, // Matches car's current mileage
      },
    }),
    prisma.booking.create({
      data: {
        bookingNumber: 'BK-202411-002',
        carId: cars[0].id,
        customerId: customers[1].id,
        userId: adminUser.id,
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        totalDays: 7,
        dailyRate: 200,
        subtotal: 1400,
        extras: 100,
        taxes: 225,
        discount: 50,
        totalAmount: 1675,
        paidAmount: 0,
        status: 'confirmed',
      },
    }),
  ]);

  console.log('✅ Demo bookings created');

  // Create Demo Transactions
  await prisma.transaction.create({
    data: {
      bookingId: bookings[0].id,
      userId: adminUser.id,
      type: 'payment',
      category: 'rental',
      amount: 1000,
      paymentMethod: 'cash',
      description: 'دفعة مقدمة للحجز',
    },
  });

  console.log('✅ Demo transactions created');

  // Create additional bookings for different employees (for performance tracking)
  const managerUser = await prisma.user.findUnique({ where: { email: 'manager@baron.local' } });
  const receptionUser = await prisma.user.findUnique({ where: { email: 'reception@baron.local' } });
  const warehouseUser = await prisma.user.findUnique({ where: { email: 'warehouse@baron.local' } });
  
  const additionalBookings = await Promise.all([
    // Manager's bookings (high performer)
    prisma.booking.create({
      data: {
        bookingNumber: 'BK-202411-003',
        carId: cars[2].id,
        customerId: customers[0].id,
        userId: managerUser!.id,
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        totalDays: 4,
        dailyRate: 250,
        subtotal: 1000,
        extras: 50,
        taxes: 157.5,
        discount: 0,
        totalAmount: 1207.5,
        paidAmount: 1207.5,
        status: 'completed',
        initialOdometer: 11600,
        finalOdometer: 12000, // 400km driven in 4 days (100km/day allowed)
      },
    }),
    prisma.booking.create({
      data: {
        bookingNumber: 'BK-202411-004',
        carId: cars[3].id,
        customerId: customers[1].id,
        userId: managerUser!.id,
        startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        totalDays: 7,
        dailyRate: 180,
        subtotal: 1260,
        extras: 0,
        taxes: 189,
        discount: 100,
        totalAmount: 1349,
        paidAmount: 1349,
        status: 'completed',
        initialOdometer: 27200,
        finalOdometer: 28000, // 800km driven in 7 days (exceeded by 100km)
      },
    }),
    // Reception's bookings (moderate performer)
    prisma.booking.create({
      data: {
        bookingNumber: 'BK-202411-005',
        carId: cars[4].id,
        customerId: customers[2].id,
        userId: receptionUser!.id,
        startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        totalDays: 7,
        dailyRate: 150,
        subtotal: 1050,
        extras: 75,
        taxes: 168.75,
        discount: 0,
        totalAmount: 1293.75,
        paidAmount: 500,
        status: 'active',
        initialOdometer: 3000, // Active rental, no final odometer yet
      },
    }),
  ]);

  // Create transactions for additional bookings
  await Promise.all([
    prisma.transaction.create({
      data: {
        bookingId: additionalBookings[0].id,
        userId: managerUser!.id,
        type: 'payment',
        category: 'rental',
        amount: 1207.5,
        paymentMethod: 'card',
        description: 'دفع كامل للحجز',
        transactionDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.transaction.create({
      data: {
        bookingId: additionalBookings[1].id,
        userId: managerUser!.id,
        type: 'payment',
        category: 'rental',
        amount: 1349,
        paymentMethod: 'bank_transfer',
        description: 'دفع كامل للحجز',
        transactionDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.transaction.create({
      data: {
        bookingId: additionalBookings[1].id,
        userId: managerUser!.id,
        type: 'expense',
        category: 'extra_km_charge',
        amount: 50, // 100km excess × 0.5 LYD
        paymentMethod: 'pending',
        description: 'رسوم إضافية للكيلومترات الزائدة: 100 كم × 0.5 د.ل - تجاوز الحد المسموح: 100 كيلومتر',
        transactionDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.transaction.create({
      data: {
        bookingId: additionalBookings[2].id,
        userId: receptionUser!.id,
        type: 'payment',
        category: 'rental',
        amount: 500,
        paymentMethod: 'cash',
        description: 'دفعة مقدمة',
        transactionDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Additional employee bookings and transactions created');

  // Get all users for notifications
  const accountantUser = await prisma.user.findUnique({ where: { email: 'accountant@baron.local' } });
  const mechanicUser = await prisma.user.findUnique({ where: { email: 'mechanic@baron.local' } });
  const allUsers = [adminUser, managerUser!, receptionUser!, warehouseUser!, accountantUser!, mechanicUser!];

  // Create Demo Notifications for all users
  console.log('Creating demo notifications for all users...');

  // Admin notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        senderId: managerUser!.id,
        type: 'user_message',
        title: 'طلب موافقة على التوسع',
        message: 'نحتاج موافقتك على خطة افتتاح فرع جديد في طرابلس. الميزانية المطلوبة: 250,000 د.ل',
        requiresAction: true,
        actionType: 'approve',
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'maintenance_due',
        title: 'صيانة مستحقة - تويوتا كامري',
        message: 'سيارة تويوتا كامري (أ ب ج 1234) تحتاج صيانة دورية. المسافة المقطوعة: 15,000 كم',
        data: JSON.stringify({ carId: cars[0].id, mileage: 15000 }),
        isRead: true,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        senderId: accountantUser!.id,
        type: 'user_message',
        title: 'تقرير مالي شهري',
        message: 'تم إنشاء التقرير المالي لشهر نوفمبر. الإيرادات: 45,250 د.ل | المصروفات: 12,800 د.ل',
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Manager notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: managerUser!.id,
        type: 'booking_created',
        title: 'حجز جديد - BK-202411-006',
        message: 'تم إنشاء حجز جديد بواسطة موظفة الاستقبال. العميل: محمد الصادق | المبلغ: 1,575 د.ل',
        data: JSON.stringify({ bookingNumber: 'BK-202411-006', customerName: 'محمد الصادق' }),
        isRead: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: managerUser!.id,
        senderId: warehouseUser!.id,
        type: 'car_pickup_needed',
        title: 'سيارة جاهزة للتسليم',
        message: 'هيونداي توسان (د هـ و 5678) جاهزة للتسليم بعد الصيانة. يرجى إخطار العميل',
        data: JSON.stringify({ carId: cars[1].id }),
        requiresAction: true,
        actionType: 'confirm',
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: managerUser!.id,
        type: 'overdue',
        title: 'حجز متأخر - BK-202411-002',
        message: 'الحجز BK-202411-002 متأخر يومين عن موعد الإرجاع المتوقع',
        data: JSON.stringify({ bookingNumber: 'BK-202411-002', daysOverdue: 2 }),
        isRead: true,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: managerUser!.id,
        senderId: adminUser.id,
        type: 'user_message',
        title: 'موافقة على طلب الإجازة',
        message: 'تمت الموافقة على طلب إجازتك من 25-30 نوفمبر. استمتع بوقتك!',
        isRead: false,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Reception notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: receptionUser!.id,
        type: 'pickup_due',
        title: 'استلام سيارة اليوم - BK-202411-007',
        message: 'العميل أحمد بن سعيد لديه موعد استلام سيارة نيسان سنترا اليوم الساعة 2:00 مساءً',
        data: JSON.stringify({ bookingNumber: 'BK-202411-007', time: '14:00' }),
        requiresAction: true,
        actionType: 'confirm',
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: receptionUser!.id,
        senderId: managerUser!.id,
        type: 'user_message',
        title: 'أداء ممتاز هذا الشهر!',
        message: 'عمل رائع! لقد أتممت 23 حجزاً هذا الشهر بمعدل رضا عملاء 4.8/5. استمري!',
        isRead: false,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: receptionUser!.id,
        type: 'booking_created',
        title: 'تأكيد حجز - BK-202411-005',
        message: 'تم تأكيد الحجز BK-202411-005 بنجاح. موعد الاستلام: غداً',
        data: JSON.stringify({ bookingNumber: 'BK-202411-005' }),
        isRead: true,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Warehouse notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: warehouseUser!.id,
        senderId: mechanicUser!.id,
        type: 'car_pickup_needed',
        title: 'سيارة جاهزة من الصيانة',
        message: 'كيا سبورتاج (ز ح ط 9012) انتهت صيانتها وجاهزة للنقل إلى المستودع',
        data: JSON.stringify({ carId: cars[2].id }),
        requiresAction: true,
        actionType: 'acknowledge',
        isRead: false,
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: warehouseUser!.id,
        type: 'maintenance_due',
        title: 'فحص دوري مطلوب',
        message: 'شيفروليه ماليبو (ك ل م 3456) تحتاج فحص دوري. المسافة: 34,500 كم',
        data: JSON.stringify({ carId: cars[3].id }),
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: warehouseUser!.id,
        senderId: managerUser!.id,
        type: 'user_message',
        title: 'خطة تحسين الأداء',
        message: 'تم إنشاء خطة تحسين أداء لك. يرجى مراجعتها في قسم الخطط التطويرية',
        requiresAction: true,
        actionType: 'acknowledge',
        isRead: true,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Accountant notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: accountantUser!.id,
        type: 'user_message',
        title: 'دفعة جديدة مستلمة',
        message: 'تم استلام دفعة نقدية بقيمة 1,207.5 د.ل للحجز BK-202411-003. يرجى المراجعة',
        data: JSON.stringify({ amount: 1207.5, bookingNumber: 'BK-202411-003' }),
        requiresAction: true,
        actionType: 'acknowledge',
        isRead: false,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: accountantUser!.id,
        senderId: managerUser!.id,
        type: 'user_message',
        title: 'طلب تقرير مالي ربع سنوي',
        message: 'يرجى إعداد التقرير المالي للربع الرابع من 2024. الموعد النهائي: 5 ديسمبر',
        requiresAction: true,
        actionType: 'acknowledge',
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: accountantUser!.id,
        type: 'user_message',
        title: 'رسوم تأخير مستحقة',
        message: 'الحجز BK-202411-002 لديه رسوم تأخير 200 د.ل لم يتم تحصيلها بعد',
        data: JSON.stringify({ bookingNumber: 'BK-202411-002', lateFee: 200 }),
        isRead: true,
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Mechanic notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: mechanicUser!.id,
        type: 'maintenance_due',
        title: 'صيانة عاجلة - تويوتا كامري',
        message: 'تويوتا كامري (أ ب ج 1234) تحتاج صيانة عاجلة. تم الإبلاغ عن صوت غريب في المحرك',
        data: JSON.stringify({ carId: cars[0].id, priority: 'urgent' }),
        requiresAction: true,
        actionType: 'acknowledge',
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mechanicUser!.id,
        senderId: warehouseUser!.id,
        type: 'user_message',
        title: 'سيارة جديدة للفحص',
        message: 'هيونداي توسان (د هـ و 5678) في انتظارك للفحص الدوري. موقعها: ورشة A',
        requiresAction: true,
        actionType: 'acknowledge',
        isRead: false,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: mechanicUser!.id,
        type: 'user_message',
        title: 'قطع غيار وصلت',
        message: 'قطع الغيار المطلوبة لصيانة كيا سبورتاج وصلت. يمكنك البدء بالعمل',
        isRead: true,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // Role-based notifications (for all users of certain roles)
  await Promise.all([
    prisma.notification.create({
      data: {
        roleId: managerRole.id,
        senderId: adminUser.id,
        type: 'user_message',
        title: 'اجتماع الإدارة الشهري',
        message: 'اجتماع الإدارة الشهري سيعقد يوم الأحد 24 نوفمبر الساعة 10:00 صباحاً',
        requiresAction: true,
        actionType: 'acknowledge',
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        roleId: warehouseRole.id,
        senderId: managerUser!.id,
        type: 'user_message',
        title: 'تحديث نظام الجرد',
        message: 'سيتم تحديث نظام الجرد غداً. يرجى حفظ جميع البيانات قبل الساعة 11:00 مساءً',
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Demo notifications created for all users');

  // Create Sample Business Plans
  const businessPlans = await Promise.all([
    // 1. Employee Improvement Plan for Warehouse user
    prisma.businessPlan.create({
      data: {
        userId: managerUser!.id,
        title: 'خطة تحسين الأداء - مسؤول المستودع',
        type: 'improvement',
        priority: 'high',
        status: 'active',
        description: 'خطة تحسين أداء موظف المستودع لزيادة الكفاءة وتقليل الأخطاء في إدارة المخزون.',
        startDate: new Date(now.getTime()).toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 5000,
        assignedTo: managerUser!.fullName,
        employeeId: warehouseUser!.id,
        employeeName: warehouseUser!.fullName,
        goals: JSON.stringify([
          {
            id: 1,
            description: 'تقليل أخطاء الجرد',
            targetValue: '95',
            currentValue: '75',
            unit: '%'
          },
          {
            id: 2,
            description: 'زيادة سرعة معالجة الطلبات',
            targetValue: '20',
            currentValue: '35',
            unit: 'دقيقة'
          },
          {
            id: 3,
            description: 'تحسين تنظيم المستودع',
            targetValue: '100',
            currentValue: '60',
            unit: '%'
          }
        ]),
        tasks: JSON.stringify([
          {
            id: 1,
            title: 'جلسة تدريب على نظام الجرد',
            description: 'تدريب عملي على استخدام نظام الجرد الإلكتروني',
            dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: warehouseUser!.fullName
          },
          {
            id: 2,
            title: 'إعادة تنظيم المستودع',
            description: 'تطبيق نظام تصنيف جديد للقطع',
            dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: warehouseUser!.fullName
          },
          {
            id: 3,
            title: 'مراجعة أسبوعية للأداء',
            description: 'اجتماع أسبوعي لمتابعة التقدم',
            dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'in-progress',
            assignedTo: managerUser!.fullName
          }
        ])
      }
    }),

    // 2. Business Expansion Plan
    prisma.businessPlan.create({
      data: {
        userId: managerUser!.id,
        title: 'خطة التوسع - فرع جديد في طرابلس',
        type: 'expansion',
        priority: 'critical',
        status: 'active',
        description: 'خطة استراتيجية لافتتاح فرع جديد لسلسلة البارون في منطقة طرابلس خلال 6 أشهر.',
        startDate: new Date(now.getTime()).toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 250000,
        assignedTo: managerUser!.fullName,
        goals: JSON.stringify([
          {
            id: 1,
            description: 'استئجار موقع مناسب',
            targetValue: '1',
            currentValue: '0',
            unit: 'موقع'
          },
          {
            id: 2,
            description: 'شراء أسطول السيارات',
            targetValue: '15',
            currentValue: '0',
            unit: 'سيارة'
          },
          {
            id: 3,
            description: 'توظيف فريق عمل',
            targetValue: '8',
            currentValue: '2',
            unit: 'موظف'
          },
          {
            id: 4,
            description: 'تحقيق إيرادات شهرية',
            targetValue: '50000',
            currentValue: '0',
            unit: 'د.ل'
          }
        ]),
        tasks: JSON.stringify([
          {
            id: 1,
            title: 'دراسة السوق في طرابلس',
            description: 'تحليل المنافسين والطلب على خدمات تأجير السيارات',
            dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'completed',
            assignedTo: managerUser!.fullName
          },
          {
            id: 2,
            title: 'البحث عن موقع مناسب',
            description: 'تحديد وزيارة المواقع المحتملة للفرع الجديد',
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'in-progress',
            assignedTo: managerUser!.fullName
          },
          {
            id: 3,
            title: 'إعداد خطة التوظيف',
            description: 'تحديد الوظائف المطلوبة والإعلان عنها',
            dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: managerUser!.fullName
          },
          {
            id: 4,
            title: 'شراء السيارات',
            description: 'التفاوض مع الموردين وشراء أسطول السيارات الأولي',
            dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: managerUser!.fullName
          },
          {
            id: 5,
            title: 'افتتاح الفرع',
            description: 'تجهيز المكتب وإطلاق الفرع رسمياً',
            dueDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: managerUser!.fullName
          }
        ])
      }
    }),

    // 3. Financial Planning
    prisma.businessPlan.create({
      data: {
        userId: managerUser!.id,
        title: 'الخطة المالية - تقليل التكاليف التشغيلية',
        type: 'financial',
        priority: 'high',
        status: 'active',
        description: 'خطة مالية لتقليل التكاليف التشغيلية بنسبة 15% خلال الربع القادم مع الحفاظ على جودة الخدمة.',
        startDate: new Date(now.getTime()).toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 10000,
        assignedTo: managerUser!.fullName,
        goals: JSON.stringify([
          {
            id: 1,
            description: 'تقليل تكاليف الصيانة',
            targetValue: '20',
            currentValue: '5',
            unit: '%'
          },
          {
            id: 2,
            description: 'تقليل تكاليف الوقود',
            targetValue: '10',
            currentValue: '0',
            unit: '%'
          },
          {
            id: 3,
            description: 'تحسين معدل الاستغلال',
            targetValue: '85',
            currentValue: '72',
            unit: '%'
          }
        ]),
        tasks: JSON.stringify([
          {
            id: 1,
            title: 'مراجعة عقود الصيانة',
            description: 'التفاوض مع مزودي خدمات الصيانة للحصول على أسعار أفضل',
            dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'in-progress',
            assignedTo: 'محمد الميكانيكي'
          },
          {
            id: 2,
            title: 'برنامج الصيانة الوقائية',
            description: 'تطبيق جدول صيانة منتظم لتقليل الأعطال المفاجئة',
            dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: 'محمد الميكانيكي'
          },
          {
            id: 3,
            title: 'تحسين استراتيجية التسعير',
            description: 'مراجعة الأسعار لزيادة معدل الحجوزات',
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: managerUser!.fullName
          }
        ])
      }
    }),

    // 4. Marketing Campaign Plan
    prisma.businessPlan.create({
      data: {
        userId: managerUser!.id,
        title: 'حملة تسويقية - موسم الصيف 2025',
        type: 'marketing',
        priority: 'medium',
        status: 'draft',
        description: 'حملة تسويقية شاملة لزيادة الحجوزات في موسم الصيف وجذب عملاء جدد.',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 25000,
        assignedTo: managerUser!.fullName,
        goals: JSON.stringify([
          {
            id: 1,
            description: 'زيادة عدد العملاء الجدد',
            targetValue: '200',
            currentValue: '0',
            unit: 'عميل'
          },
          {
            id: 2,
            description: 'زيادة المتابعين على وسائل التواصل',
            targetValue: '5000',
            currentValue: '1200',
            unit: 'متابع'
          },
          {
            id: 3,
            description: 'زيادة الحجوزات',
            targetValue: '30',
            currentValue: '0',
            unit: '%'
          }
        ]),
        tasks: JSON.stringify([
          {
            id: 1,
            title: 'تصميم المواد الإعلانية',
            description: 'إنشاء محتوى إبداعي للحملة',
            dueDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: 'فريق التسويق'
          },
          {
            id: 2,
            title: 'إطلاق عروض خاصة',
            description: 'تقديم خصومات وعروض للموسم',
            dueDate: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: managerUser!.fullName
          },
          {
            id: 3,
            title: 'حملة على وسائل التواصل',
            description: 'إعلانات ممولة على فيسبوك وإنستغرام',
            dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: 'فريق التسويق'
          }
        ])
      }
    }),

    // 5. Operational Excellence Plan
    prisma.businessPlan.create({
      data: {
        userId: managerUser!.id,
        title: 'تحسين العمليات التشغيلية',
        type: 'operational',
        priority: 'medium',
        status: 'active',
        description: 'خطة شاملة لتحسين الكفاءة التشغيلية وتقليل وقت معالجة الحجوزات والتسليم.',
        startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: 8000,
        assignedTo: managerUser!.fullName,
        goals: JSON.stringify([
          {
            id: 1,
            description: 'تقليل وقت معالجة الحجز',
            targetValue: '10',
            currentValue: '25',
            unit: 'دقيقة'
          },
          {
            id: 2,
            description: 'تقليل وقت تسليم السيارة',
            targetValue: '15',
            currentValue: '30',
            unit: 'دقيقة'
          },
          {
            id: 3,
            description: 'زيادة رضا العملاء',
            targetValue: '95',
            currentValue: '82',
            unit: '%'
          }
        ]),
        tasks: JSON.stringify([
          {
            id: 1,
            title: 'تحديث نظام الحجز',
            description: 'تطوير واجهة أسرع وأسهل للاستخدام',
            dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'in-progress',
            assignedTo: 'فريق تقنية المعلومات'
          },
          {
            id: 2,
            title: 'تدريب موظفي الاستقبال',
            description: 'ورش عمل لتحسين خدمة العملاء',
            dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'completed',
            assignedTo: receptionUser!.fullName
          },
          {
            id: 3,
            title: 'تبسيط إجراءات التسليم',
            description: 'إعداد قوائم تحقق رقمية للتسليم السريع',
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            assignedTo: receptionUser!.fullName
          }
        ])
      }
    })
  ]);

  console.log('✅ Sample business plans created');

  // Create Demo Maintenance Records
  await prisma.maintenanceRecord.create({
    data: {
      carId: cars[1].id,
      userId: adminUser.id,
      type: 'routine',
      description: 'تغيير زيت وفلاتر',
      cost: 450,
      mileageAtService: 7500,
      serviceDate: new Date('2024-10-15'),
      nextServiceDate: new Date('2025-01-15'),
      status: 'completed',
    },
  });

  console.log('✅ Demo maintenance records created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Email: admin@baron.local');
  console.log('   Password: Admin123!');
  console.log('\n📊 Demo Data:');
  console.log(`   - ${cars.length} cars`);
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${bookings.length} bookings`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
