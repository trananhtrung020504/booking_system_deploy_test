import prisma from '../../config/database.js';

export const getMovies = async (req, res) => {
    try {
        const { genre, search, status, page = 1, limit = 12, sort = 'releaseDate' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = { isActive: true };
        const now = new Date();

        if (genre) where.genre = { has: genre };
        if (search) where.title = { contains: search, mode: 'insensitive' };
        
        if (status === 'now-showing') {
            where.releaseDate = { lte: now };
        } else if (status === 'coming-soon') {
            where.releaseDate = { gt: now };
        }

        const orderBy = {};
        switch (sort) {
            case 'rating':
            case 'trending':
                orderBy.rating = 'desc';
                break;
            case 'title':
                orderBy.title = 'asc';
                break;
            case 'releaseDate':
            default:
                orderBy.releaseDate = 'desc';
                break;
        }

        const [movies, total] = await Promise.all([
            prisma.movie.findMany({
                where,
                include: { poster: true },
                orderBy,
                skip,
                take: limitNum
            }),
            prisma.movie.count({ where })
        ]);

        res.json({
            movies,
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

export const getMovie = async (req, res) => {
    try {
        const movie = await prisma.movie.findUnique({
            where: { id: req.params.id },
            include: {
                poster: true,
                shows: {
                    where: {
                        isActive: true,
                        startTime: { gte: new Date() }
                    },
                    include: { theater: { include: { logo: true } } },
                    orderBy: { startTime: 'asc' }
                }
            }
        });
        if (!movie) return res.status(404).json({ message: "Movie not found" });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getGenres = async (req, res) => {
    try {
        const movies = await prisma.movie.findMany({
            where: { isActive: true },
            select: { genre: true }
        });
        const allGenres = [...new Set(movies.flatMap(m => m.genre))].sort();
        res.json(allGenres);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
