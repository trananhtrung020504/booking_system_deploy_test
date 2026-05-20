import prisma from '../config/database.js';

/**
 * Screen Service - Xử lý các nghiệp vụ liên quan đến Phòng chiếu
 */
export const createScreenWithSeats = async (screenData) => {
    const { name, theaterId, rows, cols } = screenData;

    return await prisma.$transaction(async (tx) => {
        // 1. Tạo Phòng chiếu
        const screen = await tx.screen.create({
            data: {
                name,
                theaterId,
                rows: parseInt(rows),
                cols: parseInt(cols)
            }
        });

        // 2. Logic tự động sinh ghế
        const seatsToCreate = [];
        const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

        for (let r = 0; r < rows; r++) {
            const rowLabel = rowLabels[r];
            for (let c = 1; c <= cols; c++) {
                // Quy tắc phân loại ghế mặc định:
                // - Hàng A-D: STANDARD
                // - Hàng E-H: VIP
                // - Các hàng còn lại: SWEETBOX
                let type = 'STANDARD';
                if (r >= 4 && r <= 7) type = 'VIP';
                if (r >= 8) type = 'SWEETBOX';

                seatsToCreate.push({
                    screenId: screen.id,
                    row: rowLabel,
                    column: c,
                    type: type
                });
            }
        }

        // 3. Lưu toàn bộ ghế vào DB
        await tx.seat.createMany({
            data: seatsToCreate
        });

        return {
            ...screen,
            totalSeats: seatsToCreate.length
        };
    });
};

export const getScreenDetails = async (screenId) => {
    return await prisma.screen.findUnique({
        where: { id: screenId },
        include: {
            seats: {
                orderBy: [
                    { row: 'asc' },
                    { column: 'asc' }
                ]
            }
        }
    });
};
