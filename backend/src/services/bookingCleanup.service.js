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

            console.log(`🧹 [Booking Cleanup] Found ${expiredBookings.length} expired PENDING bookings`);

            for (const booking of expiredBookings) {
                await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
                for (const seat of booking.seats) {
                    await redis.del(`hold:${booking.showId}:${seat.id}`);
                }
                await prisma.seatHold.deleteMany({ where: { showId: booking.showId, userId: booking.userId } });
                
                if (io) {
                    console.log(`📢 [Booking Cleanup] Emitting seat update for show ${booking.showId} (cancelled booking ${booking.id})`);
                    await emitShowUpdate(io, booking.showId);
                    
                    // Also notify the user directly via personal room
                    io.to(`user:${booking.userId}`).emit('global:notification', {
                        message: `Đơn hàng ${booking.bookingRef} đã hết hạn thanh toán. Ghế được giải phóng.`,
                        type: 'warning',
                        timestamp: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('❌ Cleanup Error:', error);
        }
    }, CLEANUP_INTERVAL);
};
