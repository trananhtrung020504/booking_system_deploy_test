import prisma from '../../config/database.js';
import { getHeldSeats, getBookedSeats } from '../../socket/socket.js';

export const getShows = async (req, res) => {
    try {
        const { movieId, theaterId, date } = req.query;
        const where = { isActive: true };

        if (movieId) where.movieId = movieId;
        if (theaterId) where.theaterId = theaterId;

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const now = new Date();
            const filterStart = startOfDay.toDateString() === now.toDateString() ? now : startOfDay;
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.startTime = { gte: filterStart, lte: endOfDay };
        } else {
            where.startTime = { gte: new Date() };
        }

        const shows = await prisma.show.findMany({
            where,
            include: {
                movie: { include: { poster: true } },
                theater: { include: { logo: true } },
                screen: { select: { id: true, name: true } }
            },
            orderBy: { startTime: 'asc' }
        });

        res.json(shows);
    } catch (error) {
        console.error(`[Controller Error] [web/showController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getShow = async (req, res) => {
    try {
        const show = await prisma.show.findFirst({
            where: { id: req.params.id, isActive: true, endTime: { gte: new Date() } },
            include: {
                movie: { include: { poster: true } },
                theater: { include: { logo: true } },
                screen: {
                    include: {
                        seats: {
                            where: { isActive: true },
                            orderBy: [{ row: 'asc' }, { column: 'asc' }]
                        }
                    }
                }
            }
        });
        if (!show) return res.status(404).json({ message: "Show not found" });

        const [heldSeats, bookedSeats] = await Promise.all([
            getHeldSeats(show.id),
            getBookedSeats(show.id)
        ]);

        res.json({
            ...show,
            heldSeats,
            bookedSeats
        });
    } catch (error) {
        console.error(`[Controller Error] [web/showController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getShowsByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        const { date } = req.query;

        const where = { movieId, isActive: true };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const now = new Date();
            const filterStart = startOfDay.toDateString() === now.toDateString() ? now : startOfDay;
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.startTime = { gte: filterStart, lte: endOfDay };
        } else {
            where.startTime = { gte: new Date() };
        }

        const shows = await prisma.show.findMany({
            where,
            include: {
                theater: { include: { logo: true } },
                screen: { select: { id: true, name: true } }
            },
            orderBy: { startTime: 'asc' }
        });

        const groupedByTheater = {};
        for (const show of shows) {
            const theaterId = show.theaterId;
            if (!groupedByTheater[theaterId]) {
                groupedByTheater[theaterId] = { theater: show.theater, shows: [] };
            }
            const { theater, ...showWithoutTheater } = show;
            groupedByTheater[theaterId].shows.push(showWithoutTheater);
        }

        res.json({ movieId, theaters: Object.values(groupedByTheater) });
    } catch (error) {
        console.error(`[Controller Error] [web/showController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getAvailableDates = async (req, res) => {
    try {
        const { movieId } = req.params;
        const shows = await prisma.show.findMany({
            where: { movieId, isActive: true, startTime: { gte: new Date() } },
            select: { startTime: true },
            orderBy: { startTime: 'asc' }
        });

        const dates = [...new Set(shows.map(s => {
            const d = new Date(s.startTime);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }))];

        res.json(dates);
    } catch (error) {
        console.error(`[Controller Error] [web/showController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
