import express, { Application } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import carRoutes from './routes/car.routes';
import customerRoutes from './routes/customer.routes';
import bookingRoutes from './routes/booking.routes';
import transactionRoutes from './routes/transaction.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import attachmentRoutes from './routes/attachment.routes';
import uploadRoutes from './routes/upload';
import notificationRoutes from './routes/notification.routes';
import planRoutes from './routes/plan.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';
import { initScheduledJobs } from './jobs/scheduled.jobs';
import { setupSocketIO } from './socket';

config();

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Setup Socket.IO
setupSocketIO(io);

// Make io available to routes
app.set('io', io);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

// Start scheduled jobs
initScheduledJobs();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
});

export { io };
