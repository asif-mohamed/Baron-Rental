const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    select: {
      bookingNumber: true,
      initialOdometer: true,
      finalOdometer: true,
      status: true,
      car: {
        select: {
          brand: true,
          model: true,
          mileage: true,
        }
      }
    },
    orderBy: { bookingNumber: 'asc' }
  });

  console.log('\n📊 Booking Odometer Data:\n');
  console.log('Booking #       | Initial | Final   | Status    | Car              | Mileage');
  console.log('----------------|---------|---------|-----------|------------------|--------');
  
  bookings.forEach(b => {
    const initial = b.initialOdometer || 'N/A';
    const final = b.finalOdometer || 'N/A';
    const carInfo = `${b.car.brand} ${b.car.model}`;
    console.log(
      `${b.bookingNumber.padEnd(15)} | ${String(initial).padEnd(7)} | ${String(final).padEnd(7)} | ${b.status.padEnd(9)} | ${carInfo.padEnd(16)} | ${b.car.mileage}`
    );
  });

  // Check for extra km charges
  const extraKmTransactions = await prisma.transaction.findMany({
    where: { category: 'extra_km_charge' },
    select: {
      amount: true,
      description: true,
      booking: {
        select: {
          bookingNumber: true,
        }
      }
    }
  });

  if (extraKmTransactions.length > 0) {
    console.log('\n💰 Extra Km Charge Transactions:\n');
    extraKmTransactions.forEach(t => {
      console.log(`${t.booking.bookingNumber}: ${t.amount} LYD`);
      console.log(`   ${t.description}\n`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
