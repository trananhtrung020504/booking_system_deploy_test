import prisma from '../../config/database.js';

export const getShows = async (req, res) => {
    try {
        const shows = await prisma.show.findMany({
            include: {
                movie: true,
                theater: true
            }
        });
        res.json(shows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getShow = async (req, res) => {
    try {
        const show = await prisma.show.findUnique({
            where: { id: req.params.id },
            include: { movie: true, theater: true }
        });
        if (!show) return res.status(404).json({ message: "Show not found" });
        res.json(show);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getShowsByMovie = async (req, res) => {
    try {
        const shows = await prisma.show.findMany({
            where: { movieId: req.params.movieId },
            include: { theater: true }
        });
        res.json(shows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
