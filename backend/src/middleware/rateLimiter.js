import rateLimit from 'express-rate-limit';
import prisma from '../config/database.js';
import { checkAndExpireBookings } from '../controllers/web/bookingController.js';

// 1. Global rate limiter (100 requests per minute per IP)
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều yêu cầu lên máy chủ. Vui lòng quay lại sau 1 phút.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. Auth rate limiter (5 login/signup attempts in 15 seconds per IP)
export const authLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 seconds window
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 15 giây.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Chatbot rate limiter (5 questions in 1 minute per IP)
export const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5, // Limit each IP to 5 questions per windowMs
  message: {
    success: false,
    message: 'Chatbot cần thời gian suy nghĩ. Vui lòng đợi 1 phút trước khi hỏi câu tiếp theo!'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Chatbot payload validator (Filters repetitious spam strings like "aaaaaaa" or lặp từ)
export const validateChatInput = (req, res, next) => {
  const { question } = req.body;
  if (question) {
    const repPattern = /(.)\1{5,}/; // Any character repeating 6 times or more (e.g. "aaaaaa", "??????")
    const stringRepeatPattern = /(..*)\1{4,}/; // Any string repeating 5 times or more
    
    if (repPattern.test(question) || stringRepeatPattern.test(question)) {
      return res.status(400).json({
        success: false,
        message: 'Trợ lý ảo phát hiện câu hỏi chứa các ký tự lặp vô nghĩa. Vui lòng nhập câu hỏi rõ ràng hơn để được hỗ trợ nhé!'
      });
    }
  }
  next();
};

// 5. Seat lock / Booking creation validator
export const validateNewBooking = async (req, res, next) => {
  const userId = req.userId || req.user?.id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Mã xác thực người dùng không hợp lệ. Vui lòng đăng nhập lại!'
    });
  }

  try {
    // A. Clean up expired bookings for this user first
    const io = req.app.get('io');
    await checkAndExpireBookings(userId, io);

    // B. Kiểm tra xem user có đơn hàng PENDING nào chưa thanh toán không
    // Mỗi user chỉ được phép có tối đa 1 đơn hàng PENDING giữ ghế song song
    const activePendingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: 'PENDING',
      }
    });

    if (activePendingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Bạn có một giao dịch đặt vé đang chờ thanh toán. Vui lòng hoàn tất thanh toán hoặc hủy đơn hàng cũ trước khi bắt đầu chọn đặt suất chiếu mới!'
      });
    }

    // B. Kiểm tra hình phạt đóng băng: CHỈ ĐẾM CÁC ĐƠN HỦY HOẶC HẾT HẠN
    // Nếu hủy/hết hạn >= 3 lần trong vòng 10 giây qua thì khóa đặt vé (để kiểm tra khi test)
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
    const recentCancellations = await prisma.booking.findMany({
      where: {
        userId,
        status: { in: ['CANCELLED', 'EXPIRED'] },
        updatedAt: { gte: tenSecondsAgo }
      },
      orderBy: { updatedAt: 'desc' },
      take: 3
    });

    if (recentCancellations.length >= 3) {
      const oldestOfThree = recentCancellations[2];
      const expiryTime = new Date(oldestOfThree.updatedAt).getTime() + 10 * 1000;
      const remainingSeconds = Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));

      return res.status(403).json({
        success: false,
        message: `Tài khoản của bạn đang tạm thời bị khoá do huỷ giao dịch quá nhiều lần. Vui lòng thử lại sau ${remainingSeconds} giây.`
      });
    }

    next();
  } catch (error) {
    console.error('[validateNewBooking] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ trong quá trình kiểm tra đặt vé.',
      error: error.message
    });
  }
};
