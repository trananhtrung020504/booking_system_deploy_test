import express from 'express';
import * as bookingController from '../../controllers/web/bookingController.js';
import { validateNewBooking } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.post('/create', validateNewBooking, bookingController.createBooking);
router.post('/confirm', bookingController.confirmBooking);
router.post('/apply-voucher', bookingController.applyVoucher);
router.post('/hold', bookingController.holdSeats);
router.get('/my-bookings', bookingController.getUserBookings);
router.get('/:id', bookingController.getBookingDetail);
router.patch('/:id/cancel', bookingController.cancelBooking);

export default router;
