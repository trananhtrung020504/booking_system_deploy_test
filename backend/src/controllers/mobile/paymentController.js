import { SePayPgClient } from 'sepay-pg-node';
import CryptoJS from 'crypto-js';
import prisma from '../../config/database.js';
import redis from '../../config/redis.js';
import { emitShowUpdate, broadcastGlobalNotification } from '../../socket/socket.js';
import { sendBookingConfirmationEmail } from '../../services/mail.service.js';

const client = new SePayPgClient({
    env: 'production',
    merchant_id: process.env.SEPAY_MERCHANT_ID,
    secret_key: process.env.SEPAY_SECRET_KEY
});

export const createSepayPayment = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;
        const userId = req.user.id;

        // 1. Validate booking exists and is not expired
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== 'PENDING') return res.status(400).json({ message: "Booking is not pending payment" });

        const createdAt = new Date(booking.createdAt).getTime();
        const expiresAt = createdAt + 10 * 60 * 1000;
        const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        if (remainingSeconds <= 0) return res.status(400).json({ message: "Booking has expired" });

        // 2. Create or reuse transaction
        let transaction = await prisma.transaction.findFirst({
            where: {
                bookings: { some: { id: bookingId } },
                status: 'PENDING',
                paymentMethod: 'SEPAY'
            }
        });

        let transactionCode;
        if (transaction) {
            transactionCode = transaction.transactionCode;
        } else {
            transactionCode = CryptoJS.lib.WordArray.random(20).toString(CryptoJS.enc.Hex);
            transaction = await prisma.transaction.create({
                data: {
                    userId,
                    type: 'SPEND',
                    status: 'PENDING',
                    paymentMethod: 'SEPAY',
                    transactionCode,
                    amount: Number(amount),
                    bookings: { connect: { id: bookingId } }
                }
            });
        }

        // 3. Initialize SePay PG Checkout
        const checkoutURL = client.checkout.initCheckoutUrl();
        const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';
        const checkoutFormfields = client.checkout.initOneTimePaymentFields({
            payment_method: 'BANK_TRANSFER',
            order_invoice_number: transactionCode,
            order_amount: Number(amount),
            currency: 'VND',
            order_description: `Thanh toan ve xem phim ${bookingId}`,
            success_url: `${frontendUrl}/bookings?status=success&bookingId=${bookingId}&tx=${transactionCode}`,
            error_url: `${frontendUrl}/bookings?status=failed`,
            cancel_url: `${frontendUrl}/bookings?status=failed`,
        });

        // Save generated payment details to cache (expires when booking expires)
        const cacheKey = `payment_link:${bookingId}:SEPAY`;
        await redis.setex(cacheKey, remainingSeconds, JSON.stringify({ checkoutURL, checkoutFormfields }));

        res.json({ success: true, checkoutURL, checkoutFormfields, transactionCode });
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const sepayWebhook = async (req, res) => {
    try {
        console.log("SEPAY WEBHOOK NHAN DUOC DATA:", req.body);

        // SePay IPN parameters might differ, but generally it contains order_invoice_number and payment_status
        const { order_invoice_number, payment_status, reference_number } = req.body;

        // If standard SePay (not PG) hits this endpoint:
        const code = req.body.code || reference_number;
        const transactionCode = order_invoice_number || req.body.content;

        if (!transactionCode) return res.json({ success: false, message: 'Missing transaction code' });

        const transaction = await prisma.transaction.findUnique({
            where: { transactionCode: transactionCode },
            include: { bookings: { include: { user: true, seats: true, show: { include: { movie: true, theater: true, screen: true } } } } }
        });

        if (transaction && transaction.status === 'PENDING') {
            const booking = transaction.bookings[0];

            if (booking && booking.status === 'PENDING') {
                // Confirm booking
                await prisma.booking.update({
                    where: { id: booking.id },
                    data: { status: 'CONFIRMED', paymentId: transactionCode }
                });

                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'PAID', paidAt: new Date(), transactionNo: String(code || 'SEPAY') }
                });

                const io = req.app.get('io');
                if (io && booking) {
                    await emitShowUpdate(io, booking.showId);
                    broadcastGlobalNotification(io, `Chúc mừng ${booking.user.name || 'khách hàng'} vừa đặt thành công ${booking.seats.length} vé phim ${booking.show.movie.title}!`, 'success');
                }

                if (booking?.user?.email) await sendBookingConfirmationEmail(booking.user.email, booking);

                await redis.del(`payment_link:${booking.id}:SEPAY`);
            }
        }

        // Always return success to acknowledge receipt
        res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
