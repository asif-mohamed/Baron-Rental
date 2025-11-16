import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { emitNotification } from '../socket';

export const initScheduledJobs = () => {
  // Check for overdue bookings every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running overdue bookings check...');

    const now = new Date();
    const overdueBookings = await prisma.booking.findMany({
      where: {
        status: 'active',
        endDate: { lt: now },
      },
      include: { car: true, customer: true },
    });

    for (const booking of overdueBookings) {
      await prisma.notification.create({
        data: {
          type: 'overdue',
          title: 'حجز متأخر',
          message: `الحجز ${booking.bookingNumber} متأخر - العميل: ${booking.customer.fullName}`,
          data: JSON.stringify({ bookingId: booking.id }),
        },
      });

      emitNotification('booking:overdue', booking);
    }

    console.log(`Found ${overdueBookings.length} overdue bookings`);
  });

  // Check for pickups due today every day at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running pickup reminders check...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPickups = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        startDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { car: true, customer: true },
    });

    for (const booking of todayPickups) {
      await prisma.notification.create({
        data: {
          type: 'pickup_due',
          title: 'استلام سيارة اليوم',
          message: `موعد استلام ${booking.car.brand} ${booking.car.model} - العميل: ${booking.customer.fullName}`,
          data: JSON.stringify({ bookingId: booking.id }),
        },
      });

      emitNotification('booking:pickup_due', booking);
    }

    console.log(`Found ${todayPickups.length} pickups due today`);
  });

  // Check for maintenance due based on profiles every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running maintenance reminders check...');

    const cars = await prisma.car.findMany({
      where: {
        isDeleted: false,
        maintenanceProfileId: { not: null },
      },
      include: {
        maintenanceProfile: true,
        maintenanceRecords: {
          orderBy: { serviceDate: 'desc' },
          take: 1,
        },
      },
    });

    const now = new Date();

    for (const car of cars) {
      if (!car.maintenanceProfile) continue;

      const lastMaintenance = car.maintenanceRecords[0];
      let needsMaintenance = false;

      // Check mileage threshold
      if (car.maintenanceProfile.mileageThreshold && lastMaintenance) {
        const mileageSinceService = car.mileage - (lastMaintenance.mileageAtService || 0);
        if (mileageSinceService >= car.maintenanceProfile.mileageThreshold) {
          needsMaintenance = true;
        }
      }

      // Check days threshold
      if (car.maintenanceProfile.daysThreshold && lastMaintenance) {
        const daysSinceService = Math.floor(
          (now.getTime() - lastMaintenance.serviceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceService >= car.maintenanceProfile.daysThreshold) {
          needsMaintenance = true;
        }
      }

      if (needsMaintenance) {
        await prisma.notification.create({
          data: {
            type: 'maintenance_due',
            title: 'صيانة مستحقة',
            message: `السيارة ${car.brand} ${car.model} (${car.plateNumber}) تحتاج صيانة`,
            data: JSON.stringify({ carId: car.id }),
          },
        });

        emitNotification('maintenance:due', car);
      }
    }

    console.log('Maintenance check completed');
  });

  console.log('✅ Scheduled jobs initialized');
};
