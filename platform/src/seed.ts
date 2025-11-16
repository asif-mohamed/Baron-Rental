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
  
  // Create demo tenant (optional)
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
      resourceLimits: {},
      configuration: {
        create: {
          displayName: 'Demo Baron Instance',
          theme: {},
          timezone: 'UTC',
          currency: 'USD',
          language: 'en',
          enabledFeatures: [],
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
