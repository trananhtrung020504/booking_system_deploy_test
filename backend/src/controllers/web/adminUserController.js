import prisma from '../../config/database.js';

export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role, isActive } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const where = {};

        if (role && ['ADMIN', 'USER'].includes(role)) {
            where.role = role;
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total, activeCount, lockedCount] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    avatar: { select: { source: true } },
                    _count: { select: { bookings: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            }),
            prisma.user.count({ where }),
            prisma.user.count({ where: { isActive: true } }),
            prisma.user.count({ where: { isActive: false } })
        ]);

        res.json({
            users,
            stats: {
                total: await prisma.user.count(),
                active: activeCount,
                locked: lockedCount
            },
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminUserController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const toggleUserActive = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Prevent admin from locking themselves
        if (user.id === req.user.id) {
            return res.status(400).json({ message: "Không thể khóa tài khoản của chính mình" });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        res.json({
            message: updatedUser.isActive ? "Đã kích hoạt tài khoản" : "Đã khóa tài khoản",
            user: updatedUser
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminUserController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
