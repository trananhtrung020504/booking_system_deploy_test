import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Command, END, interrupt } from '@langchain/langgraph';
import prisma from '../../config/database.js';
import { getBookedSeats, getHeldSeats } from '../../socket/socket.js';
import { buildConversationContext } from '../utils/contextMemory.js';

const BOOKING_INTENT_SYSTEM = `
Ngữ cảnh hiện tại: người dùng đang ở trong bước bổ sung thông tin để tiếp tục đặt vé bằng chatbot.
Phân loại câu trả lời tiếp theo của người dùng vào 1 trong các ý định:
- "book_movie": đã nêu rõ tên phim muốn đặt. Nếu câu trả lời chỉ gồm tên phim hoặc gần như chỉ gồm tên phim thì vẫn phải phân loại là "book_movie".
- "movies": chưa có tên phim nhưng đã nêu thể loại, nhu cầu gợi ý phim, hoặc muốn xem danh sách phim để chọn.
- "showtimes": hỏi lịch chiếu theo ngày/rạp.
- "unknown": không đủ thông tin hoặc đổi chủ đề.
Chỉ trả về JSON có trường "intent".
`;

const BOOKING_RECOMMENDATION_LIMIT = 3;

const intentParser = async (userText, conversationContext) => {
  const { llm } = await import('../config/openai.js');
  const { IntentResultSchema } = await import('../schema/zodSchemas.js');
  const intentLLM = llm.withStructuredOutput(IntentResultSchema);

  return intentLLM.invoke([
    new SystemMessage({ content: `${BOOKING_INTENT_SYSTEM}\nNgữ cảnh hội thoại:\n${conversationContext}` }),
    new HumanMessage({ content: userText })
  ]);
};

const buildRecommendationMessage = async () => {
  const recommendedMovies = await prisma.movie.findMany({
    where: { isActive: true },
    include: { poster: true },
    orderBy: [{ rating: 'desc' }, { releaseDate: 'desc' }],
    take: BOOKING_RECOMMENDATION_LIMIT
  });

  if (recommendedMovies.length === 0) {
    return 'Hiện tại hệ thống chưa có phim phù hợp để gợi ý thêm.';
  }

  return `Bạn có thể thử một trong các phim này: ${recommendedMovies.map((movie) => movie.title).join(', ')}.`;
};

const extractMovieTitleForBooking = async (userText, conversationContext) => {
  const activeMovies = await prisma.movie.findMany({
    where: { isActive: true },
    select: { title: true }
  });

  const movieTitlesStr = activeMovies.map((movie) => `"${movie.title}"`).join(', ');
  const { llm } = await import('../config/openai.js');
  const { z } = await import('zod');

  const extractor = llm.withStructuredOutput(z.object({
    movieTitle: z.string().describe('Tên phim chính xác nhất được nhắc tới. Trả về chuỗi rỗng nếu không xác định được.')
  }));

  const result = await extractor.invoke([
    new SystemMessage({
      content: `Bạn đang hỗ trợ trích xuất tên phim để đặt vé.
Ngữ cảnh hội thoại:
${conversationContext}

Danh sách phim hiện có trên hệ thống là: [${movieTitlesStr}]
- Nếu người dùng nhắc tới một phim trong danh sách trên, hãy trả về đúng tên phim đó.
- Nếu người dùng dùng cách nói tham chiếu như "phim này", "phim đó", "đặt luôn", hãy ưu tiên suy ra từ ngữ cảnh hội thoại.
- Nếu người dùng chưa nói rõ tên phim, hãy trả về chuỗi rỗng.`
    }),
    new HumanMessage({ content: userText })
  ]);

  return result.movieTitle?.trim() || '';
};

