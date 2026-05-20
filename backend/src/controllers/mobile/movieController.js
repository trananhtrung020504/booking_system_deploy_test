import prisma from '../../config/database.js';
import { deleteFromR2 } from '../../config/cloudflareR2.js';

export const createMovie = async (req, res) => {
    const movieUploadData = req.movieUploadData; // From upload middleware
    const { title, description, duration, genre, releaseDate, languages, certification, format } = req.body;

    const movieData = {
        title,
        description,
        duration,
        genre: Array.isArray(genre) ? genre : [genre],
        releaseDate: new Date(releaseDate),
        languages: Array.isArray(languages) ? languages : [languages],
        certification,
        format: Array.isArray(format) ? format : [format],
    };

    if (movieUploadData?.key && movieUploadData?.publicUrl) {
        movieData.poster = {
            create: {
                publicId: movieUploadData.key,
                source: movieUploadData.publicUrl
            }
        };
    }

    try {
        const movie = await prisma.movie.create({
            data: movieData,
            include: { poster: true }
        });

        return res.status(201).json({
            success: true,
            message: "Tạo phim mới thành công",
            movie
        });

    } catch (error) {
        console.error(`[Controller Error] [mobile/movieController.js]:`, error);
        if (movieUploadData?.key) {
            await deleteFromR2(movieUploadData.key);
        }
        return res.status(500).json({ message: `Lỗi tạo phim: ${error.message}` });
    }
};

export const getMovies = async (req, res) => {
    try {
        const movies = await prisma.movie.findMany({
            include: { poster: true }
        });
        res.json(movies);
    } catch (error) {
        console.error(`[Controller Error] [mobile/movieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getMovie = async (req, res) => {
    try {
        const movie = await prisma.movie.findUnique({
            where: { id: req.params.id },
            include: { poster: true }
        });
        if (!movie) return res.status(404).json({ message: "Movie not found" });
        res.json(movie);
    } catch (error) {
        console.error(`[Controller Error] [mobile/movieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
