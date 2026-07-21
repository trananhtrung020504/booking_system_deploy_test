import { SePayPgClient } from 'sepay-pg-node';
import crypto from 'crypto';
import prisma from '../../config/database.js';
import redis from '../../config/redis.js';
import { emitShowUpdate, broadcastGlobalNotification, emitBookingUpdate } from '../../socket/socket.js';
import { sendBookingConfirmationEmail } from '../../services/mail.service.js';
import { ENV_VARS } from '../../config/env_vars.js';

const client = new SePayPgClient({
    env: 'production',
    merchant_id: ENV_VARS.SEPAY_MERCHANT_ID,
    secret_key: ENV_VARS.SEPAY_SECRET_KEY
});

const SEPAY_SIGNED_FIELDS = [
    'merchant',
    'env',
    'operation',
    'payment_method',
    'order_amount',
    'currency',
    'order_invoice_number',
    'order_description',
    'customer_id',
    'agreement_id',
    'agreement_name',
    'agreement_type',
    'agreement_payment_frequency',
    'agreement_amount_per_payment',
    'success_url',
    'error_url',
    'cancel_url',
    'order_id'
];

const normalizeSignature = (value) => String(value || '').trim();

const buildSignaturePayload = (body, fields) => fields
    .filter((field) => body[field] !== undefined && field !== 'signature')
    .map((field) => `${field}=${body[field] ?? ''}`)
    .join(',');

const timingSafeEqualString = (a, b) => {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
};

const verifySepaySignature = (body) => {
    const signature = normalizeSignature(body.signature || body.Signature);
    const secret = ENV_VARS.SEPAY_WEBHOOK_SECRET || ENV_VARS.SEPAY_SECRET_KEY;

    if (!signature || !secret) {
        return false;
    }

    const bodyKeys = Object.keys(body).filter((key) => key !== 'signature' && key !== 'Signature');
    const candidates = [
        buildSignaturePayload(body, bodyKeys.filter((field) => SEPAY_SIGNED_FIELDS.includes(field))),
        buildSignaturePayload(body, SEPAY_SIGNED_FIELDS),
        buildSignaturePayload(body, bodyKeys.sort())
    ].filter(Boolean);

    return candidates.some((payload) => {
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64');
        const expectedHex = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        return timingSafeEqualString(signature, expected) || timingSafeEqualString(signature, expectedHex);
    });
};

const verifySepayHeaderSignature = (req) => {
    const signature = normalizeSignature(req.get('x-sepay-signature'));
    const timestamp = normalizeSignature(req.get('x-sepay-timestamp'));
    const secret = ENV_VARS.SEPAY_WEBHOOK_SECRET || ENV_VARS.SEPAY_SECRET_KEY;
    const rawBody = req.rawBody;

    if (!signature || !timestamp || !secret || !rawBody) {
        return false;
    }

    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds)) {
        return false;
    }

    if (ENV_VARS.NODE_ENV === 'production') {
        const driftSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
        if (driftSeconds > 5 * 60) {
            return false;
        }
    }

    const payload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const expectedSignature = `sha256=${expectedHash}`;

    return timingSafeEqualString(signature, expectedSignature) || timingSafeEqualString(signature, expectedHash);
};

const verifySepayApiKey = (req) => {
    const expectedApiKey = ENV_VARS.SEPAY_WEBHOOK_API_KEY;
    const authHeader = normalizeSignature(req.get('authorization'));

    if (!expectedApiKey || !authHeader.toLowerCase().startsWith('apikey ')) {
        return false;
    }

    const incomingApiKey = authHeader.slice('apikey '.length).trim();
    return Boolean(incomingApiKey) && timingSafeEqualString(incomingApiKey, expectedApiKey);
};

const allowUnsignedWebhook = () => {
    if (ENV_VARS.SEPAY_ALLOW_UNSIGNED_WEBHOOKS === 'true') {
        return true;
    }

    return ENV_VARS.NODE_ENV !== 'production';
};

