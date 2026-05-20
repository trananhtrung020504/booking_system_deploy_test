import prisma from '../../config/database.js';
import redis from '../../config/redis.js';
import { emitShowUpdate } from '../../socket/socket.js';

export const applyVoucher = async (req, res) => {
    try {
        const { code, amount } = req.body;
        if (!code || !amount) return res.status(400).json({ message: "Code and amount are required" });

        const voucher = await prisma.voucher.findUnique({ where: { code, isActive: true } });
        if (!voucher) return res.status(404).json({ message: "Voucher không tồn tại hoặc đã hết hạn" });

        if (voucher.expiresAt < new Date()) return res.status(400).json({ message: "Voucher đã hết hạn" });
        if (voucher.usedCount >= voucher.usageLimit) return res.status(400).json({ message: "Voucher đã hết lượt sử dụng" });
        if (amount < voucher.minOrder) return res.status(400).json({ message: `Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString()}đ để áp dụng voucher này` });

        let discount = 0;
        if (voucher.type === 'PERCENT') {
            discount = amount * (voucher.value / 100);
            if (voucher.maxDiscount && discount > voucher.maxDiscount) discount = voucher.maxDiscount;
        } else {
            discount = voucher.value;
        }

        res.json({ success: true, discount, voucherId: voucher.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBooking = async (req, res) => {
    const { showId, seatIds, paymentMethod, voucherCode, combos } = req.body;
    const userId = req.user.id;

    try {
        if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0 || !paymentMethod) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        for (const seatId of seatIds) {
            const holdData = await redis.get(`hold:${showId}:${seatId}`);
            if (holdData) {
                const parsed = JSON.parse(holdData);
                if (String(parsed.userId) !== String(userId)) {
                    return res.status(400).json({ message: `Ghế đang được thanh toán hoặc giữ bởi người khác.` });
                }
            }
        }

        // Auto-secure Redis hold lock for 10 minutes to protect these seats during payment
        const expiresAt = Date.now() + 600 * 1000;
        const holdValue = JSON.stringify({ userId, expiresAt });
        for (const seatId of seatIds) {
            await redis.set(`hold:${showId}:${seatId}`, holdValue, 'EX', 600);
        }

        const show = await prisma.show.findUnique({ where: { id: showId }, include: { screen: true } });
        if (!show) return res.status(404).json({ message: "Show not found" });

        const seats = await prisma.seat.findMany({ where: { id: { in: seatIds } } });
        let ticketAmount = 0;
        seats.forEach(seat => ticketAmount += (show.priceMap[seat.type] || show.priceMap['STANDARD'] || 0));

        let comboAmount = 0;
        let comboList = [];
        if (combos && Array.isArray(combos)) {
            for (const c of combos) {
                if (c.quantity <= 0) continue;
                const comboData = await prisma.combo.findUnique({ where: { id: c.comboId } });
                if (comboData) {
                    comboAmount += comboData.price * c.quantity;
                    comboList.push({ comboId: c.comboId, quantity: c.quantity });
                }
            }
        }

        const totalBeforeVoucher = ticketAmount + comboAmount;
        let discountAmount = 0;
        let voucherId = null;

        if (voucherCode) {
            const voucher = await prisma.voucher.findUnique({ where: { code: voucherCode, isActive: true } });
            if (voucher) {
                if (voucher.expiresAt < new Date()) return res.status(400).json({ message: "Voucher đã hết hạn" });
                if (totalBeforeVoucher < voucher.minOrder) return res.status(400).json({ message: "Đơn hàng không đủ điều kiện áp dụng voucher" });
                
                voucherId = voucher.id;
                if (voucher.type === 'PERCENT') {
                    discountAmount = totalBeforeVoucher * (voucher.value / 100);
                    if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) discountAmount = voucher.maxDiscount;
                } else {
                    discountAmount = voucher.value;
                }
            }
        }

        const finalTotal = Math.max(0, totalBeforeVoucher - discountAmount);

        const result = await prisma.$transaction(async (tx) => {
            const booked = await tx.booking.findMany({
                where: { showId, status: { in: ['CONFIRMED', 'PENDING'] }, seats: { some: { id: { in: seatIds } } } }
            });
            if (booked.length > 0) throw new Error("Ghế đã có người đặt thành công hoặc đang chờ thanh toán");

            if (voucherId) {
                const updated = await tx.voucher.updateMany({
                    where: { id: voucherId, usedCount: { lt: prisma.voucher.fields.usageLimit }, isActive: true },
                    data: { usedCount: { increment: 1 } }
                });
                if (updated.count === 0) throw new Error("Voucher đã hết lượt sử dụng");
            }

            const bookingRef = `BKS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            return await tx.booking.create({
                data: {
                    bookingRef, userId, showId, status: 'PENDING', paymentMethod, voucherId,
                    discountAmount, total: finalTotal, ticketPrice: ticketAmount / seatIds.length,
                    seats: { connect: seatIds.map(id => ({ id })) },
                    combos: { create: comboList.map(c => ({ comboId: c.comboId, quantity: c.quantity })) }
                },
                include: { show: { include: { movie: { include: { poster: true } }, theater: true, screen: true } }, seats: true, combos: { include: { combo: true } } }
            });
        });

        const io = req.app.get('io');
        if (io) {
            await emitShowUpdate(io, showId);
        }

        res.status(201).json({ success: true, booking: result });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const confirmBooking = async (req, res) => {
    const { bookingId, transactionCode } = req.body;
    const userId = req.user.id;
    try {
        const booking = await prisma.booking.findFirst({
            where: { id: bookingId, userId, status: 'PENDING' },
            include: { seats: true }
        });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED', paymentId: transactionCode || null },
            include: { show: { include: { movie: { include: { poster: true } }, theater: true, screen: true } }, seats: true }
        });

        for (const seat of booking.seats) await redis.del(`hold:${booking.showId}:${seat.id}`);
        await prisma.seatHold.deleteMany({ where: { showId: booking.showId, userId } });

        const io = req.app.get('io');
        if (io) {
            const { emitShowUpdate } = await import('../../socket/socket.js');
            await emitShowUpdate(io, booking.showId);
        }
        res.json({ success: true, booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const checkAndExpireBookings = async (userId, io) => {
    try {
        const pendingBookings = await prisma.booking.findMany({
            where: {
                userId,
                status: 'PENDING'
            },
            include: {
                show: true,
                seats: true
            }
        });

        const now = new Date();
        const expiredBookingIds = [];
        const showsToUpdate = new Set();

        for (const booking of pendingBookings) {
            const showStartTime = new Date(booking.show.startTime);
            const createdAtTime = new Date(booking.createdAt);
            const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

            if (createdAtTime < tenMinutesAgo) {
                expiredBookingIds.push(booking.id);
                showsToUpdate.add(booking.showId);

                // Release seats held in Redis
                for (const seat of booking.seats) {
                    await redis.del(`hold:${booking.showId}:${seat.id}`);
                }
                
                // Release seatHold in DB
                await prisma.seatHold.deleteMany({
                    where: { showId: booking.showId, userId }
                });

                // Update booking status to EXPIRED
                await prisma.$transaction(async (tx) => {
                    await tx.booking.update({
                        where: { id: booking.id },
                        data: { status: 'EXPIRED' }
                    });
                    if (booking.voucherId) {
                        await tx.voucher.update({
                            where: { id: booking.voucherId },
                            data: { usedCount: { decrement: 1 } }
                        });
                    }
                });
            }
        }

        if (showsToUpdate.size > 0 && io) {
            const { emitShowUpdate } = await import('../../socket/socket.js');
            for (const showId of showsToUpdate) {
                await emitShowUpdate(io, showId);
            }
        }
    } catch (error) {
        console.error("Error checking/expiring bookings:", error);
    }
};

export const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const io = req.app.get('io');
        await checkAndExpireBookings(userId, io);

        const { page = 1, limit = 10, status } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

        const where = { userId };
        if (status && ['CONFIRMED', 'PENDING', 'CANCELLED'].includes(status)) {
            where.status = status;
        }

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                include: { show: { include: { movie: { include: { poster: true } }, theater: true, screen: true } }, seats: true },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            }),
            prisma.booking.count({ where })
        ]);
        res.json({ bookings, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getBookingDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const io = req.app.get('io');
        await checkAndExpireBookings(userId, io);

        const booking = await prisma.booking.findFirst({
            where: { id: req.params.id, userId },
            include: { show: { include: { movie: { include: { poster: true } }, theater: true, screen: true } }, seats: true, transaction: true }
        });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const cancelBooking = async (req, res) => {
    try {
        const booking = await prisma.booking.findFirst({
            where: { id: req.params.id, userId: req.user.id, status: { in: ['PENDING', 'CONFIRMED'] } },
            include: { seats: true }
        });
        if (!booking) return res.status(404).json({ message: "Cannot cancel" });

        const updatedBooking = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
        if (booking.voucherId) {
            await prisma.voucher.update({ where: { id: booking.voucherId }, data: { usedCount: { decrement: 1 } } });
        }

        // Clean up pending transactions
        if (booking.paymentId) {
            await prisma.transaction.updateMany({
                where: { transactionCode: booking.paymentId, status: 'PENDING' },
                data: { status: 'FAILED' }
            });
        }

        // Clean up Redis holds and payment links
        for (const seat of booking.seats) await redis.del(`hold:${booking.showId}:${seat.id}`);
        await prisma.seatHold.deleteMany({ where: { showId: booking.showId, userId: req.user.id } });
        
        await redis.del(`payment_link:${booking.id}:VNPAY`);
        await redis.del(`payment_link:${booking.id}:ZALOPAY`);

        const io = req.app.get('io');
        if (io) {
            const { emitShowUpdate } = await import('../../socket/socket.js');
            await emitShowUpdate(io, booking.showId);
        }
        res.json({ success: true, booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const holdSeats = async (req, res) => {
    const { showId, seatIds } = req.body;
    const userId = req.user.id;

    try {
        if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        const expiresAt = Date.now() + 600 * 1000; // 10 minutes (matching payment page 600s)
        const holdValue = JSON.stringify({ userId, expiresAt });

        // 1. Check if seats are already booked
        const bookings = await prisma.booking.findMany({
            where: {
                showId,
                status: { in: ['CONFIRMED', 'PENDING'] },
                seats: { some: { id: { in: seatIds } } }
            },
            include: { seats: true }
        });
        if (bookings.length > 0) {
            return res.status(400).json({ message: "Một hoặc nhiều ghế đã được đặt hoặc đang chờ thanh toán." });
        }

        // 2. Try holding in Redis (allowing same-user renewal)
        const holdResults = [];
        for (const seatId of seatIds) {
            const key = `hold:${showId}:${seatId}`;
            const existing = await redis.get(key);
            
            let canHold = false;
            if (existing) {
                try {
                    const parsed = JSON.parse(existing);
                    if (String(parsed.userId) === String(userId)) {
                        canHold = true;
                    }
                } catch (e) {
                    canHold = true;
                }
            } else {
                canHold = true;
            }

            if (canHold) {
                await redis.set(key, holdValue, 'EX', 600);
                holdResults.push({ seatId, success: true });
            } else {
                holdResults.push({ seatId, success: false });
            }
        }

        const failed = holdResults.filter(r => !r.success);
        if (failed.length > 0) {
            // Revert any successful Redis holds (only if they weren't already held by us to avoid deleting our own valid holds)
            for (const r of holdResults) {
                if (r.success) {
                    const existing = await redis.get(`hold:${showId}:${r.seatId}`);
                    if (existing) {
                        try {
                            const parsed = JSON.parse(existing);
                            if (String(parsed.userId) !== String(userId)) {
                                await redis.del(`hold:${showId}:${r.seatId}`);
                            }
                        } catch (e) {
                            await redis.del(`hold:${showId}:${r.seatId}`);
                        }
                    }
                }
            }
            return res.status(400).json({ message: "Một hoặc nhiều ghế đang có người giữ." });
        }

        // 3. Update database SeatHold
        try {
            await prisma.seatHold.deleteMany({ where: { showId, userId } });
            await prisma.seatHold.create({
                data: {
                    show: { connect: { id: showId } },
                    user: { connect: { id: userId } },
                    expiresAt: new Date(expiresAt),
                    seats: { connect: seatIds.map(id => ({ id })) }
                }
            });
        } catch (dbError) {
            // Ignore unique constraint violation (P2002) from concurrent requests 
            // since it means the hold has already been successfully created.
            if (dbError.code !== 'P2002') {
                throw dbError;
            }
        }

        // 4. Emit show seats update via Socket
        const io = req.app.get('io');
        if (io) {
            await emitShowUpdate(io, showId);
        }

        res.json({ success: true, expiresAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


