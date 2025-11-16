const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMaintenanceRecords() {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      include: {
        car: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total maintenance records: ${records.length}\n`);
    
    records.forEach(record => {
      console.log(`ID: ${record.id}`);
      console.log(`Car: ${record.car.model}`);
      console.log(`Type: ${record.type}`);
      console.log(`Status: ${record.status}`);
      console.log(`Service Date: ${record.serviceDate}`);
      console.log(`Performed by: ${record.user.fullName}`);
      console.log(`Cost: ${record.cost}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMaintenanceRecords();