const verifySepayWebhookRequest = (req) => {
    if (verifySepayHeaderSignature(req)) return true;
    if (verifySepayApiKey(req)) return true;
    if (verifySepaySignature(req.body)) return true;

    const configuredToken = ENV_VARS.SEPAY_WEBHOOK_TOKEN;
    const incomingToken = req.get('x-webhook-token') || req.query.token;
    if (configuredToken && incomingToken && timingSafeEqualString(String(incomingToken), String(configuredToken))) {
        return true;
    }

    const hasSignature = Boolean(req.body.signature || req.body.Signature);
    const hasHeaderAuth = Boolean(req.get('x-sepay-signature') || req.get('authorization'));
    if (!hasSignature && !hasHeaderAuth && allowUnsignedWebhook()) {
        console.warn('[SePay] Allowing unsigned webhook in development mode.');
        return true;
    }

    return false;
};

const isSuccessfulSepayStatus = (status) => {
    if (!status) return true;
    return ['PAID', 'SUCCESS', 'SUCCEEDED', 'COMPLETED', 'CAPTURED', '00'].includes(String(status).toUpperCase());
};

const extractTransactionCode = (body) => {
    const directCode = body.order_invoice_number || body.orderInvoiceNumber || body.transactionCode;
    if (directCode) return String(directCode).trim().toUpperCase();

    const text = [body.content, body.description, body.transferContent]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();
    const match = text.match(/\bRP[A-Z0-9]{6,20}\b/);
    return match ? match[0] : null;
};

const getSepayTransactionInclude = () => ({
    bookings: {
        include: {
            user: true,
            seats: true,
            show: { include: { movie: true, theater: true, screen: true } }
        }
    }
});

const emitConfirmedBookingNotification = async (req, booking, source = 'sepay_webhook') => {
    if (!booking) return;

    const io = req.app.get('io');
    if (!io) return;

    await emitShowUpdate(io, booking.showId);
    emitBookingUpdate(io, booking.userId, {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        status: 'CONFIRMED',
        source
    });
    if (source === 'sepay_webhook') {
        broadcastGlobalNotification(io, `Booking ${booking.bookingRef} has been paid successfully.`, 'success');
    }
    console.log('[SePay] Payment notification emitted:', {
        bookingId: booking.id,
        userId: booking.userId,
        source
    });
};

const buildSepayQrImageUrl = (amount, transactionCode) => {
    const bankId = ENV_VARS.SEPAY_BANK_ID || 'ACB';
    const accountNo = ENV_VARS.SEPAY_ACCOUNT_NO || '7380071';
    const accountName = ENV_VARS.SEPAY_ACCOUNT_NAME || 'TRAN ANH TRUNG';

    return `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankId)}&acc=${encodeURIComponent(accountNo)}&template=compact&amount=${encodeURIComponent(amount)}&des=${encodeURIComponent(transactionCode)}&holder=${encodeURIComponent(accountName)}`;
};

