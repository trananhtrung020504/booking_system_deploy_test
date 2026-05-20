import prisma from '../../config/database.js';
import { uploadToR2, deleteFromR2 } from '../../config/cloudflareR2.js';
import { createScreenWithSeats } from '../../services/screen.service.js';

export const createTheater = async (req, res) => {
    try {
        const { name, location, city, state } = req.body;

        if (!name || !location || !city) {
            return res.status(400).json({ message: "name, location, and city are required" });
        }

        const theater = await prisma.theater.create({
            data: { name, location, city, state: state || null },
            include: { logo: true }
        });

        if (req.file) {
            try {
                const logoKey = `theaters/logos/${theater.id}-${Date.now()}`;
                const result = await uploadToR2(logoKey, req.file.buffer, req.file.mimetype);
                await prisma.theaterLogo.create({
                    data: { publicId: logoKey, source: result.publicUrl, theaterId: theater.id }
                });
                theater.logo = await prisma.theaterLogo.findUnique({ where: { theaterId: theater.id } });
            } catch (err) {
                console.error("Error uploading logo:", err);
            }
        }

        await createScreenWithSeats({
            name: "Phòng chiếu 01",
            theaterId: theater.id,
            rows: 10,
            cols: 12
        });

        res.status(201).json({ message: "Theater, Screen and Seats created successfully", theater });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllTheaters = async (req, res) => {
    try {
        const { page = 1, limit = 20, city, search } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const where = {};
        if (city) where.city = city;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [theaters, total] = await Promise.all([
            prisma.theater.findMany({
                where,
                include: { logo: true, shows: { select: { id: true } }, screens: true },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            }),
            prisma.theater.count({ where })
        ]);

        res.json({
            theaters: theaters.map(t => ({ ...t, activeShowsCount: t.shows.length, shows: undefined })),
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCities = async (req, res) => {
    try {
        const theaters = await prisma.theater.findMany({
            select: { city: true },
            distinct: ['city'],
            orderBy: { city: 'asc' }
        });
        res.json(theaters.map(t => t.city));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTheater = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.id;

        const theater = await prisma.theater.update({
            where: { id },
            data: updates,
            include: { logo: true }
        });

        if (req.file) {
            try {
                const oldLogo = await prisma.theaterLogo.findUnique({ where: { theaterId: id } });
                if (oldLogo) {
                    await deleteFromR2(oldLogo.publicId);
                    await prisma.theaterLogo.delete({ where: { id: oldLogo.id } });
                }
                const logoKey = `theaters/logos/${theater.id}-${Date.now()}`;
                const result = await uploadToR2(logoKey, req.file.buffer, req.file.mimetype);
                await prisma.theaterLogo.create({
                    data: { publicId: logoKey, source: result.publicUrl, theaterId: theater.id }
                });
                theater.logo = await prisma.theaterLogo.findUnique({ where: { theaterId: id } });
            } catch (err) {
                console.error("Error uploading logo:", err);
            }
        }

        res.json({ message: "Theater updated successfully", theater });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTheater = async (req, res) => {
    try {
        const { id } = req.params;
        const logo = await prisma.theaterLogo.findUnique({ where: { theaterId: id } });
        if (logo) {
            await deleteFromR2(logo.publicId);
            await prisma.theaterLogo.delete({ where: { id: logo.id } });
        }
        const theater = await prisma.theater.delete({ where: { id } });
        res.json({ message: "Theater deleted successfully", theater });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTheaterAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const theater = await prisma.theater.findUnique({
            where: { id },
            include: {
                logo: true,
                shows: {
                    include: {
                        movie: { select: { id: true, title: true } },
                        bookings: {
                            where: { status: { in: ['CONFIRMED', 'PENDING'] } },
                            select: { id: true, total: true }
                        }
                    }
                }
            }
        });

        if (!theater) return res.status(404).json({ message: "Theater not found" });

        const totalShows = theater.shows.length;
        const totalBookings = theater.shows.reduce((acc, show) => acc + show.bookings.length, 0);
        const totalRevenue = theater.shows.reduce((acc, show) => {
            return acc + show.bookings.reduce((sum, booking) => sum + booking.total, 0);
        }, 0);

        res.json({
            theater: {
                ...theater,
                shows: theater.shows.map(s => ({
                    id: s.id,
                    movie: s.movie,
                    bookingsCount: s.bookings.length,
                    revenue: s.bookings.reduce((sum, b) => sum + b.total, 0)
                }))
            },
            analytics: {
                totalShows,
                totalBookings,
                totalRevenue,
                averageBookingsPerShow: totalShows > 0 ? totalBookings / totalShows : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
