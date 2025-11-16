import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalCars,
      availableCars,
      rentedCars,
      maintenanceCars,
      totalCustomers,
      activeBookings,
      todayBookings,
      monthRevenue,
    ] = await Promise.all([
      prisma.car.count({ where: { isDeleted: false } }),
      prisma.car.count({ where: { isDeleted: false, status: 'available' } }),
      prisma.car.count({ where: { status: 'rented' } }),
      prisma.car.count({ where: { status: 'maintenance' } }),
      prisma.customer.count({ where: { isDeleted: false } }),
      prisma.booking.count({ where: { status: { in: ['confirmed', 'active'] } } }),
      prisma.booking.count({
        where: {
          startDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'payment',
          transactionDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      stats: {
        fleet: {
          total: totalCars,
          available: availableCars,
          rented: rentedCars,
          maintenance: maintenanceCars,
        },
        customers: totalCustomers,
        bookings: {
          active: activeBookings,
          today: todayBookings,
        },
        revenue: {
          month: monthRevenue._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where: any = {
      type: 'payment',
    };

    if (startDate) {
      where.transactionDate = { gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.transactionDate = {
        ...(where.transactionDate || {}),
        lte: new Date(endDate as string),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'asc' },
    });

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};

export const getFleetUtilization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cars = await prisma.car.findMany({
      where: { isDeleted: false },
      include: {
        _count: {
          select: {
            bookings: { where: { status: { in: ['confirmed', 'active', 'completed'] } } },
          },
        },
      },
    });

    res.json({ cars });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};

    if (startDate) {
      where.serviceDate = { gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.serviceDate = {
        ...(where.serviceDate || {}),
        lte: new Date(endDate as string),
      };
    }

    const records = await prisma.maintenanceRecord.findMany({
      where,
      include: { car: true },
      orderBy: { serviceDate: 'desc' },
    });

    const totalCost = records.reduce((sum, record) => sum + record.cost, 0);

    res.json({ records, totalCost });
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, startDate, endDate } = req.body;

    let data: any[] = [];

    switch (type) {
      case 'bookings':
        data = await prisma.booking.findMany({
          where: {
            startDate: { gte: new Date(startDate) },
            endDate: { lte: new Date(endDate) },
          },
          include: { car: true, customer: true },
        });
        break;
      case 'transactions':
        data = await prisma.transaction.findMany({
          where: {
            transactionDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: { booking: true },
        });
        break;
      case 'maintenance':
        data = await prisma.maintenanceRecord.findMany({
          where: {
            serviceDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: { car: true },
        });
        break;
      default:
        data = [];
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

export const getEmployeePerformance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all users with their bookings and transactions
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: { not: 'Admin' }, // Exclude admin from performance tracking
        },
      },
      include: {
        role: { select: { name: true } },
        bookings: {
          where: {
            createdAt: { gte: start, lte: end },
          },
          include: {
            transactions: true,
          },
        },
        transactions: {
          where: {
            transactionDate: { gte: start, lte: end },
          },
        },
      },
    });

    // Calculate performance metrics for each employee
    const employees = users.map((user) => {
      const totalBookings = user.bookings.length;
      const completedBookings = user.bookings.filter((b) => b.status === 'completed').length;
      const totalRevenue = user.transactions
        .filter((t) => t.type === 'payment' || t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate rating based on completion rate and revenue
      const completionRate = totalBookings > 0 ? completedBookings / totalBookings : 0;
      const revenueScore = Math.min(totalRevenue / 10000, 1); // Normalize to 0-1 scale
      const averageRating = (completionRate * 0.6 + revenueScore * 0.4) * 5; // Scale to 5

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.name,
        stats: {
          totalBookings,
          totalRevenue: Math.round(totalRevenue),
          completedTasks: completedBookings,
          pendingTasks: totalBookings - completedBookings,
          averageRating: Math.min(averageRating, 5),
          tasksCompletedOnTime: completedBookings, // Simplified for now
          totalTasks: totalBookings,
        },
      };
    });

    // Calculate team stats
    const teamStats = {
      totalEmployees: employees.length,
      totalRevenue: employees.reduce((sum, e) => sum + e.stats.totalRevenue, 0),
      completedBookings: employees.reduce((sum, e) => sum + e.stats.completedTasks, 0),
      averagePerformance: employees.length > 0
        ? employees.reduce((sum, e) => sum + e.stats.averageRating, 0) / employees.length
        : 0,
    };

    res.json({ employees, teamStats });
  } catch (error) {
    next(error);
  }
};

export const getManagerOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch all stats in parallel
    const [
      totalRevenue,
      monthlyRevenue,
      totalBookings,
      activeBookings,
      totalCustomers,
      totalCars,
      maintenanceDue,
      // Pending approvals would come from a separate approvals table if you have one
    ] = await Promise.all([
      // Total revenue (all time)
      prisma.transaction.aggregate({
        where: {
          type: { in: ['payment', 'income'] },
        },
        _sum: { amount: true },
      }),
      // Monthly revenue
      prisma.transaction.aggregate({
        where: {
          type: { in: ['payment', 'income'] },
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),
      // Total bookings
      prisma.booking.count(),
      // Active bookings
      prisma.booking.count({
        where: {
          status: { in: ['confirmed', 'active'] },
        },
      }),
      // Total customers
      prisma.customer.count({
        where: { isDeleted: false },
      }),
      // Total cars
      prisma.car.count({
        where: { isDeleted: false },
      }),
      // Maintenance due (cars in maintenance status or with upcoming maintenance)
      prisma.car.count({
        where: {
          OR: [
            { status: 'maintenance' },
            { isDeleted: false, status: 'available' }, // Could add logic for maintenance schedule
          ],
        },
      }),
    ]);

    // For pending approvals, we'll use a simple placeholder
    // In a real system, you'd have an approvals table
    const pendingApprovals: any[] = [];

    const stats = {
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      totalBookings,
      activeBookings,
      totalCustomers,
      totalCars,
      pendingApprovals: pendingApprovals.length,
      maintenanceDue: 0, // Will be calculated from maintenance records
    };

    // Get maintenance records that are due or overdue
    const maintenanceRecords = await prisma.maintenanceRecord.count({
      where: {
        nextServiceDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due within 7 days
        },
      },
    });

    stats.maintenanceDue = maintenanceRecords;

    res.json({ stats, approvals: pendingApprovals });
  } catch (error) {
    next(error);
  }
};

export const getFinancialOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch financial data in parallel
    const [
      totalRevenueAgg,
      totalExpensesAgg,
      monthlyRevenueAgg,
      monthlyExpensesAgg,
      pendingPayments,
      recentTransactions,
    ] = await Promise.all([
      // Total revenue (all time)
      prisma.transaction.aggregate({
        where: { type: { in: ['payment', 'income'] } },
        _sum: { amount: true },
      }),
      // Total expenses (all time)
      prisma.transaction.aggregate({
        where: { type: { in: ['expense', 'refund'] } },
        _sum: { amount: true },
      }),
      // Monthly revenue
      prisma.transaction.aggregate({
        where: {
          type: { in: ['payment', 'income'] },
          transactionDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // Monthly expenses
      prisma.transaction.aggregate({
        where: {
          type: { in: ['expense', 'refund'] },
          transactionDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // Pending payments (bookings with unpaid balance)
      prisma.booking.count({
        where: {
          status: { in: ['confirmed', 'active'] },
          paidAmount: { lt: prisma.booking.fields.totalAmount },
        },
      }),
      // Recent transactions (last 10)
      prisma.transaction.findMany({
        take: 10,
        orderBy: { transactionDate: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          category: true,
          description: true,
          transactionDate: true,
        },
      }),
    ]);

    const totalRevenue = totalRevenueAgg._sum.amount || 0;
    const totalExpenses = totalExpensesAgg._sum.amount || 0;
    const monthlyRevenue = monthlyRevenueAgg._sum.amount || 0;
    const monthlyExpenses = monthlyExpensesAgg._sum.amount || 0;

    const stats = {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      monthlyRevenue,
      monthlyExpenses,
      pendingPayments,
    };

    res.json({ stats, transactions: recentTransactions });
  } catch (error) {
    next(error);
  }
};

export const getReceptionistStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch receptionist-specific stats
    const [
      todayBookings,
      activeBookings,
      pendingPickups,
      availableCars,
    ] = await Promise.all([
      // Today's bookings
      prisma.booking.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      // Active bookings
      prisma.booking.count({
        where: { status: { in: ['confirmed', 'active'] } },
      }),
      // Pending pickups (confirmed bookings with today's or past start date, not yet picked up)
      prisma.booking.count({
        where: {
          status: 'confirmed',
          startDate: { lte: new Date() },
          pickupDate: null,
        },
      }),
      // Available cars count
      prisma.car.count({
        where: { status: 'available', isDeleted: false },
      }),
    ]);

    const stats = {
      todayBookings,
      activeBookings,
      pendingPickups,
      availableCars,
    };

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch warehouse-specific data
    const [
      totalCars,
      availableCars,
      rentedCars,
      maintenanceCars,
      pendingPickups,
      pendingReturns,
      pickupRequests,
    ] = await Promise.all([
      // Total fleet
      prisma.car.count({ where: { isDeleted: false } }),
      // Available cars
      prisma.car.count({ where: { status: 'available', isDeleted: false } }),
      // Rented cars
      prisma.car.count({ where: { status: 'rented' } }),
      // Cars in maintenance
      prisma.car.count({ where: { status: 'maintenance' } }),
      // Pending pickups (confirmed bookings, not picked up yet)
      prisma.booking.count({
        where: {
          status: 'confirmed',
          pickupDate: null,
          startDate: { lte: new Date() },
        },
      }),
      // Pending returns (active bookings with end date today or past)
      prisma.booking.count({
        where: {
          status: 'active',
          endDate: { lte: new Date() },
          returnDate: null,
        },
      }),
      // Get actual pickup requests with details
      prisma.booking.findMany({
        where: {
          status: 'confirmed',
          pickupDate: null,
          startDate: { lte: new Date() },
        },
        take: 10,
        orderBy: { startDate: 'asc' },
        include: {
          customer: {
            select: { fullName: true, phone: true },
          },
          car: {
            select: { brand: true, model: true, plateNumber: true },
          },
        },
      }),
    ]);

    const stats = {
      totalCars,
      available: availableCars,
      rented: rentedCars,
      maintenance: maintenanceCars,
      pendingPickups,
      pendingReturns,
    };

    // Map pickup requests to match frontend interface
    const formattedPickupRequests = pickupRequests.map((booking) => ({
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      customer: booking.customer,
      car: booking.car,
      pickupDate: booking.startDate,
      status: booking.status,
    }));

    res.json({ stats, pickupRequests: formattedPickupRequests });
  } catch (error) {
    next(error);
  }
};

