const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });

    console.log('Admin role ID:', adminRole?.id);
    console.log('Total permissions assigned:', adminRole?.permissions.length || 0);
    
    if (adminRole) {
      const customerCreate = adminRole.permissions.find(
        rp => rp.permission.resource === 'customers' && rp.permission.action === 'create'
      );
      console.log('Has customers-create permission:', !!customerCreate);
      
      console.log('\nAll assigned permissions:');
      adminRole.permissions.forEach(rp => {
        console.log(`  - ${rp.permission.resource}:${rp.permission.action}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
