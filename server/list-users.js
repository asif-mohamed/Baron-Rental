const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });

    console.log(`Total users: ${users.length}\n`);
    
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role.name}`);
      console.log(`Active: ${user.isActive}`);
      console.log(`RoleId: ${user.roleId}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
