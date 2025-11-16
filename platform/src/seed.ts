import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding platform database...');
  
  // Create default platform admin user
  const hashedPassword = await bcrypt.hash('Admin123!@#Platform', 10);
  
  const admin = await prisma.platformUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@baron-platform.local',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  
  console.log(`Created platform admin: ${admin.username} (${admin.email})`);
  
  // Create Baron Car Rental tenant with proper configuration
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
          enabledRoles: [
            'ADMIN',
            'MANAGER',
            'RECEPTION',
            'ACCOUNTANT',
            'MECHANIC',
            'DRIVER',
            'WAREHOUSE',
          ],
          customSettings: {
            businessName: 'سلسلة البارون لتأجير السيارات',
            businessOwner: 'Asif Mohamed',
            ownerEmail: 'a.mohamed121991@outlook.com',
            address: 'المملكة العربية السعودية',
            vatEnabled: true,
            vatRate: 0.15,
            defaultRentalTerms: 'شروط وأحكام تأجير السيارات',
            maintenanceInterval: 5000,
            insuranceRequired: true,
          },
        },
      },
    },
  });
  
  console.log(`Created Baron tenant: ${baronTenant.name}`);
  
  // Create demo tenant (optional - for testing)
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Tenant',
      slug: 'demo',
      domain: 'demo.baron.local',
      databaseUrl: process.env.DEMO_TENANT_DATABASE_URL || '',
      plan: 'FREE',
      status: 'ACTIVE',
      resourceLimits: {
        maxUsers: 10,
        maxCars: 20,
        maxBookings: 100,
        storageGB: 5,
      },
      configuration: {
        create: {
          displayName: 'Demo Baron Instance',
          theme: {},
          timezone: 'UTC',
          currency: 'USD',
          language: 'en',
          enabledFeatures: ['fleet-management', 'booking-system'],
          enabledRoles: ['ACCOUNTANT', 'MANAGER', 'MECHANIC', 'DRIVER'],
          customSettings: {},
        },
      },
    },
  });
  
  console.log(`Created demo tenant: ${demoTenant.name}`);
  
  console.log('Seeding complete!');
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
