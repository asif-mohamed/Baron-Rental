const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@baron.local' },
      include: { role: true }
    });

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('User found:', {
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      isActive: user.isActive
    });

    console.log('\nTesting password: Admin123!');
    const isMatch = await bcrypt.compare('Admin123!', user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('\nStored password hash:', user.password.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
