import { AIMessage } from '@langchain/core/messages';
import { Command, END } from '@langchain/langgraph';
import prisma from '../../config/database.js';

export async function bookingNode(state) {
  try {
    const intent = state.intent;
    const userId = state.userId;

    console.log(`[Node: booking_node] Handling intent "${intent}" for userId: "${userId}"`);

    // ── Xử lý INTENT: BOOKINGS (Tra cứu vé đặt của người dùng) ────────────────
    if (intent === 'bookings') {
      if (!userId || userId.trim() === '') {
        const response = {
          type: 'error',
          message: 'Bạn ơi, bạn cần đăng nhập tài khoản trên ứng dụng để kiểm tra danh sách vé đã đặt nhé!'
        };
        return new Command({
          goto: END,
          update: {
            messages: [new AIMessage({ content: JSON.stringify(response) })]
          }
        });
      }

      // Lấy danh sách bookings từ Database
      const bookings = await prisma.booking.findMany({
        where: {
          userId: userId
        },
        include: {
          show: {
            include: {
              movie: true,
              theater: true
            }
          },
          seats: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      if (bookings.length === 0) {
        const response = {
          type: 'bookings',
          message: 'Hiện tại bạn chưa có lịch sử đặt vé nào trên hệ thống RoPhim cả.',
          bookings: []
        };
        return new Command({
          goto: END,
          update: {
            messages: [new AIMessage({ content: JSON.stringify(response) })]
          }
        });
      }

      const formattedBookings = bookings.map(b => {
        const seatCodes = b.seats.map(s => `${s.row}${s.column}`);
        return {
          id: b.id,
          bookingRef: b.bookingRef,
          movieTitle: b.show.movie.title,
          theaterName: b.show.theater.name,
          startTime: b.show.startTime.toISOString(),
          seats: seatCodes,
          status: b.status,
          total: b.total
        };
      });

      const response = {
        type: 'bookings',
        message: `Chào bạn, mình đã tìm thấy danh sách ${bookings.length} vé xem phim gần đây của bạn tại rạp RoPhim:`,
        bookings: formattedBookings
      };

      return new Command({
        goto: END,
        update: {
          messages: [new AIMessage({ content: JSON.stringify(response) })]
        }
      });
    }

    // ── Xử lý INTENT: VOUCHERS (Tìm khuyến mãi & mã giảm giá) ─────────────────
    if (intent === 'vouchers') {
      const activeVouchers = await prisma.voucher.findMany({
        where: {
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (activeVouchers.length === 0) {
        const response = {
          type: 'app_question',
          message: 'Hiện tại hệ thống đang hết chương trình khuyến mãi hoạt động. Hãy quay lại kiểm tra vào đợt phim tới bạn nhé!'
        };
        return new Command({
          goto: END,
          update: {
            messages: [new AIMessage({ content: JSON.stringify(response) })]
          }
        });
      }

      const voucherListText = activeVouchers
        .map(v => {
          const discountStr = v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')}đ`;
          return `- **Mã: ${v.code}**: Giảm ${discountStr} (Áp dụng đơn tối thiểu: ${v.minOrder.toLocaleString('vi-VN')}đ, HSD: ${v.expiresAt.toLocaleDateString('vi-VN')})`;
        })
        .join('\n');

      const response = {
        type: 'app_question',
        message: `RoPhim đang tung ra các mã giảm giá và voucher siêu hot dành cho bạn đây:\n\n${voucherListText}\n\nĐừng quên áp dụng mã khi tiến hành thanh toán vé đặt nhé!`
      };

      return new Command({
        goto: END,
        update: {
          messages: [new AIMessage({ content: JSON.stringify(response) })]
        }
      });
    }

    // Trình trạng dự phòng nếu không khớp intent nào trong node này
    const fallbackResponse = {
      type: 'unknown',
      message: 'Xin lỗi, mình chưa tìm thấy thông tin bạn yêu cầu.'
    };
    return new Command({
      goto: END,
      update: {
        messages: [new AIMessage({ content: JSON.stringify(fallbackResponse) })]
      }
    });

  } catch (error) {
    console.error('[Node: booking_node] Error:', error);
    throw error;
  }
}
