const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    const result = await prisma.$queryRaw`PRAGMA table_info(notifications)`;
    console.log('Notifications table columns:');
    result.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
