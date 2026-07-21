import prisma from '../config/database.js';
import redis from '../config/redis.js';
import { emitShowUpdate } from '../socket/socket.js';

const CLEANUP_INTERVAL = 60 * 1000;
const EXPIRY_TIME = 10 * 60 * 1000;

export const initBookingCleanupWorker = (io) => {
    setInterval(async () => {
        try {
            const expiryThreshold = new Date(Date.now() - EXPIRY_TIME);
            const expiredBookings = await prisma.booking.findMany({
                where: { status: 'PENDING', createdAt: { lt: expiryThreshold } },
                include: { seats: true }
            });

            if (expiredBookings.length === 0) return;

            console.log(`[Booking Cleanup] Found ${expiredBookings.length} expired PENDING bookings`);

            for (const booking of expiredBookings) {
                await prisma.$transaction(async (tx) => {
                    await tx.booking.update({
                        where: { id: booking.id },
                        data: { status: 'EXPIRED' }
                    });

                    if (booking.voucherId) {
                        await tx.voucher.updateMany({
                            where: { id: booking.voucherId, usedCount: { gt: 0 } },
                            data: { usedCount: { decrement: 1 } }
                        });
                    }

                    if (booking.paymentId) {
                        await tx.transaction.updateMany({
                            where: { transactionCode: booking.paymentId, status: 'PENDING' },
                            data: { status: 'FAILED' }
                        });
                    }
                });

                for (const seat of booking.seats) {
                    await redis.del(`hold:${booking.showId}:${seat.id}`);
                }

                await prisma.seatHold.deleteMany({ where: { showId: booking.showId, userId: booking.userId } });
                await redis.del(`payment_link:${booking.id}:VNPAY`);
                await redis.del(`payment_link:${booking.id}:ZALOPAY`);
                await redis.del(`payment_link:${booking.id}:SEPAY`);

                if (io) {
                    await emitShowUpdate(io, booking.showId);
                    io.to(`user:${booking.userId}`).emit('global:notification', {
                        message: `Đơn hàng ${booking.bookingRef} đã hết hạn thanh toán. Ghế được giải phóng.`,
                        type: 'warning',
                        timestamp: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('[Booking Cleanup] Error:', error);
        }
    }, CLEANUP_INTERVAL);
};
