const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    const carCount = await prisma.car.count();
    const customerCount = await prisma.customer.count();
    const bookingCount = await prisma.booking.count();
    const userCount = await prisma.user.count();
    
    console.log('=== Database Status ===');
    console.log('Cars:', carCount);
    console.log('Customers:', customerCount);
    console.log('Bookings:', bookingCount);
    console.log('Users:', userCount);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        include: { role: true }
      });
      console.log('\n=== Users ===');
      users.forEach(user => {
        console.log(`${user.email} - ${user.role.name}`);
      });
    }
    
    if (carCount > 0) {
      const cars = await prisma.car.findMany({ take: 3 });
      console.log('\n=== Sample Cars ===');
      cars.forEach(car => {
        console.log(`${car.brand} ${car.model} - ${car.plateNumber} - ${car.status}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
