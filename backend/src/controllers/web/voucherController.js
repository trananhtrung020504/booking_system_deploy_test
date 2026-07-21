import prisma from '../../config/database.js';

export const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await prisma.voucher.findMany({
            where: {
                isActive: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            vouchers
        });
    } catch (error) {
        console.error(`[Controller Error] [web/voucherController.js]:`, error);
        console.error('Get vouchers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
