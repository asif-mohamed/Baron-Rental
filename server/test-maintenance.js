const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMaintenance() {
  try {
    // Get mechanic user
    const mechanic = await prisma.user.findFirst({
      where: { email: 'mechanic@baron.local' }
    });

    // Get a car
    const car = await prisma.car.findFirst();

    if (!mechanic || !car) {
      console.log('Missing mechanic or car');
      return;
    }

    console.log('Mechanic:', mechanic.fullName, mechanic.id);
    console.log('Car:', car.model, car.id);

    // Try to create maintenance record
    const maintenance = await prisma.maintenanceRecord.create({
      data: {
        carId: car.id,
        type: 'preventive',
        description: 'Test maintenance',
        scheduledDate: new Date(),
        status: 'pending',
        performedById: mechanic.id,
        cost: 100,
      }
    });

    console.log('✅ Maintenance created:', maintenance.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testMaintenance();
