import prisma from '../../config/database.js';

/**
 * Admin: Create Show
 */
export const createShow = async (req, res) => {
    try {
        const {
            movieId,
            theaterId,
            screenId,
            format,
            startTime,
            endTime,
            isActive,
            priceMap
        } = req.body;

        if (!movieId || !theaterId || !screenId || !startTime) {
            return res.status(400).json({
                message: "movieId, theaterId, screenId, and startTime are required"
            });
        }

        // Verify movie, theater and screen exist
        const [movie, theater, screen] = await Promise.all([
            prisma.movie.findUnique({ where: { id: movieId } }),
            prisma.theater.findUnique({ where: { id: theaterId } }),
            prisma.screen.findUnique({ where: { id: screenId } })
        ]);

        if (!movie || !theater || !screen) {
            return res.status(404).json({
                message: "Không tìm thấy Phim, Rạp hoặc Phòng chiếu"
            });
        }

        if (screen.theaterId !== theaterId) {
            return res.status(400).json({
                message: "Phòng chiếu không thuộc về rạp đã chọn"
            });
        }

        // VALIDATION: Start time must be after release date
        const start = new Date(startTime);
        const releaseDate = new Date(movie.releaseDate);
        
        // Reset hours for release date comparison if needed, or just compare absolute time
        if (start < releaseDate) {
            return res.status(400).json({
                message: `Suất chiếu không thể diễn ra trước ngày phát hành của phim (${movie.releaseDate.toLocaleDateString('vi-VN')})`
            });
        }

        // AUTO-CALCULATE: End time based on movie duration
        const durationMinutes = movie.duration || 120;
        const end = new Date(start.getTime() + durationMinutes * 60000);

        // Default price map if not provided
        let parsedPriceMap = priceMap;
        if (typeof priceMap === 'string') {
            parsedPriceMap = JSON.parse(priceMap);
        }

        if (!parsedPriceMap) {
            parsedPriceMap = {
                STANDARD: 95000,
                VIP: 125000,
                SWEETBOX: 250000
            };
        }

        const show = await prisma.show.create({
            data: {
                movieId,
                theaterId,
                screenId,
                format: format || '2D',
                startTime: start,
                endTime: end,
                priceMap: parsedPriceMap,
                isActive: isActive !== 'false'
            },
            include: {
                movie: { include: { poster: true } },
                theater: { include: { logo: true } },
                screen: true
            }
        });

        res.status(201).json({
            message: "Show created successfully",
            show
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Get all shows
 */
export const getAllShows = async (req, res) => {
    try {
        const { page = 1, limit = 20, movieId, theaterId, status, dateFrom, dateTo } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const where = {};

        if (movieId) where.movieId = movieId;
        if (theaterId) where.theaterId = theaterId;

        if (status) {
            where.isActive = status === 'active';
        }

        if (dateFrom || dateTo) {
            where.startTime = {};
            if (dateFrom) {
                where.startTime.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                where.startTime.lte = toDate;
            }
        }

        const [shows, total] = await Promise.all([
            prisma.show.findMany({
                where,
                include: {
                    movie: { select: { id: true, title: true } },
                    theater: { select: { id: true, name: true, city: true } },
                    bookings: {
                        where: { status: { in: ['CONFIRMED', 'PENDING'] } },
                        select: { id: true }
                    }
                },
                orderBy: { startTime: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            }),
            prisma.show.count({ where })
        ]);

        res.json({
            shows: shows.map(s => ({
                ...s,
                bookingsCount: s.bookings.length,
                bookings: undefined
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Get single show by ID
 */
export const getShowById = async (req, res) => {
    try {
        const { id } = req.params;
        const show = await prisma.show.findUnique({
            where: { id },
            include: {
                movie: { select: { id: true, title: true, releaseDate: true } },
                theater: { select: { id: true, name: true } }
            }
        });

        if (!show) {
            return res.status(404).json({ message: "Show not found" });
        }

        res.json(show);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Update Show
 */
export const updateShow = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        delete updates.id;
        delete updates.movieId;
        delete updates.theaterId;

        const show = await prisma.show.update({
            where: { id },
            data: updates,
            include: {
                movie: { select: { id: true, title: true } },
                theater: { select: { id: true, name: true } },
                screen: true
            }
        });

        res.json({
            message: "Show updated successfully",
            show
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Delete Show (soft delete)
 */
export const deleteShow = async (req, res) => {
    try {
        const { id } = req.params;

        const show = await prisma.show.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({
            message: "Show deleted successfully",
            show
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Hard delete show
 */
export const hardDeleteShow = async (req, res) => {
    try {
        const { id } = req.params;

        const show = await prisma.show.delete({
            where: { id }
        });

        res.json({
            message: "Show permanently deleted",
            show
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Get show details with seat analytics
 */
export const getShowAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        const show = await prisma.show.findUnique({
            where: { id },
            include: {
                movie: { select: { id: true, title: true, duration: true } },
                theater: { select: { id: true, name: true, city: true } },
                bookings: {
                    where: { status: { in: ['CONFIRMED', 'PENDING'] } }
                },
                seatHolds: true
            }
        });

        if (!show) {
            return res.status(404).json({ message: "Show not found" });
        }

        // Fetch all seats in this screen
        const allSeats = await prisma.seat.findMany({
            where: { screenId: show.screenId }
        });

        const totalSeats = allSeats.length;
        const activeSeats = allSeats.filter(s => s.isActive).length;
        const unavailableSeats = totalSeats - activeSeats;

        // Get seat IDs from bookings and holds
        // Note: seats is now a relation, so we need to count them
        const bookedSeatsCount = show.bookings.reduce((acc, b) => acc + b.seats.length, 0);
        const heldSeatsCount = show.seatHolds.reduce((acc, h) => acc + h.seats.length, 0);
        
        const availableSeats = activeSeats - bookedSeatsCount - heldSeatsCount;
        const totalRevenue = show.bookings.reduce((sum, b) => sum + b.total, 0);

        res.json({
            show: {
                ...show,
                bookings: undefined,
                seatHolds: undefined
            },
            analytics: {
                seatAnalytics: {
                    total: totalSeats,
                    unavailable: unavailableSeats,
                    booked: bookedSeatsCount,
                    held: heldSeatsCount,
                    available: availableSeats,
                    occupancyRate: activeSeats > 0 ? `${((bookedSeatsCount / activeSeats) * 100).toFixed(2)}%` : '0%'
                },
                bookingAnalytics: {
                    totalBookings: show.bookings.length,
                    confirmedBookings: show.bookings.filter(b => b.status === 'CONFIRMED').length,
                    totalRevenue
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Get available seats status for a show
 */
export const getShowSeatsStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const show = await prisma.show.findUnique({
            where: { id },
            include: {
                bookings: {
                    where: { status: { in: ['CONFIRMED', 'PENDING'] } },
                    select: { seats: true }
                },
                seatHolds: { select: { seats: true, userId: true, expiresAt: true } }
            }
        });

        if (!show) {
            return res.status(404).json({ message: "Show not found" });
        }

        // Fetch all seats for this screen
        const screenSeats = await prisma.seat.findMany({
            where: { screenId: show.screenId },
            orderBy: [{ row: 'asc' }, { column: 'asc' }]
        });

        // Map status
        const bookedSeatIds = new Set(show.bookings.flatMap(b => b.seats.map(s => s.id)));
        const heldSeatIds = new Set(show.seatHolds.flatMap(h => h.seats.map(s => s.id)));

        const seatsByRow = {};
        screenSeats.forEach(seat => {
            if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
            
            let status = 'available';
            if (!seat.isActive) status = 'unavailable';
            else if (bookedSeatIds.has(seat.id)) status = 'booked';
            else if (heldSeatIds.has(seat.id)) status = 'held';

            seatsByRow[seat.row].push({
                ...seat,
                status
            });
        });

        res.json({
            showId: id,
            screen: {
                id: show.screenId,
                name: show.screenName // This is just for backward compat if UI needs it
            },
            seatsByRow,
            summary: {
                total: screenSeats.length,
                available: screenSeats.filter(s => s.isActive && !bookedSeatIds.has(s.id) && !heldSeatIds.has(s.id)).length,
                booked: bookedSeatIds.size,
                held: heldSeatIds.size,
                unavailable: screenSeats.filter(s => !s.isActive).length
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