const buildBookingFlowForMovie = async (userText, state) => {
  const conversationContext = buildConversationContext(state);
  const movieTitle = await extractMovieTitleForBooking(userText, conversationContext);

  if (!movieTitle) {
    return {
      ok: false,
      response: {
        type: 'movie_detail_missing_field',
        message: 'Mình chưa xác định được tên phim bạn muốn đặt. Bạn hãy nhắn lại tên phim cụ thể, hoặc nói thể loại bạn muốn xem để mình gợi ý nhé.'
      }
    };
  }

  const movie = await prisma.movie.findFirst({
    where: {
      isActive: true,
      title: {
        contains: movieTitle,
        mode: 'insensitive'
      }
    },
    include: {
      poster: true,
      shows: {
        where: {
          isActive: true,
          startTime: { gte: new Date() }
        },
        include: {
          theater: true,
          screen: {
            include: {
              seats: {
                where: { isActive: true },
                select: { id: true }
              }
            }
          }
        },
        orderBy: { startTime: 'asc' },
        take: 20
      }
    }
  });

  if (!movie) {
    const recommendation = await buildRecommendationMessage();
    return {
      ok: false,
      response: {
        type: 'error',
        message: `Mình chưa tìm thấy phim "${movieTitle}" trong hệ thống. ${recommendation}`
      }
    };
  }

  if (!movie.shows || movie.shows.length === 0) {
    const recommendation = await buildRecommendationMessage();
    return {
      ok: false,
      response: {
        type: 'error',
        message: `Phim ${movie.title} hiện chưa có suất chiếu sắp tới để đặt vé. ${recommendation}`
      }
    };
  }

  const previewShows = [];

  for (const show of movie.shows) {
    const [heldSeats, bookedSeats] = await Promise.all([
      getHeldSeats(show.id),
      getBookedSeats(show.id)
    ]);

    const unavailableSeatIds = new Set([
      ...heldSeats.map((seat) => seat.seatId),
      ...bookedSeats.map((seat) => seat.seatId)
    ]);

    const availableSeats = show.screen.seats.filter((seat) => !unavailableSeatIds.has(seat.id)).length;

    if (availableSeats > 0) {
      previewShows.push({
        id: show.id,
        theaterName: show.theater.name,
        screenName: show.screen.name,
        startTime: show.startTime.toISOString(),
        format: show.format,
        availableSeats
      });
    }
  }

  if (previewShows.length === 0) {
    const recommendation = await buildRecommendationMessage();
    return {
      ok: false,
      response: {
        type: 'error',
        message: `Phim ${movie.title} vẫn còn trong hệ thống nhưng các suất chiếu sắp tới hiện đã hết ghế trống. ${recommendation}`
      }
    };
  }

  return {
    ok: true,
    response: {
      type: 'booking_flow',
      message: `Mình đã tìm thấy phim ${movie.title} và vẫn còn suất chiếu có ghế trống. Bạn có thể mở bảng đặt vé ngay trong chatbot để chọn rạp, suất chiếu, ghế và thanh toán.`,
      movie: {
        id: movie.id,
        title: movie.title,
        genre: movie.genre,
        duration: movie.duration,
        certification: movie.certification,
        poster: movie.poster?.source || null
      },
      showtimes: previewShows.slice(0, 6),
      supportedPaymentMethods: ['SEPAY']
    }
  };
};

export async function bookingNode(state) {
  try {
    const intent = state.intent;
    const userId = state.userId;

    console.log(`[Node: booking_node] Handling intent "${intent}" for userId: "${userId}"`);

    if (intent === 'book_movie') {
      if (!userId || userId.trim() === '') {
        const response = {
          type: 'error',
          message: 'Để đặt vé trực tiếp bằng chatbot, bạn vui lòng đăng nhập trước nhé. Sau khi đăng nhập, mình có thể mở ngay luồng chọn rạp, suất chiếu, ghế và thanh toán cho bạn.'
        };

        return new Command({
          goto: END,
          update: {
            messages: [new AIMessage({ content: JSON.stringify(response) })]
          }
        });
      }

      const userText = state.messages[state.messages.length - 1].content;
      const bookingFlowResult = await buildBookingFlowForMovie(userText, state);

      return new Command({
        goto: END,
        update: {
          messages: [new AIMessage({ content: JSON.stringify(bookingFlowResult.response) })]
        }
      });
    }

    if (intent === 'book_movie_missing_field') {
      if (!userId || userId.trim() === '') {
        const response = {
          type: 'error',
          message: 'Bạn vui lòng đăng nhập trước để mình có thể hỗ trợ tạo đơn đặt vé và giữ ghế an toàn trong lúc thanh toán nhé.'
        };

        return new Command({
          goto: END,
          update: {
            messages: [new AIMessage({ content: JSON.stringify(response) })]
          }
        });
      }

      const promptResponse = {
        type: 'movie_detail_missing_field',
        message: 'Bạn muốn đặt vé cho phim nào ạ? Hãy nhắn tên phim cụ thể. Nếu chưa chọn được phim, bạn cũng có thể nói thể loại mình muốn xem để mình gợi ý trước.'
      };

      const followUp = interrupt(JSON.stringify(promptResponse));
      const nextIntent = await intentParser(followUp, buildConversationContext(state));

      const routeMap = {
        book_movie: 'booking_node',
        book_movie_missing_field: 'booking_node',
        movies: 'movie_node',
        showtimes: 'showtime_node',
        app_question: 'app_question_node',
        human_intervention: 'human_node',
        unknown: 'unknown_node'
      };

      const goto = routeMap[nextIntent.intent] || 'unknown_node';

      return new Command({
        goto,
        update: {
          messages: [new HumanMessage({ content: followUp })],
          intent: nextIntent.intent,
          tool_call_count: 0
        }
      });
    }

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
