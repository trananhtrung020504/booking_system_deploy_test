import crypto from 'crypto';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';
import moment from 'moment';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import QRCode from 'qrcode';
import prisma from '../../config/database.js';
import redis from '../../config/redis.js';
import { emitShowUpdate, broadcastGlobalNotification } from '../../socket/socket.js';
import { sendBookingConfirmationEmail, sendBookingExpiredRefundEmail } from '../../services/mail.service.js';

const vnpay = new VNPay({
    tmnCode: '64DFOLZV',
    secureSecret: 'O6J4Z89F24EL7WDPFXJEJBX47AGBLQVO',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
    loggerFn: ignoreLogger,
});

const zaloConfig = {
    app_id: '2553',
    key1: 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
    key2: 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
    endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
};

export const createVNPayPayment = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;
        const userId = req.user.id;

        // 1. Check Redis cache first to avoid repeating QR generation & signing
        const cacheKey = `payment_link:${bookingId}:VNPAY`;
        const cachedPayment = await redis.get(cacheKey);
        if (cachedPayment) {
            const data = JSON.parse(cachedPayment);
            return res.json({ success: true, ...data });
        }

        // 2. Validate booking exists and is not expired
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== 'PENDING') return res.status(400).json({ message: "Booking is not pending payment" });

        const createdAt = new Date(booking.createdAt).getTime();
        const expiresAt = createdAt + 10 * 60 * 1000;
        const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        if (remainingSeconds <= 0) return res.status(400).json({ message: "Booking has expired" });

        // 3. Reuse existing pending transaction if it exists to avoid database bloating
        let transaction = await prisma.transaction.findFirst({
            where: {
                bookings: {
                    some: { id: bookingId }
                },
                status: 'PENDING',
                paymentMethod: 'VNPAY'
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
                    paymentMethod: 'VNPAY',
                    transactionCode,
                    amount: Number(amount),
                    bookings: {
                        connect: { id: bookingId }
                    }
                }
            });
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: Number(amount),
            vnp_IpAddr: req.ip || '127.0.0.1',
            vnp_TxnRef: transactionCode,
            vnp_OrderInfo: `Payment for booking ${bookingId}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: process.env.NGROK_URL
                ? `${process.env.NGROK_URL}/api/v1/web/payment/vnpay/return`
                : `${req.protocol}://${req.get('host')}/api/v1/web/payment/vnpay/return`,
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date()),
            vnp_ExpireDate: dateFormat(tomorrow),
        });

        const qrCode = await QRCode.toDataURL(paymentUrl);
        const result = { paymentUrl, qrCode, transactionCode };

        // Save generated payment details to cache (expires when booking expires)
        await redis.setex(cacheKey, remainingSeconds, JSON.stringify(result));

        res.json({ success: true, ...result });
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};


