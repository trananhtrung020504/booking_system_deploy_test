import prisma from '../../config/database.js';
import redis from '../../config/redis.js';
import { emitBookingUpdate, emitShowUpdate } from '../../socket/socket.js';

export const getAllBookings = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, userId, showId, dateFrom, dateTo, search } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const where = {};

        if (status) {
            where.status = status;
        }
        if (userId) {
            where.userId = userId;
        }
        if (showId) {
            where.showId = showId;
        }

        if (search) {
            where.OR = [
                { bookingRef: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                where.createdAt.lte = toDate;
            }
        }

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                include: {
                    user: { select: { id: true, email: true, name: true, phone: true } },
                    show: {
                        include: {
                            movie: { select: { title: true } },
                            theater: { select: { name: true, city: true } },
                            screen: { select: { id: true, name: true } }
                        }
                    },
                    seats: { select: { id: true, row: true, column: true, type: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            }),
            prisma.booking.count({ where })
        ]);

        res.json({
            bookings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminBookingController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getBookingDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: true,
                show: {
                    include: {
                        movie: { include: { poster: true } },
                        theater: { include: { logo: true } },
                        screen: true
                    }
                },
                seats: true,
                combos: { include: { combo: true } },
                voucher: true,
                transaction: true
            }
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json(booking);
    } catch (error) {
        console.error(`[Controller Error] [web/adminBookingController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { seats: true }
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ message: "Booking already cancelled" });
        }

        const updatedBooking = await prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    updatedAt: new Date()
                },
                include: {
                    user: { select: { id: true, email: true, name: true } },
                    show: {
                        include: {
                            movie: { select: { title: true } },
                            theater: { select: { name: true } }
                        }
                    }
                }
            });

            if (booking.voucherId && booking.status === 'PENDING') {
                await tx.voucher.updateMany({
                    where: { id: booking.voucherId, usedCount: { gt: 0 } },
                    data: { usedCount: { decrement: 1 } }
                });
            }

            if (booking.paymentId && booking.status === 'PENDING') {
                await tx.transaction.updateMany({
                    where: { transactionCode: booking.paymentId, status: 'PENDING' },
                    data: { status: 'FAILED' }
                });
            }

            return updated;
        });

        for (const seat of booking.seats) {
            await redis.del(`hold:${booking.showId}:${seat.id}`);
        }
        await prisma.seatHold.deleteMany({ where: { showId: booking.showId, userId: booking.userId } });
        await redis.del(`payment_link:${booking.id}:VNPAY`);
        await redis.del(`payment_link:${booking.id}:ZALOPAY`);
        await redis.del(`payment_link:${booking.id}:SEPAY`);

        const io = req.app.get('io');
        if (io) {
            await emitShowUpdate(io, booking.showId);
            emitBookingUpdate(io, booking.userId, {
                bookingId: updatedBooking.id,
                bookingRef: updatedBooking.bookingRef,
                status: 'CANCELLED',
                source: 'admin_booking_cancelled'
            });
        }


        res.json({
            message: "Booking cancelled successfully",
            booking: updatedBooking,
            reason: reason || "Cancelled by admin"
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminBookingController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;

        let dateFilter = {};
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom) {
                dateFilter.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.createdAt.lte = toDate;
            }
        }

        const totalUsers = await prisma.user.count();

        const totalActiveShows = await prisma.show.count({
            where: { isActive: true, startTime: { gte: new Date() } }
        });

        const totalActiveMovies = await prisma.movie.count({
            where: { isActive: true }
        });

        const totalTheaters = await prisma.theater.count();

        const bookingStats = await prisma.booking.groupBy({
            by: ['status'],
            _count: true,
            where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}
        });

        const totalBookings = bookingStats.reduce((sum, stat) => sum + stat._count, 0);
        const confirmedBookings = bookingStats.find(s => s.status === 'CONFIRMED')?._count || 0;
        const pendingBookings = bookingStats.find(s => s.status === 'PENDING')?._count || 0;
        const cancelledBookings = bookingStats.find(s => s.status === 'CANCELLED')?._count || 0;

        const transactionStats = await prisma.transaction.aggregate({
            _sum: { amount: true },
            _count: true,
            where: {
                status: 'PAID',
                ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt })
            }
        });

        const totalRevenue = transactionStats._sum?.amount || 0;
        const totalTransactions = transactionStats._count || 0;

        const now = new Date();
        const getComparisonRanges = () => {
            let currentStart;
            let currentEnd;

            if (dateFrom || dateTo) {
                currentStart = dateFrom ? new Date(dateFrom) : new Date(new Date(dateTo).getTime() - 30 * 24 * 60 * 60 * 1000);
                currentEnd = dateTo ? new Date(dateTo) : now;
                currentEnd.setHours(23, 59, 59, 999);
            } else {
                currentEnd = now;
                currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            const periodMs = Math.max(1, currentEnd.getTime() - currentStart.getTime());
            const previousEnd = new Date(currentStart.getTime());
            const previousStart = new Date(currentStart.getTime() - periodMs);

            return { currentStart, currentEnd, previousStart, previousEnd };
        };

        const { currentStart, currentEnd, previousStart, previousEnd } = getComparisonRanges();
        const currentRange = { gte: currentStart, lte: currentEnd };
        const previousRange = { gte: previousStart, lt: previousEnd };

        const calcTrend = (current, previous) => {
            if (previous === 0 && current === 0) return null;
            if (previous === 0) return current > 0 ? 100 : null;
            return parseFloat((((current - previous) / previous) * 100).toFixed(1));
        };

        const [usersRecent, usersPrev] = await Promise.all([
            prisma.user.count({ where: { createdAt: currentRange } }),
            prisma.user.count({ where: { createdAt: previousRange } })
        ]);

        const [revenueRecent, revenuePrev] = await Promise.all([
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { status: 'PAID', createdAt: currentRange }
            }),
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { status: 'PAID', createdAt: previousRange }
            })
        ]);

        const [bookingsRecent, bookingsPrev] = await Promise.all([
            prisma.booking.count({ where: { status: 'CONFIRMED', createdAt: currentRange } }),
            prisma.booking.count({ where: { status: 'CONFIRMED', createdAt: previousRange } })
        ]);

        const trends = {
            users: calcTrend(usersRecent, usersPrev),
            revenue: calcTrend(revenueRecent._sum?.amount || 0, revenuePrev._sum?.amount || 0),
            bookings: calcTrend(bookingsRecent, bookingsPrev)
        };

        const confirmedBookingWhere = {
            status: 'CONFIRMED',
            ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt })
        };

        const topMovies = await prisma.movie.findMany({
            select: {
                id: true,
                title: true,
                poster: { select: { source: true } },
                shows: {
                    select: {
                        bookings: {
                            where: confirmedBookingWhere,
                            select: { total: true }
                        }
                    }
                }
            },
            where: {
                isActive: true,
                shows: { some: { bookings: { some: confirmedBookingWhere } } }
            }
        });

        const topMoviesWithStats = topMovies.map(m => ({
            id: m.id,
            title: m.title,
            poster: m.poster,
            bookings: m.shows.reduce((acc, s) => acc + s.bookings.length, 0),
            revenue: m.shows.reduce((acc, s) => {
                return acc + s.bookings.reduce((sum, b) => sum + b.total, 0);
            }, 0)
        })).sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings).slice(0, 5);

        const topTheaters = await prisma.theater.findMany({
            select: {
                id: true,
                name: true,
                city: true,
                shows: {
                    select: {
                        bookings: {
                            where: confirmedBookingWhere,
                            select: { total: true }
                        }
                    }
                }
            },
            where: {
                shows: { some: { bookings: { some: confirmedBookingWhere } } }
            }
        });

        const topTheatersWithStats = topTheaters.map(t => ({
            id: t.id,
            name: t.name,
            city: t.city,
            bookings: t.shows.reduce((acc, s) => acc + s.bookings.length, 0),
            revenue: t.shows.reduce((acc, s) => {
                return acc + s.bookings.reduce((sum, b) => sum + b.total, 0);
            }, 0)
        })).sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings).slice(0, 5);

        res.json({
            dateRange: dateFilter.createdAt || 'All time',
            stats: {
                users: totalUsers,
                activeShows: totalActiveShows,
                activeMovies: totalActiveMovies,
                theaters: totalTheaters,
                bookings: {
                    total: totalBookings,
                    confirmed: confirmedBookings,
                    pending: pendingBookings,
                    cancelled: cancelledBookings
                },
                transactions: {
                    total: totalTransactions,
                    totalRevenue
                }
            },
            trends,
            topMovies: topMoviesWithStats,
            topTheaters: topTheatersWithStats
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminBookingController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getBookingsReport = async (req, res) => {
    try {
        const { groupBy = 'date', dateFrom, dateTo } = req.query;

        let dateFilter = {};
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom) {
                dateFilter.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.createdAt.lte = toDate;
            }
        }

        let grouping = [];

        if (groupBy === 'date') {
            const bookings = await prisma.booking.groupBy({
                by: ['createdAt'], // Will need to manually group by date
                _count: true,
                _sum: { total: true },
                where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}
            });

            const byDate = {};
            const allBookings = await prisma.booking.findMany({
                where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {},
                select: { createdAt: true, total: true, status: true }
            });

            allBookings.forEach(b => {
                const date = new Date(b.createdAt).toISOString().split('T')[0];
                if (!byDate[date]) {
                    byDate[date] = { count: 0, revenue: 0, confirmed: 0, pending: 0 };
                }
                byDate[date].count++;
                byDate[date].revenue += b.total;
                if (b.status === 'CONFIRMED') byDate[date].confirmed++;
                if (b.status === 'PENDING') byDate[date].pending++;
            });

            grouping = Object.entries(byDate).map(([date, stats]) => ({
                date,
                ...stats
            }));
        } else if (groupBy === 'status') {
            const stats = await prisma.booking.groupBy({
                by: ['status'],
                _count: true,
                _sum: { total: true },
                where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}
            });

            grouping = stats.map(s => ({
                status: s.status,
                count: s._count,
                revenue: s._sum?.total || 0
            }));
        } else if (groupBy === 'movie') {
            const stats = await prisma.booking.groupBy({
                by: ['showId'],
                _count: true,
                _sum: { total: true },
                where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}
            });

            const showsWithMovies = await prisma.show.findMany({
                where: { id: { in: stats.map(s => s.showId) } },
                include: { movie: { select: { id: true, title: true } } }
            });

            grouping = stats.map(s => {
                const show = showsWithMovies.find(sh => sh.id === s.showId);
                return {
                    showId: s.showId,
                    movieId: show?.movie.id,
                    movieTitle: show?.movie.title,
                    count: s._count,
                    revenue: s._sum?.total || 0
                };
            });
        }

        res.json({
            groupBy,
            dateRange: dateFilter.createdAt || 'All time',
            data: grouping
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminBookingController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getRevenueReport = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;

        let dateFilter = {};
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom) {
                dateFilter.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.createdAt.lte = toDate;
            }
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                status: 'PAID',
                ...(dateFilter.createdAt && { createdAt: dateFilter.createdAt })
            },
            select: {
                transactionCode: true,
                amount: true,
                paymentMethod: true,
                type: true,
                createdAt: true,
                user: { select: { email: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const summary = {
            totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
            transactionCount: transactions.length,
            byPaymentMethod: {},
            byType: {},
            byDate: {}
        };

        transactions.forEach(t => {
            if (!summary.byPaymentMethod[t.paymentMethod]) {
                summary.byPaymentMethod[t.paymentMethod] = { count: 0, amount: 0 };
            }
            summary.byPaymentMethod[t.paymentMethod].count++;
            summary.byPaymentMethod[t.paymentMethod].amount += t.amount;

            if (!summary.byType[t.type]) {
                summary.byType[t.type] = { count: 0, amount: 0 };
            }
            summary.byType[t.type].count++;
            summary.byType[t.type].amount += t.amount;

            const date = new Date(t.createdAt).toISOString().split('T')[0];
            if (!summary.byDate[date]) {
                summary.byDate[date] = { date, amount: 0, count: 0 };
            }
            summary.byDate[date].amount += t.amount;
            summary.byDate[date].count++;
        });

        res.json({
            dateRange: dateFilter.createdAt || 'All time',
            summary: {
                ...summary,
                byDate: Object.values(summary.byDate).sort((a, b) => a.date.localeCompare(b.date))
            },
            transactions: transactions.slice(0, 50) // Limit to first 50 for display
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminBookingController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
