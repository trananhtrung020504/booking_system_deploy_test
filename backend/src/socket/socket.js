import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../config/env_vars.js';
import redis from '../config/redis.js';
import prisma from '../config/database.js';

const userSocketMap = new Map();
const SEAT_HOLD_TTL = 7 * 60;

export const emitToUser = (io, userId, eventName, data) => {
    io.to(`user:${userId}`).emit(eventName, data);
};

export const emitBookingUpdate = (io, userId, payload) => {
    if (!io || !userId) return;
    emitToUser(io, userId, 'booking:updated', {
        ...payload,
        timestamp: Date.now()
    });
};

export const broadcastGlobalNotification = (io, message, type = 'info') => {
    io.to('global').emit('global:notification', { message, type, timestamp: Date.now() });
};

export const getHeldSeats = async (showId) => {
    const pattern = `hold:${showId}:*`;
    const keys = await redis.keys(pattern);
    const result = [];
    for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
            const parsed = JSON.parse(data);
            const seatId = key.split(':').pop();
            result.push({ seatId, userId: parsed.userId, expiresAt: parsed.expiresAt });
        }
    }
    return result;
};

export const getBookedSeats = async (showId) => {
    const bookings = await prisma.booking.findMany({
        where: { showId, status: { in: ['CONFIRMED', 'PENDING'] } },
        include: { seats: { select: { id: true } } }
    });
    return bookings.flatMap(b => b.seats.map(s => ({ seatId: s.id, userId: b.userId })));
};

export const getSelectingSeats = async (showId) => {
    const pattern = `selecting:${showId}:*`;
    const keys = await redis.keys(pattern);
    const result = [];
    for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
            const seatIds = JSON.parse(data);
            const userId = key.split(':').pop();
            result.push({ userId, seatIds });
        }
    }
    return result;
};

export const emitShowUpdate = async (io, showId) => {
    const [held, booked, selecting] = await Promise.all([
        getHeldSeats(showId),
        getBookedSeats(showId),
        getSelectingSeats(showId)
    ]);
    const viewerCount = io.sockets.adapter.rooms.get(`show:${showId}`)?.size || 0;
    io.to(`show:${showId}`).emit('show:seats-update', {
        showId, held, booked, selecting, viewerCount, timestamp: Date.now()
    });
};


const parseCookies = (cookieString) => {
    if (!cookieString) return {};
    return cookieString.split(';').reduce((acc, curr) => {
        const [key, value] = curr.split('=').map(c => c.trim());
        acc[key] = value;
        return acc;
    }, {});
};

