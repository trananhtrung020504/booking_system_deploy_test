import prisma from '../../config/database.js';

const parseExpiresAt = (value) => {
    if (value === undefined) return undefined;
    const date = new Date(value);
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        date.setHours(23, 59, 59, 999);
    }
    return date;
};

const normalizeVoucherPayload = (body, existing = {}) => {
    const type = body.type || existing.type || 'FIXED';
    const value = body.value !== undefined ? Number(body.value) : existing.value;
    const minOrder = body.minOrder !== undefined ? Number(body.minOrder) : (existing.minOrder ?? 0);
    const maxDiscount = body.maxDiscount === '' || body.maxDiscount === null
        ? null
        : body.maxDiscount !== undefined
            ? Number(body.maxDiscount)
            : existing.maxDiscount;
    const usageLimit = body.usageLimit !== undefined ? Number(body.usageLimit) : (existing.usageLimit ?? 100);
    const expiresAt = body.expiresAt !== undefined ? parseExpiresAt(body.expiresAt) : existing.expiresAt;
    const isActive = body.isActive !== undefined
        ? body.isActive === true || body.isActive === 'true'
        : (existing.isActive ?? true);

    return {
        code: body.code !== undefined ? String(body.code).trim().toUpperCase() : existing.code,
        type,
        value,
        minOrder,
        maxDiscount,
        usageLimit,
        expiresAt,
        isActive
    };
};

const validateVoucher = ({ code, type, value, minOrder, maxDiscount, usageLimit, expiresAt }) => {
    if (!code) return 'Mã voucher là bắt buộc';
    if (!['PERCENT', 'FIXED'].includes(type)) return 'Loại voucher không hợp lệ';
    if (!Number.isFinite(value) || value <= 0) return 'Giá trị giảm phải lớn hơn 0';
    if (type === 'PERCENT' && value > 100) return 'Voucher phần trăm không được vượt quá 100%';
    if (!Number.isFinite(minOrder) || minOrder < 0) return 'Đơn tối thiểu không hợp lệ';
    if (maxDiscount !== null && maxDiscount !== undefined && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
        return 'Mức giảm tối đa không hợp lệ';
    }
    if (!Number.isInteger(usageLimit) || usageLimit < 1) return 'Lượt dùng phải lớn hơn 0';
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) return 'Ngày hết hạn không hợp lệ';
    if (expiresAt <= new Date()) return 'Ngày hết hạn phải ở hiện tại hoặc tương lai';
    return null;
};

export const getAdminVouchers = async (req, res) => {
    try {
        const { search, isActive } = req.query;
        const where = {};

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (search) {
            where.code = { contains: String(search).trim(), mode: 'insensitive' };
        }

        const vouchers = await prisma.voucher.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { bookings: true } } }
        });

        const [total, active, inactive, expired] = await Promise.all([
            prisma.voucher.count(),
            prisma.voucher.count({ where: { isActive: true } }),
            prisma.voucher.count({ where: { isActive: false } }),
            prisma.voucher.count({ where: { expiresAt: { lt: new Date() } } })
        ]);

        res.json({
            success: true,
            vouchers,
            stats: { total, active, inactive, expired }
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminVoucherController.js]:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createVoucher = async (req, res) => {
    try {
        const data = normalizeVoucherPayload(req.body);
        const validationError = validateVoucher(data);
        if (validationError) return res.status(400).json({ message: validationError });

        const voucher = await prisma.voucher.create({ data });
        res.status(201).json({ message: 'Đã tạo voucher', voucher });
    } catch (error) {
        console.error(`[Controller Error] [web/adminVoucherController.js]:`, error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Mã voucher đã tồn tại' });
        }
        res.status(500).json({ message: error.message });
    }
};

export const updateVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.voucher.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: 'Voucher not found' });

        const data = normalizeVoucherPayload(req.body, existing);
        const validationError = validateVoucher(data);
        if (validationError) return res.status(400).json({ message: validationError });

        const voucher = await prisma.voucher.update({ where: { id }, data });
        res.json({ message: 'Đã cập nhật voucher', voucher });
    } catch (error) {
        console.error(`[Controller Error] [web/adminVoucherController.js]:`, error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Mã voucher đã tồn tại' });
        }
        res.status(500).json({ message: error.message });
    }
};

export const toggleVoucherActive = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.voucher.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: 'Voucher not found' });

        const voucher = await prisma.voucher.update({
            where: { id },
            data: { isActive: !existing.isActive }
        });

        res.json({
            message: voucher.isActive ? 'Đã kích hoạt voucher' : 'Đã tạm dừng voucher',
            voucher
        });
    } catch (error) {
        console.error(`[Controller Error] [web/adminVoucherController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.voucher.findUnique({
            where: { id },
            include: { _count: { select: { bookings: true } } }
        });
        if (!existing) return res.status(404).json({ message: 'Voucher not found' });

        if (existing._count.bookings > 0) {
            const voucher = await prisma.voucher.update({
                where: { id },
                data: { isActive: false }
            });
            return res.json({
                message: 'Voucher đã có lịch sử sử dụng nên được chuyển sang tạm dừng',
                voucher
            });
        }

        await prisma.voucher.delete({ where: { id } });
        res.json({ message: 'Đã xóa voucher' });
    } catch (error) {
        console.error(`[Controller Error] [web/adminVoucherController.js]:`, error);
        res.status(500).json({ message: error.message });
    }
};
