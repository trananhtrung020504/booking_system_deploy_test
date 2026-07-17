import prisma from '../../config/database.js';
import { uploadToR2, deleteFromR2 } from '../../config/cloudflareR2.js';
import { format } from 'date-fns';

export const createMovie = async (req, res) => {
    try {
        const {
            title,
            description,
            duration,
            genre,
            releaseDate,
            languages,
            certification,
            format,
            trailerUrl,
            isActive
        } = req.body;

        if (!title || !description || !duration || !releaseDate) {
            return res.status(400).json({
                message: "title, description, duration, and releaseDate are required"
            });
        }

        const existingMovie = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: 'insensitive' } }
        });

        if (existingMovie) {
            return res.status(400).json({
                message: "Phim với tên này đã tồn tại trong hệ thống. Vui lòng chọn tên khác."
            });
        }

        const parseArray = (field) => {
            if (Array.isArray(field)) return field;
            if (typeof field === 'string') {
                try {
                    const parsed = JSON.parse(field);
                    return Array.isArray(parsed) ? parsed : [field];
                } catch (e) {
                    return field.split(',').map(s => s.trim());
                }
            }
            return [];
        };

        const genreArray = parseArray(genre);
        const languagesArray = parseArray(languages);
        const formatArray = parseArray(format);

        const movie = await prisma.movie.create({
            data: {
                title,
                description,
                duration: parseInt(duration),
                genre: genreArray,
                releaseDate: new Date(releaseDate),
                languages: languagesArray,
                certification: certification || 'PG-13',
                format: formatArray,
                trailerUrl: trailerUrl || null,
                isActive: isActive !== 'false'
            },
            include: { poster: true }
        });

        if (req.file) {
            try {
                const posterKey = `movies/posters/${movie.id}-${Date.now()}`;
                const result = await uploadToR2(posterKey, req.file.buffer, req.file.mimetype);

                await prisma.moviePoster.create({
                    data: {
                        publicId: posterKey,
                        source: result.publicUrl,
                        movieId: movie.id
                    }
                });

                movie.poster = await prisma.moviePoster.findUnique({
                    where: { movieId: movie.id }
                });
            } catch (err) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, err);
                console.error("Error uploading poster:", err);
            }
        }

        res.status(201).json({
            message: "Movie created successfully",
            movie
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getMovieById = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await prisma.movie.findUnique({
            where: { id },
            include: { poster: true }
        });

        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }

        res.json({ movie });
    } catch (error) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getAllMovies = async (req, res) => {
    try {
        const { page = 1, limit = 20, isActive, search } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const where = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        const [movies, total] = await Promise.all([
            prisma.movie.findMany({
                where,
                include: {
                    poster: true,
                    shows: { select: { id: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            }),
            prisma.movie.count({ where })
        ]);

        res.json({
            movies: movies.map(m => ({
                ...m,
                showCount: m.shows.length,
                shows: undefined
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        delete updates.id;
        delete updates.role;

        const parseArray = (field) => {
            if (Array.isArray(field)) return field;
            if (typeof field === 'string') {
                try {
                    const parsed = JSON.parse(field);
                    return Array.isArray(parsed) ? parsed : [field];
                } catch (e) {
                    return field.split(',').map(s => s.trim());
                }
            }
            return field;
        };

        if (updates.genre) updates.genre = parseArray(updates.genre);
        if (updates.languages) updates.languages = parseArray(updates.languages);
        if (updates.format) updates.format = parseArray(updates.format);
        
        if (updates.duration) {
            updates.duration = parseInt(updates.duration);
        }
        if (updates.releaseDate) {
            const newReleaseDate = new Date(updates.releaseDate);
            
            const earliestShow = await prisma.show.findFirst({
                where: { movieId: id },
                orderBy: { startTime: 'asc' }
            });

            if (earliestShow && new Date(earliestShow.startTime) < newReleaseDate) {
                return res.status(400).json({
                    message: `Không thể dời ngày khởi chiếu tới ${format(newReleaseDate, 'dd/MM/yyyy')}. Lý do: Đã tồn tại suất chiếu diễn ra vào ngày ${format(new Date(earliestShow.startTime), 'dd/MM/yyyy')} (trước ngày khởi chiếu mới).`
                });
            }

            updates.releaseDate = newReleaseDate;
        }
        if (updates.isActive !== undefined) {
            updates.isActive = String(updates.isActive) === 'true';
        }

        if (updates.title) {
            const existingTitle = await prisma.movie.findFirst({
                where: { 
                    title: { equals: updates.title, mode: 'insensitive' },
                    id: { not: id }
                }
            });

            if (existingTitle) {
                return res.status(400).json({
                    message: "Tên phim này đã được sử dụng bởi một bộ phim khác."
                });
            }
        }

        const movie = await prisma.movie.update({
            where: { id },
            data: updates,
            include: { poster: true }
        });

        if (req.file) {
            try {
                const oldPoster = await prisma.moviePoster.findUnique({
                    where: { movieId: id }
                });

                if (oldPoster) {
                    await deleteFromR2(oldPoster.publicId);
                    await prisma.moviePoster.delete({
                        where: { id: oldPoster.id }
                    });
                }

                const posterKey = `movies/posters/${movie.id}-${Date.now()}`;
                const result = await uploadToR2(posterKey, req.file.buffer, req.file.mimetype);

                await prisma.moviePoster.create({
                    data: {
                        publicId: posterKey,
                        source: result.publicUrl,
                        movieId: movie.id
                    }
                });

                movie.poster = await prisma.moviePoster.findUnique({
                    where: { movieId: id }
                });
            } catch (err) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, err);
                console.error("Error uploading poster:", err);
            }
        }

        res.json({
            message: "Movie updated successfully",
            movie
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;

        const movie = await prisma.movie.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({
            message: "Movie deleted successfully",
            movie
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const hardDeleteMovie = async (req, res) => {
    try {
        const { id } = req.params;

        const poster = await prisma.moviePoster.findUnique({
            where: { movieId: id }
        });

        if (poster) {
            await deleteFromR2(poster.publicId);
            await prisma.moviePoster.delete({
                where: { id: poster.id }
            });
        }

        const movie = await prisma.movie.delete({
            where: { id }
        });

        res.json({
            message: "Movie permanently deleted",
            movie
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getMovieAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        const movie = await prisma.movie.findUnique({
            where: { id },
            include: {
                poster: true,
                shows: {
                    include: {
                        bookings: {
                            where: { status: { in: ['CONFIRMED', 'PENDING'] } },
                            select: { id: true, total: true }
                        }
                    }
                }
            }
        });

        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }

        const totalShows = movie.shows.length;
        const totalBookings = movie.shows.reduce((acc, show) => acc + show.bookings.length, 0);
        const totalRevenue = movie.shows.reduce((acc, show) => {
            return acc + show.bookings.reduce((sum, booking) => sum + booking.total, 0);
        }, 0);

        res.json({
            movie: {
                ...movie,
                shows: movie.shows.map(s => ({ ...s, bookings: undefined }))
            },
            analytics: {
                totalShows,
                totalBookings,
                totalRevenue,
                averageBookingsPerShow: totalShows > 0 ? totalBookings / totalShows : 0
            }
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminMovieController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
