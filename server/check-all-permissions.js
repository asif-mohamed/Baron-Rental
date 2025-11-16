const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllPermissions() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    roles.forEach(role => {
      console.log(`\n${role.name} Role (${role.id}):`);
      console.log(`Total permissions: ${role.permissions.length}`);
      
      if (role.permissions.length > 0) {
        console.log('Permissions:');
        role.permissions.forEach(rp => {
          console.log(`  - ${rp.permission.resource}:${rp.permission.action}`);
        });
      } else {
        console.log('NO PERMISSIONS ASSIGNED!');
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPermissions();
