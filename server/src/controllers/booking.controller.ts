import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitNotification } from '../socket';

const generateBookingNumber = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  return `BK-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${timestamp}`;
};

const calculateDays = (startDate: Date, endDate: Date): number => {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
};

export const getAllBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (startDate) where.startDate = { gte: new Date(startDate as string) };
    if (endDate) where.endDate = { lte: new Date(endDate as string) };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          car: true,
          customer: true,
          user: { select: { fullName: true } },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        car: true,
        customer: true,
        user: { select: { fullName: true, email: true } },
        transactions: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

export const checkAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { carId, startDate, endDate, excludeBookingId } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const where: any = {
      carId,
      status: { in: ['confirmed', 'active'] },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } },
      ],
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const conflicts = await prisma.booking.findMany({ where });

    res.json({
      available: conflicts.length === 0,
      conflicts,
    });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { carId, customerId, startDate, endDate, dailyRate, extras = 0, taxes = 0, discount = 0, notes } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check availability
    const conflicts = await prisma.booking.findMany({
      where: {
        carId,
        status: { in: ['confirmed', 'active'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new AppError('Car is not available for the selected dates', 400);
    }

    const totalDays = calculateDays(start, end);
    const subtotal = totalDays * dailyRate;
    const totalAmount = subtotal + extras + taxes - discount;

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        carId,
        customerId,
        userId: req.user!.id,
        startDate: start,
        endDate: end,
        totalDays,
        dailyRate,
        subtotal,
        extras,
        taxes,
        discount,
        totalAmount,
        status: 'confirmed',
        notes,
      },
      include: {
        car: true,
        customer: true,
      },
    });

    // Update car status
    await prisma.car.update({
      where: { id: carId },
      data: { status: 'rented' },
    });

    // Get Warehouse role ID
    const warehouseRole = await prisma.role.findUnique({
      where: { name: 'Warehouse' },
    });

    // Create notification for general users
    await prisma.notification.create({
      data: {
        type: 'booking_created',
        title: 'حجز جديد',
        message: `حجز جديد للعميل ${booking.customer.fullName} - ${booking.car.brand} ${booking.car.model}`,
        data: JSON.stringify({ bookingId: booking.id }),
      },
    });

    // Create notification for Warehouse staff (Inventory Managers)
    if (warehouseRole) {
      await prisma.notification.create({
        data: {
          roleId: warehouseRole.id,
          type: 'car_pickup_needed',
          title: '🚗 طلب توصيل سيارة',
          message: `يرجى توصيل ${booking.car.brand} ${booking.car.model} (${booking.car.plateNumber}) إلى الاستقبال للعميل ${booking.customer.fullName}`,
          data: JSON.stringify({ 
            bookingId: booking.id,
            carId: booking.carId,
            plateNumber: booking.car.plateNumber,
            customerName: booking.customer.fullName,
          }),
        },
      });
    }

    // Emit socket event
    emitNotification('booking:created', booking);

    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        car: true,
        customer: true,
      },
    });

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });

    // Update car status back to available
    await prisma.car.update({
      where: { id: booking.carId },
      data: { status: 'available' },
    });

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

export const pickupBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'active',
        pickupDate: new Date(),
      },
      include: {
        car: true,
        customer: true,
      },
    });

    // Emit pickup notification
    emitNotification('booking:pickup', booking);

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

export const returnBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { mileage } = req.body;

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        returnDate: new Date(),
      },
    });

    // Update car status and mileage
    await prisma.car.update({
      where: { id: booking.carId },
      data: {
        status: 'available',
        mileage: mileage || undefined,
      },
    });

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};
