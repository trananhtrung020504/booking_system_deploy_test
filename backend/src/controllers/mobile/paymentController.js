import { SePayPgClient } from 'sepay-pg-node';
import CryptoJS from 'crypto-js';
import prisma from '../../config/database.js';
import redis from '../../config/redis.js';
import { emitShowUpdate, broadcastGlobalNotification, emitBookingUpdate } from '../../socket/socket.js';
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

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== 'PENDING') return res.status(400).json({ message: "Booking is not pending payment" });

        const createdAt = new Date(booking.createdAt).getTime();
        const expiresAt = createdAt + 10 * 60 * 1000;
        const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        if (remainingSeconds <= 0) return res.status(400).json({ message: "Booking has expired" });

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
            transactionCode = "RP" + Math.random().toString(36).substring(2, 10).toUpperCase();
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

        const cacheKey = `payment_link:${bookingId}:SEPAY`;
        await redis.setex(cacheKey, remainingSeconds, JSON.stringify({ checkoutURL, checkoutFormfields }));

        res.json({ success: true, checkoutURL, checkoutFormfields, transactionCode });
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getSepayCheckoutBridge = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const cacheKey = `payment_link:${bookingId}:SEPAY`;
        const cached = await redis.get(cacheKey);

        if (!cached) {
            return res.status(404).send(`
                <html>
                  <body style="font-family: Arial, sans-serif; background:#111; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                    <div style="max-width:420px; text-align:center;">
                      <h2>Liên kết thanh toán không còn hiệu lực</h2>
                      <p>Đơn đặt vé này có thể đã hết hạn hoặc đã được xử lý. Vui lòng quay lại website để tạo lại giao dịch mới.</p>
                    </div>
                  </body>
                </html>
            `);
        }

        const { checkoutURL, checkoutFormfields } = JSON.parse(cached);
        const hiddenFields = Object.entries(checkoutFormfields || {})
            .map(([key, value]) => `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, '&quot;')}" />`)
            .join('');

        return res.send(`
            <html>
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Đang chuyển đến cổng thanh toán</title>
              </head>
              <body style="margin:0; font-family: Arial, sans-serif; background:#050507; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                <div style="max-width:420px; text-align:center; padding:24px;">
                  <h2 style="margin-bottom:12px;">Đang chuyển đến cổng thanh toán</h2>
                  <p style="color:rgba(255,255,255,0.7); line-height:1.6;">Nếu trình duyệt chưa tự chuyển, vui lòng nhấn nút bên dưới để tiếp tục thanh toán.</p>
                  <form id="sepay-checkout-form" method="POST" action="${checkoutURL}">
                    ${hiddenFields}
                    <button type="submit" style="margin-top:20px; border:none; border-radius:999px; padding:14px 24px; background:#fff; color:#111; font-weight:700; cursor:pointer;">
                      Tiếp tục thanh toán
                    </button>
                  </form>
                </div>
                <script>
                  setTimeout(function() {
                    var form = document.getElementById('sepay-checkout-form');
                    if (form) form.submit();
                  }, 300);
                </script>
              </body>
            </html>
        `);
    } catch (error) {
        console.error('[Controller Error] [mobile/paymentController.js][getSepayCheckoutBridge]:', error);
        res.status(500).send('Không thể khởi tạo cầu nối thanh toán.');
    }
};

export const sepayWebhook = async (req, res) => {
    try {
        console.log("SEPAY WEBHOOK NHAN DUOC DATA:", req.body);

        const { order_invoice_number, payment_status, reference_number } = req.body;

        const code = req.body.code || reference_number;

        let transactionCode = order_invoice_number;
        let transaction = null;

        if (transactionCode) {
            transaction = await prisma.transaction.findUnique({
                where: { transactionCode: transactionCode },
                include: { bookings: { include: { user: true, seats: true, show: { include: { movie: true, theater: true, screen: true } } } } }
            });
        } else if (req.body.content) {
            const content = req.body.content.toUpperCase();
            const pendingTransactions = await prisma.transaction.findMany({
                where: { status: 'PENDING', paymentMethod: 'SEPAY' },
                include: { bookings: { include: { user: true, seats: true, show: { include: { movie: true, theater: true, screen: true } } } } }
            });

            transaction = pendingTransactions.find(t => content.includes(t.transactionCode.toUpperCase()));
            if (transaction) {
                transactionCode = transaction.transactionCode;
            }
        }

        if (!transaction) return res.json({ success: false, message: 'Transaction not found or missing transaction code' });

        if (transaction && transaction.status === 'PENDING') {
            const booking = transaction.bookings[0];

            if (booking && booking.status === 'PENDING') {
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
                    emitBookingUpdate(io, booking.userId, {
                        bookingId: booking.id,
                        bookingRef: booking.bookingRef,
                        status: 'CONFIRMED',
                        source: 'sepay_webhook'
                    });
                    broadcastGlobalNotification(io, `Chúc mừng ${booking.user.name || 'khách hàng'} vừa đặt thành công ${booking.seats.length} vé phim ${booking.show.movie.title}!`, 'success');
                }

                if (booking?.user?.email) {
                    try {
                        await sendBookingConfirmationEmail(booking.user.email, booking);
                    } catch (emailError) {
                        console.error('[MailService] Lỗi khi gửi email xác nhận (bỏ qua để không chết webhook):', emailError.message);
                    }
                }
                await redis.del(`payment_link:${booking.id}:SEPAY`);
            }
        }

        res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
