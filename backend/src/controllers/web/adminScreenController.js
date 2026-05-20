import { createScreenWithSeats, getScreenDetails } from '../../services/screen.service.js';
import prisma from '../../config/database.js';

/**
 * Admin: Create Screen for a Theater
 * (This will automatically generate seats)
 */
export const createScreen = async (req, res) => {
    try {
        const { name, theaterId, rows, cols } = req.body;

        if (!name || !theaterId || !rows || !cols) {
            return res.status(400).json({
                message: "name, theaterId, rows, and cols are required"
            });
        }

        // Kiểm tra rạp có tồn tại không
        const theater = await prisma.theater.findUnique({
            where: { id: theaterId }
        });

        if (!theater) {
            return res.status(404).json({ message: "Theater not found" });
        }

        const screen = await createScreenWithSeats({
            name,
            theaterId,
            rows,
            cols
        });

        res.status(201).json({
            message: "Screen and seats created successfully",
            screen
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Get all screens for a theater
 */
export const getTheaterScreens = async (req, res) => {
    try {
        const { theaterId } = req.params;

        const screens = await prisma.screen.findMany({
            where: { theaterId },
            include: {
                _count: {
                    select: { seats: true }
                }
            }
        });

        res.json(screens);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Get screen detail with seat map
 */
export const getScreenById = async (req, res) => {
    try {
        const { id } = req.params;
        const screen = await getScreenDetails(id);

        if (!screen) {
            return res.status(404).json({ message: "Screen not found" });
        }

        res.json(screen);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
