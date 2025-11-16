import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';

const router = Router();

router.use(authenticate);

/**
 * GET /api/notifications
 * Get all notifications for current user (personal + role-based)
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id },
          { roleId: user.roleId },
          { userId: null, roleId: null }, // Global notifications
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json({ notification });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: user!.id },
          { roleId: user!.roleId },
        ],
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/sent
 * Get notifications sent by current user
 */
router.get('/sent', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { senderId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notifications/send
 * Send notification to user(s)
 * Admin can send to multiple users, others can send to one user at a time
 */
router.post('/send', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipientIds, type, title, message, requiresAction, actionType } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ error: 'Recipient IDs are required' });
    }

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'Type, title, and message are required' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { role: true },
    });

    // Non-admin users can only send to one recipient at a time
    if (user?.role.name !== 'Admin' && recipientIds.length > 1) {
      return res.status(403).json({ error: 'Only admins can send to multiple recipients' });
    }

    // Create notifications for each recipient
    const notifications = await Promise.all(
      recipientIds.map((recipientId: string) =>
        prisma.notification.create({
          data: {
            userId: recipientId,
            senderId: req.user!.id,
            type,
            title,
            message,
            requiresAction: requiresAction || false,
            actionType: actionType || null,
          },
        })
      )
    );

    res.status(201).json({
      message: 'Notifications sent successfully',
      count: notifications.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/notifications/acknowledge
 * Acknowledge/respond to a notification
 */
router.post('/acknowledge', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { notificationId, message } = req.body;

    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    // Mark original notification as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    // Get the original notification to send response to sender
    const originalNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (originalNotification?.senderId) {
      // Send acknowledgment back to sender
      await prisma.notification.create({
        data: {
          userId: originalNotification.senderId,
          senderId: req.user!.id,
          type: 'acknowledgment',
          title: `رد على: ${originalNotification.title}`,
          message: message || 'تم الاطلاع على الإشعار',
          data: JSON.stringify({ originalNotificationId: notificationId }),
        },
      });
    }

    res.json({ message: 'Acknowledgment sent' });
  } catch (error) {
    next(error);
  }
});

export default router;