export const createSepayPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user.id;

        const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== 'PENDING') return res.status(400).json({ message: "Booking is not pending payment" });
        const payableAmount = Number(booking.total);
        if (!Number.isFinite(payableAmount) || payableAmount < 0) {
            return res.status(400).json({ message: "Invalid booking amount" });
        }

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
            if (Number(transaction.amount) !== payableAmount) {
                transaction = await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { amount: payableAmount }
                });
            }
        } else {
            transactionCode = "RP" + Math.random().toString(36).substring(2, 10).toUpperCase();
            transaction = await prisma.transaction.create({
                data: {
                    userId,
                    type: 'SPEND',
                    status: 'PENDING',
                    paymentMethod: 'SEPAY',
                    transactionCode,
                    amount: payableAmount,
                    bookings: { connect: { id: bookingId } }
                }
            });
        }

        const checkoutURL = client.checkout.initCheckoutUrl();
        const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';
        const checkoutFormfields = client.checkout.initOneTimePaymentFields({
            payment_method: 'BANK_TRANSFER',
            order_invoice_number: transactionCode,
            order_amount: payableAmount,
            currency: 'VND',
            order_description: `Thanh toan ve xem phim ${bookingId}`,
            success_url: `${frontendUrl}/bookings?status=success&bookingId=${bookingId}&tx=${transactionCode}`,
            error_url: `${frontendUrl}/bookings?status=failed`,
            cancel_url: `${frontendUrl}/bookings?status=failed`,
        });

        const cacheKey = `payment_link:${bookingId}:SEPAY`;
        const qrImageUrl = buildSepayQrImageUrl(payableAmount, transactionCode);
        await redis.setex(cacheKey, remainingSeconds, JSON.stringify({ checkoutURL, checkoutFormfields, qrImageUrl, transactionCode, amount: payableAmount }));

        res.json({ success: true, checkoutURL, checkoutFormfields, transactionCode, qrImageUrl });
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
        const transactionCode = checkoutFormfields?.order_invoice_number;
        const amount = checkoutFormfields?.order_amount;
        if (transactionCode && amount) {
            return res.redirect(buildSepayQrImageUrl(amount, transactionCode));
        }
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

        if (!verifySepayWebhookRequest(req)) {
            return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
        }

        const { payment_status, reference_number } = req.body;

        if (!isSuccessfulSepayStatus(payment_status || req.body.status || req.body.paymentStatus)) {
            return res.status(400).json({ success: false, message: 'Payment is not successful' });
        }

        const code = req.body.code || reference_number;

        let transactionCode = extractTransactionCode(req.body);
        let transaction = null;

        if (transactionCode) {
            transaction = await prisma.transaction.findUnique({
                where: { transactionCode: transactionCode },
                include: getSepayTransactionInclude()
            });
        }

        if (!transaction && req.body.content) {
            const content = req.body.content.toUpperCase();
            const pendingTransactions = await prisma.transaction.findMany({
                where: { status: 'PENDING', paymentMethod: 'SEPAY' },
                include: getSepayTransactionInclude()
            });

            transaction = pendingTransactions.find(t => content.includes(t.transactionCode.toUpperCase()));
            if (transaction) {
                transactionCode = transaction.transactionCode;
            }
        }

        if (!transaction) {
            console.warn('[SePay] Transaction not found from webhook payload:', {
                transactionCode,
                content: req.body.content,
                description: req.body.description,
                transferAmount: req.body.transferAmount || req.body.transfer_amount
            });
            return res.json({ success: false, message: 'Transaction not found or missing transaction code', transactionCode });
        }

        console.log('[SePay] Matched transaction:', {
            transactionCode,
            transactionStatus: transaction.status,
            bookingIds: transaction.bookings.map((booking) => booking.id)
        });

        if (transaction && transaction.status === 'PENDING') {
            const booking = transaction.bookings[0];
            const paidAmount = req.body.order_amount || req.body.amount || req.body.transfer_amount || req.body.transferAmount;

            if (paidAmount !== undefined && Number(paidAmount) !== Number(transaction.amount)) {
                return res.status(400).json({ success: false, message: 'Payment amount mismatch' });
            }

            if (booking && booking.status === 'PENDING') {
                await prisma.booking.update({
                    where: { id: booking.id },
                    data: { status: 'CONFIRMED', paymentId: transactionCode }
                });

                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'PAID', paidAt: new Date(), transactionNo: String(code || 'SEPAY') }
                });

                for (const seat of booking.seats) {
                    await redis.del(`hold:${booking.showId}:${seat.id}`);
                }
                await prisma.seatHold.deleteMany({ where: { showId: booking.showId, userId: booking.userId } });
                await redis.del(`payment_link:${booking.id}:SEPAY`);

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
            }
        } else if (transaction.status === 'PAID') {
            const confirmedBooking = transaction.bookings.find((booking) => booking.status === 'CONFIRMED');
            if (confirmedBooking) {
                await emitConfirmedBookingNotification(req, confirmedBooking, 'sepay_webhook_replay');
            }
        }

        res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error(`[Controller Error] [mobile/paymentController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
