import prisma from '../../config/database.js';

export const createBooking = async (req, res) => {
    const { showId, seats, paymentMethod = 'SEPAY' } = req.body;
    const userId = req.user.id;

    try {
        if (!showId || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: "showId and seats are required" });
        }

        const show = await prisma.show.findUnique({
            where: { id: showId },
            include: { screen: true }
        });
        if (!show || !show.isActive) {
            return res.status(404).json({ message: "Show not found" });
        }

        const selectedSeats = await prisma.seat.findMany({
            where: {
                id: { in: seats },
                screenId: show.screenId,
                isActive: true
            }
        });
        if (selectedSeats.length !== seats.length) {
            return res.status(400).json({ message: "One or more seats are invalid" });
        }

        const ticketTotal = selectedSeats.reduce((sum, seat) => {
            return sum + (show.priceMap?.[seat.type] || show.priceMap?.STANDARD || 0);
        }, 0);
        if (!Number.isFinite(ticketTotal) || ticketTotal <= 0) {
            return res.status(400).json({ message: "Invalid ticket price" });
        }

        const result = await prisma.$transaction(async (tx) => {
            const existingBookings = await tx.booking.findMany({
                where: {
                    showId,
                    status: { in: ['CONFIRMED', 'PENDING'] },
                    seats: { some: { id: { in: seats } } }
                }
            });

            if (existingBookings.length > 0) {
                throw new Error("One or more seats are already booked or pending payment");
            }

            const bookingRef = `BKS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            return tx.booking.create({
                data: {
                    bookingRef,
                    userId,
                    showId,
                    status: 'PENDING',
                    paymentMethod,
                    ticketPrice: ticketTotal / selectedSeats.length,
                    total: ticketTotal,
                    convenience: 0,
                    seats: { connect: seats.map((id) => ({ id })) }
                },
                include: {
                    seats: true,
                    show: {
                        include: {
                            movie: { include: { poster: true } },
                            theater: true,
                            screen: true
                        }
                    }
                }
            });
        });

        res.status(201).json({
            success: true,
            message: "Booking created and pending payment",
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
                seats: true,
                combos: { include: { combo: true } },
                show: {
                    include: {
                        movie: { include: { poster: true } },
                        theater: true,
                        screen: true
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
