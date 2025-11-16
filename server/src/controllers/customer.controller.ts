import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const where: any = { isDeleted: false };

    if (search) {
      where.OR = [
        { fullName: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } },
        { nationalId: { contains: search as string } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { bookings: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers,
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

export const searchCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    const customers = await prisma.customer.findMany({
      where: {
        isDeleted: false,
        OR: [
          { fullName: { contains: q as string } },
          { phone: { contains: q as string } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
      take: 10,
    });

    res.json({ customers });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          include: { car: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer || customer.isDeleted) {
      throw new AppError('Customer not found', 404);
    }

    res.json({ customer });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Clean the data by removing undefined values
    const cleanData = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== undefined)
    );

    const customer = await prisma.customer.create({
      data: cleanData as any,
    });

    res.status(201).json({ customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    next(error);
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Clean the data by removing undefined values
    const cleanData = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== undefined)
    );

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: cleanData as any,
    });

    res.json({ customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    next(error);
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    res.json({ message: 'Customer deleted successfully', customer });
  } catch (error) {
    next(error);
  }
};