const initSocket = (io) => {
    io.on('connection', (socket) => {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        const token = socket.handshake.auth.token || cookies.accessToken;

        console.log(` New connection attempt: ${socket.id}`);
        console.log(` Cookies present: ${socket.handshake.headers.cookie ? 'Yes' : 'No'}`);
        console.log(` Token found: ${token ? 'Yes' : 'No'}`);

        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, ENV_VARS.JWT_ACCESS_SECRET);
                userId = decoded.id;
                socket.userId = userId;
                socket.join(`user:${userId}`);
                socket.join('global');
                userSocketMap.set(userId, socket.id);
                console.log(` Socket verified: User ${userId} connected on ${socket.id}`);
            } catch (error) {
                console.log(` Token verification failed for socket ${socket.id}: ${error.message}. Connecting as guest.`);
                userId = `guest-${socket.id}`;
                socket.userId = userId;
            }
        } else {
            userId = `guest-${socket.id}`;
            socket.userId = userId;
            console.log(` Socket connected as guest: ${socket.id}`);
        }

        socket.on('show:join', async (showId) => {
            socket.join(`show:${showId}`);
            socket.currentShowId = showId;
            await emitShowUpdate(io, showId);
        });

        socket.on('show:leave', async (showId) => {
            socket.leave(`show:${showId}`);
            socket.currentShowId = null;

            try {
                if (showId && userId) {
                    await redis.del(`selecting:${showId}:${userId}`);
                }
                if (showId && userId && !String(userId).startsWith('guest-')) {
                    const holds = await prisma.seatHold.findMany({
                        where: { showId, userId },
                        include: { seats: true }
                    });
                    for (const h of holds) {
                        for (const seat of h.seats) {
                            await redis.del(`hold:${showId}:${seat.id}`);
                        }
                    }
                    await prisma.seatHold.deleteMany({ where: { showId, userId } });
                }
                await emitShowUpdate(io, showId);
            } catch (error) {
                console.error('Error releasing holds on show:leave:', error);
            }
        });

        socket.on('seats:hold', async ({ showId, seatIds }, callback) => {
            try {
                if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
                    return callback?.({ success: false, message: 'Invalid data' });
                }

                if (String(userId).startsWith('guest-')) {
                    return callback?.({ success: false, message: 'Vui lòng đăng nhập để thực hiện giữ ghế' });
                }

                const expiresAt = Date.now() + SEAT_HOLD_TTL * 1000;
                const holdValue = JSON.stringify({ userId, expiresAt });

                const bookedSeats = await getBookedSeats(showId);
                const bookedSet = new Set(bookedSeats.map(b => b.seatId));

                for (const id of seatIds) {
                    if (bookedSet.has(id)) return callback?.({ success: false, message: 'Một hoặc nhiều ghế đã được đặt' });
                }

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
                        await redis.set(key, holdValue, 'EX', SEAT_HOLD_TTL);
                        holdResults.push({ seatId, success: true });
                    } else {
                        holdResults.push({ seatId, success: false });
                    }
                }

                const failed = holdResults.filter(r => !r.success);
                if (failed.length > 0) {
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
                    return callback?.({ success: false, message: "Một hoặc nhiều ghế đã có người giữ" });
                }

                try {
                    await prisma.seatHold.deleteMany({
                        where: { showId, userId }
                    });
                    await prisma.seatHold.create({
                        data: {
                            showId,
                            userId,
                            expiresAt: new Date(expiresAt),
                            seats: {
                                connect: seatIds.map(id => ({ id }))
                            }
                        }
                    });
                } catch (dbError) {
                    if (dbError.code !== 'P2002') {
                        throw dbError;
                    }
                }

                await emitShowUpdate(io, showId);
                callback?.({ success: true, expiresAt });
            } catch (error) {
                callback?.({ success: false, message: error.message });
            }
        });

        socket.on('seats:release', async ({ showId }, callback) => {
            try {
                const holds = await prisma.seatHold.findMany({
                    where: { showId, userId },
                    include: { seats: true }
                });
                for (const h of holds) {
                    for (const seat of h.seats) {
                        await redis.del(`hold:${showId}:${seat.id}`);
                    }
                }
                await prisma.seatHold.deleteMany({ where: { showId, userId } });
                await emitShowUpdate(io, showId);
                if (callback) callback({ success: true });
            } catch (error) {
                if (callback) callback({ success: false });
            }
        });

        socket.on('seats:selecting', async ({ showId, seatIds }) => {
            try {
                if (showId && userId) {
                    const key = `selecting:${showId}:${userId}`;
                    if (!seatIds || seatIds.length === 0) {
                        await redis.del(key);
                    } else {
                        await redis.set(key, JSON.stringify(seatIds), 'EX', 300); // 5 minutes TTL
                    }
                    await emitShowUpdate(io, showId);
                }
            } catch (err) {
                console.error('Error handling seats:selecting:', err);
            }
        });

        socket.on('disconnect', async () => {
            const showId = socket.currentShowId;
            userSocketMap.delete(userId);

            try {
                if (userId) {
                    try {
                        const pattern = `selecting:*:${userId}`;
                        const keys = await redis.keys(pattern);
                        for (const key of keys) {
                            await redis.del(key);
                            const parts = key.split(':');
                            const sId = parts[1];
                            await emitShowUpdate(io, sId);
                        }
                    } catch (err) {
                        console.error('Error cleaning selecting seats on disconnect:', err);
                    }

                    if (!String(userId).startsWith('guest-')) {
                        const holds = await prisma.seatHold.findMany({
                            where: { userId },
                            include: { seats: true }
                        });
                        for (const h of holds) {
                            for (const seat of h.seats) {
                                await redis.del(`hold:${h.showId}:${seat.id}`);
                            }
                            await emitShowUpdate(io, h.showId);
                        }
                        await prisma.seatHold.deleteMany({ where: { userId } });
                    }
                }
            } catch (error) {
                console.error('Error releasing holds on disconnect:', error);
            }
        });
    });
};

export default initSocket;
