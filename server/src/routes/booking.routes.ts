import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth.middleware';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  checkAvailability,
  pickupBooking,
  returnBooking,
} from '../controllers/booking.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.post('/check-availability', checkAvailability);
router.post('/', checkPermission('bookings', 'create'), createBooking);
router.put('/:id', checkPermission('bookings', 'update'), updateBooking);
router.patch('/:id/cancel', checkPermission('bookings', 'update'), cancelBooking);
router.patch('/:id/pickup', checkPermission('bookings', 'update'), pickupBooking);
router.patch('/:id/return', checkPermission('bookings', 'update'), returnBooking);

export default router;
