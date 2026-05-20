import prisma from '../../config/database.js';
import { nanoid } from 'nanoid'; // Need to install nanoid

export const createBooking = async (req, res) => {
    const { showId, seats, totalAmount, paymentId, paymentMethod } = req.body;
    const userId = req.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Check if seats are already booked
            const existingBookings = await tx.booking.findMany({
                where: {
                    showId,
                    status: 'CONFIRMED',
                    seats: { hasSome: seats }
                }
            });

            if (existingBookings.length > 0) {
                throw new Error("One or more seats are already booked");
            }

            // 2. Create Booking
            const bookingRef = `BKS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const booking = await tx.booking.create({
                data: {
                    bookingRef,
                    userId,
                    showId,
                    seats,
                    status: 'CONFIRMED',
                    paymentId,
                    paymentMethod,
                    ticketPrice: totalAmount / seats.length, // Simplified
                    total: totalAmount,
                    convenience: 0 // Simplified
                }
            });

            return booking;
        });

        res.status(201).json({
            success: true,
            message: "Booking successful",
            booking: result
        });

    } catch (error) {
        console.error(`[Controller Error] [mobile/bookingController.js]:`, error);
        res.status(400).json({ message: error.message });
    }
};

export const getUserBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.user.id },
            include: {
                show: {
                    include: {
                        movie: { include: { poster: true } },
                        theater: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        console.error(`[Controller Error] [mobile/bookingController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