export const vnpayReturn = async (req, res) => {
    try {
        const verify = vnpay.verifyReturnUrl(req.query);
        const { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo } = req.query;

        if (verify.isSuccess && vnp_ResponseCode === '00') {
            const transaction = await prisma.transaction.findUnique({
                where: { transactionCode: vnp_TxnRef },
                include: { bookings: { include: { user: true, seats: true, show: { include: { movie: true, theater: true, screen: true } } } } }
            });
            if (transaction && transaction.status === 'PENDING') {
                const booking = transaction.bookings[0];
                
                if (booking && booking.status === 'PENDING') {
                    // Normal payment: confirm the booking and mark transaction as PAID
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { status: 'CONFIRMED', paymentId: vnp_TxnRef }
                    });
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: { status: 'PAID', paidAt: new Date(), transactionNo: vnp_TransactionNo }
                    });

                    const io = req.app.get('io');
                    if (io && booking) {
                        await emitShowUpdate(io, booking.showId);
                        broadcastGlobalNotification(io, `Chúc mừng ${booking.user.name || 'khách hàng'} vừa đặt thành công ${booking.seats.length} vé phim ${booking.show.movie.title}!`, 'success');
                    }
                    if (booking?.user?.email) await sendBookingConfirmationEmail(booking.user.email, booking);
                    
                    if (booking.id) {
                        await redis.del(`payment_link:${booking.id}:VNPAY`);
                    }
                    return res.redirect('http://localhost:3000/bookings?status=success');
                } else {
                    // Option 2: Payment succeeded but booking is EXPIRED/CANCELLED
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: { 
                            status: 'FAILED', 
                            paidAt: new Date(), 
                            transactionNo: String(vnp_TransactionNo) + " (REFUND_PENDING: Vé đã hết hạn)" 
                        }
                    });
                    if (booking?.id) {
                        await redis.del(`payment_link:${booking.id}:VNPAY`);
                    }
                    console.warn(`[REFUND REQUIRED] Booking ${booking ? booking.id : 'NOT_FOUND'} was paid via VNPAY (${vnp_TransactionNo}) but the booking status is ${booking ? booking.status : 'NOT_FOUND'} (expired/cancelled). Transaction marked as FAILED with REFUND_PENDING note.`);
                    
                    // Send Refund Pending Email to the User
                    if (booking && booking.user?.email) {
                        await sendBookingExpiredRefundEmail(booking.user.email, booking, transaction.amount, vnp_TransactionNo);
                    }

                    return res.redirect('http://localhost:3000/bookings?status=expired_paid');
                }
            }
            res.redirect('http://localhost:3000/bookings?status=success');
        } else {
            // Find transaction and mark as FAILED, then clear Redis cache so they can retry
            const transaction = await prisma.transaction.findFirst({
                where: { transactionCode: vnp_TxnRef, status: 'PENDING' },
                include: { bookings: true }
            });
            if (transaction) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'FAILED' }
                });
                const booking = transaction.bookings[0];
                if (booking?.id) {
                    await redis.del(`payment_link:${booking.id}:VNPAY`);
                }
            }
            res.redirect('http://localhost:3000/bookings?status=failed');
        }
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const createZaloPay = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;
        const userId = req.user.id;

        // 1. Check Redis cache first to avoid repeating ZaloPay API calls
        const cacheKey = `payment_link:${bookingId}:ZALOPAY`;
        const cachedPayment = await redis.get(cacheKey);
        if (cachedPayment) {
            const data = JSON.parse(cachedPayment);
            return res.json({ success: true, ...data });
        }

        // 2. Validate booking exists and is not expired
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== 'PENDING') return res.status(400).json({ message: "Booking is not pending payment" });

        const createdAt = new Date(booking.createdAt).getTime();
        const expiresAt = createdAt + 10 * 60 * 1000;
        const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        if (remainingSeconds <= 0) return res.status(400).json({ message: "Booking has expired" });

        // 3. Reuse existing pending transaction if it exists to avoid database bloating
        let transaction = await prisma.transaction.findFirst({
            where: {
                bookings: {
                    some: { id: bookingId }
                },
                status: 'PENDING',
                paymentMethod: 'ZALOPAY'
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
                    paymentMethod: 'ZALOPAY',
                    transactionCode,
                    amount: Number(amount),
                    bookings: {
                        connect: { id: bookingId }
                    }
                }
            });
        }

        const transID = Math.floor(Math.random() * 1000000);
        const order = {
            app_id: zaloConfig.app_id,
            app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
            app_user: userId,
            app_time: Date.now(),
            item: JSON.stringify([]),
            embed_data: JSON.stringify({ transactionCode, bookingId }),
            amount: Number(amount),
            description: `Payment for booking ${bookingId}`,
            callback_url: process.env.NGROK_URL
                ? `${process.env.NGROK_URL}/api/v1/web/payment/zalopay/callback`
                : `${req.protocol}://${req.get('host')}/api/v1/web/payment/zalopay/callback`,
            redirect_url: 'http://localhost:3000/bookings',
        };

        const data = `${zaloConfig.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
        order.mac = crypto.createHmac('sha256', zaloConfig.key1).update(data).digest('hex');

        const response = await axios.post(zaloConfig.endpoint, null, { params: order });
        if (response.data.return_code === 1) {
            const qrCode = await QRCode.toDataURL(response.data.order_url);
            const result = { paymentUrl: response.data.order_url, qrCode, transactionCode };

            // Save generated payment details to cache (expires when booking expires)
            await redis.setex(cacheKey, remainingSeconds, JSON.stringify(result));

            res.json({ success: true, ...result });
        } else {
            res.status(400).json({ message: response.data.return_message });
        }
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};


export const zaloPayCallback = async (req, res) => {
    try {
        const { data, mac } = req.body;
        const macCheck = crypto.createHmac("sha256", zaloConfig.key2).update(data).digest("hex");
        if (macCheck !== mac) return res.json({ return_code: -1 });

        const { embed_data, zp_trans_id } = JSON.parse(data);
        const { transactionCode, bookingId } = JSON.parse(embed_data);

        const transaction = await prisma.transaction.findUnique({ where: { transactionCode } });
        if (transaction && transaction.status === 'PENDING') {
            const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

            if (booking && booking.status === 'PENDING') {
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: 'CONFIRMED', paymentId: transactionCode }
                });

                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'PAID', paidAt: new Date(), transactionNo: String(zp_trans_id) }
                });

                const populatedBooking = await prisma.booking.findUnique({
                    where: { id: bookingId },
                    include: { user: true, seats: true, show: { include: { movie: true, theater: true, screen: true } } }
                });
                const io = req.app.get('io');
                if (io && populatedBooking) {
                    await emitShowUpdate(io, populatedBooking.showId);
                    broadcastGlobalNotification(io, `Chúc mừng ${populatedBooking.user.name || 'khách hàng'} vừa đặt thành công ${populatedBooking.seats.length} vé phim ${populatedBooking.show.movie.title}!`, 'success');
                }
                if (populatedBooking?.user?.email) await sendBookingConfirmationEmail(populatedBooking.user.email, populatedBooking);
                
                await redis.del(`payment_link:${bookingId}:ZALOPAY`);
            } else {
                // Option 2: ZaloPay callback success but booking is EXPIRED/CANCELLED
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'FAILED',
                        paidAt: new Date(),
                        transactionNo: String(zp_trans_id) + " (REFUND_PENDING: Vé đã hết hạn)"
                    }
                });
                await redis.del(`payment_link:${bookingId}:ZALOPAY`);
                console.warn(`[REFUND REQUIRED] Booking ${bookingId} was paid via ZaloPay (${zp_trans_id}) but the booking status is ${booking ? booking.status : 'NOT_FOUND'} (expired/cancelled). Transaction marked as FAILED with REFUND_PENDING note.`);
                
                // Send Refund Pending Email to the User
                if (booking) {
                    const populatedBooking = await prisma.booking.findUnique({
                        where: { id: bookingId },
                        include: { user: true, seats: true, show: { include: { movie: true, theater: true, screen: true } } }
                    });
                    if (populatedBooking && populatedBooking.user?.email) {
                        await sendBookingExpiredRefundEmail(populatedBooking.user.email, populatedBooking, transaction.amount, zp_trans_id);
                    }
                }
            }
        }
        res.json({ return_code: 1 });
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.json({ return_code: 0 });
    }
};
