import prisma from '../../config/database.js';

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
                            theater: { select: { name: true, city: true } }
                        }
                    }
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
                        theater: { include: { logo: true } }
                    }
                },
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
            where: { id }
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ message: "Booking already cancelled" });
        }

        const updatedBooking = await prisma.booking.update({
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

        const topMovies = await prisma.movie.findMany({
            take: 5,
            select: {
                id: true,
                title: true,
                poster: { select: { source: true } },
                shows: {
                    select: {
                        bookings: {
                            where: { status: { in: ['CONFIRMED', 'PENDING'] } },
                            select: { total: true }
                        }
                    }
                }
            },
            where: { isActive: true },
            orderBy: {
                shows: {
                    _count: 'desc'
                }
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
        }));

        const topTheaters = await prisma.theater.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                city: true,
                shows: {
                    select: {
                        bookings: {
                            where: { status: { in: ['CONFIRMED', 'PENDING'] } },
                            select: { total: true }
                        }
                    }
                }
            },
            orderBy: {
                shows: {
                    _count: 'desc'
                }
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
        }));

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
            byType: {}
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
        });

        res.json({
            dateRange: dateFilter.createdAt || 'All time',
            summary,
            transactions: transactions.slice(0, 50) // Limit to first 50 for display
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminBookingController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
