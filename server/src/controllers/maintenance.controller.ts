import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllMaintenance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { carId, status, type, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (carId) where.carId = carId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        include: {
          car: true,
          user: { select: { fullName: true } },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { serviceDate: 'desc' },
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    res.json({
      records,
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

export const getMaintenanceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const record = await prisma.maintenanceRecord.findUnique({
      where: { id: req.params.id },
      include: {
        car: true,
        user: { select: { fullName: true, email: true } },
        attachments: true,
      },
    });

    res.json({ record });
  } catch (error) {
    next(error);
  }
};

export const createMaintenance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { carId, type, description, cost, serviceDate, nextServiceDate, status, notes } = req.body;

    const record = await prisma.maintenanceRecord.create({
      data: {
        carId,
        userId: req.user!.id,
        type,
        description,
        cost: cost || 0,
        serviceDate: new Date(serviceDate),
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
        status: status || 'scheduled',
        notes,
      },
      include: { car: true },
    });

    // Update car status if maintenance is in-progress
    if (status === 'in-progress') {
      await prisma.car.update({
        where: { id: carId },
        data: { status: 'maintenance' },
      });
    }

    res.status(201).json({ record });
  } catch (error) {
    next(error);
  }
};

export const updateMaintenance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const record = await prisma.maintenanceRecord.update({
      where: { id: req.params.id },
      data: req.body,
      include: { car: true },
    });

    // If maintenance is completed, update car status back to available
    if (req.body.status === 'completed') {
      await prisma.car.update({
        where: { id: record.carId },
        data: { status: 'available' },
      });
    }

    res.json({ record });
  } catch (error) {
    next(error);
  }
};

export const deleteMaintenance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.maintenanceRecord.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceProfiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profiles = await prisma.maintenanceProfile.findMany({
      include: { _count: { select: { cars: true } } },
    });

    res.json({ profiles });
  } catch (error) {
    next(error);
  }
};

export const createMaintenanceProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.maintenanceProfile.create({
      data: req.body,
    });

    res.status(201).json({ profile });
  } catch (error) {
    next(error);
  }
};

export const getMechanicView = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all maintenance records with car details
    const allRecords = await prisma.maintenanceRecord.findMany({
      where: {
        status: {
          in: ['scheduled', 'in_progress', 'completed']
        }
      },
      include: {
        car: true,
      },
      orderBy: { serviceDate: 'desc' },
    });

    // Calculate stats
    const stats = {
      pending: allRecords.filter(r => r.status === 'scheduled').length,
      inProgress: allRecords.filter(r => r.status === 'in_progress').length,
      completedToday: allRecords.filter(r => 
        r.status === 'completed' && 
        new Date(r.serviceDate) >= today && 
        new Date(r.serviceDate) < tomorrow
      ).length,
      urgent: allRecords.filter(r => 
        (r.status === 'scheduled' || r.status === 'in_progress') && 
        r.type === 'repair'
      ).length,
    };

    // Get active tasks (scheduled and in-progress) - map 'scheduled' to 'pending' for frontend
    const tasks = allRecords
      .filter(r => r.status === 'scheduled' || r.status === 'in_progress')
      .map(record => ({
        id: record.id,
        car: {
          id: record.car.id,
          brand: record.car.brand,
          model: record.car.model,
          plateNumber: record.car.plateNumber,
          mileage: record.car.mileage,
        },
        type: record.type,
        description: record.description,
        status: record.status === 'scheduled' ? 'pending' : record.status,
        priority: record.type === 'repair' ? 'high' : 'medium',
        scheduledDate: record.serviceDate,
        cost: record.cost,
      }));

    res.json({ stats, tasks });
  } catch (error) {
    next(error);
  }
};
