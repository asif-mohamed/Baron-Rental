import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllCars = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;

    const where: any = { isDeleted: false };

    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { brand: { contains: search as string } },
        { model: { contains: search as string } },
        { plateNumber: { contains: search as string } },
      ];
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        include: {
          maintenanceProfile: true,
          _count: { select: { bookings: true } },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.car.count({ where }),
    ]);

    res.json({
      cars,
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

export const getCarById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: {
        maintenanceProfile: true,
        bookings: { take: 5, orderBy: { createdAt: 'desc' } },
        maintenanceRecords: { take: 5, orderBy: { serviceDate: 'desc' } },
      },
    });

    if (!car || car.isDeleted) {
      throw new AppError('Car not found', 404);
    }

    res.json({ car });
  } catch (error) {
    next(error);
  }
};

export const createCar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const car = await prisma.car.create({
      data: req.body,
      include: { maintenanceProfile: true },
    });

    res.status(201).json({ car });
  } catch (error) {
    next(error);
  }
};

export const updateCar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const car = await prisma.car.update({
      where: { id: req.params.id },
      data: req.body,
      include: { maintenanceProfile: true },
    });

    res.json({ car });
  } catch (error) {
    next(error);
  }
};

export const updateCarStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    const car = await prisma.car.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ car });
  } catch (error) {
    next(error);
  }
};

export const deleteCar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const car = await prisma.car.update({
      where: { id: req.params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'sold',
      },
    });

    res.json({ message: 'Car deleted successfully', car });
  } catch (error) {
    next(error);
  }
};

export const getAvailableCars = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      isDeleted: false,
      status: 'available',
    };

    let cars = await prisma.car.findMany({
      where,
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        plateNumber: true,
        dailyRate: true,
        category: true,
      },
    });

    // Filter out cars with conflicting bookings
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const conflicts = await prisma.booking.findMany({
        where: {
          status: { in: ['confirmed', 'active'] },
          OR: [
            { startDate: { lte: end }, endDate: { gte: start } },
          ],
        },
        select: { carId: true },
      });

      const conflictCarIds = new Set(conflicts.map(b => b.carId));
      cars = cars.filter(car => !conflictCarIds.has(car.id));
    }

    res.json({ cars });
  } catch (error) {
    next(error);
  }
};
