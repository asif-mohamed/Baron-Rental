const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@baron.com' },
      include: { role: true }
    });

    console.log('Admin user:', {
      id: adminUser?.id,
      email: adminUser?.email,
      roleId: adminUser?.roleId,
      roleName: adminUser?.role?.name
    });

    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' }
    });

    console.log('\nAdmin role:', {
      id: adminRole?.id,
      name: adminRole?.name
    });

    console.log('\nRoleId match:', adminUser?.roleId === adminRole?.id);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
