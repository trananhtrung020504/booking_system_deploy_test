import prisma from '../../config/database.js';

export const getAllVouchers = async (req, res) => {
    try {
        let vouchers = await prisma.voucher.findMany({
            where: {
                isActive: true
            }
        });

        if (vouchers.length === 0) {
            console.log('Seeding initial vouchers into database...');
            const seedVouchers = [
                {
                    code: 'GIAM20',
                    type: 'PERCENT',
                    value: 20,
                    minOrder: 0,
                    expiresAt: new Date('2026-12-31T23:59:59Z'),
                    isActive: true,
                },
                {
                    code: 'VVIP50K',
                    type: 'FIXED',
                    value: 50000,
                    minOrder: 200000,
                    expiresAt: new Date('2026-12-31T23:59:59Z'),
                    isActive: true,
                },
                {
                    code: 'HAPPYTUE',
                    type: 'FIXED',
                    value: 30000,
                    minOrder: 100000,
                    expiresAt: new Date('2026-12-31T23:59:59Z'),
                    isActive: true,
                }
            ];

            for (const v of seedVouchers) {
                await prisma.voucher.upsert({
                    where: { code: v.code },
                    update: v,
                    create: v
                });
            }

            vouchers = await prisma.voucher.findMany({
                where: { isActive: true }
            });
        }

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
