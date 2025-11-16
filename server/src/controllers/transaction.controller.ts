import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate) where.transactionDate = { gte: new Date(startDate as string) };
    if (endDate) {
      where.transactionDate = {
        ...(where.transactionDate || {}),
        lte: new Date(endDate as string),
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          booking: { include: { car: true, customer: true } },
          user: { select: { fullName: true } },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
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

export const getTransactionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        booking: { include: { car: true, customer: true } },
        user: { select: { fullName: true, email: true } },
      },
    });

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...req.body,
        userId: req.user!.id,
      },
      include: {
        booking: true,
        user: { select: { fullName: true } },
      },
    });

    // Update booking paid amount if linked
    if (transaction.bookingId && transaction.type === 'payment') {
      const booking = await prisma.booking.findUnique({
        where: { id: transaction.bookingId },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: transaction.bookingId },
          data: { paidAmount: booking.paidAmount + transaction.amount },
        });
      }
    }

    res.status(201).json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.transaction.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};
