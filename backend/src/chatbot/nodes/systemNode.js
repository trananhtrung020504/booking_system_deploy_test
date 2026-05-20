import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { Command, END } from '@langchain/langgraph';
import { z } from 'zod';
import { llm } from '../config/openai.js';
import prisma from '../../config/database.js';
import { TextResponseSchema } from '../schema/zodSchemas.js';

// ── SCHEMAS TRÍCH XUẤT THAM SỐ (TỐI ƯU HÓA TOKEN) ──────────────────────────
const ShowtimeParamsSchema = z.object({
  movieTitle: z.string().describe('Tên phim cần tìm lịch chiếu. Trả về chuỗi rỗng "" nếu không nhắc tới.'),
  theaterName: z.string().describe('Tên rạp cần tìm lịch chiếu (ví dụ: Hùng Vương). Trả về chuỗi rỗng "" nếu không nhắc tới.'),
  date: z.string().describe('Ngày cần tìm lịch chiếu dạng YYYY-MM-DD (ví dụ: 2026-05-18). Trả về chuỗi rỗng "" nếu không nhắc tới.')
});

const showtimeParamsLLM = llm.withStructuredOutput(ShowtimeParamsSchema);
const structuredTextLLM = llm.withStructuredOutput(TextResponseSchema);

const APP_QUESTION_SYSTEM = `
Bạn là trợ lý chăm sóc khách hàng nhiệt tình của hệ thống rạp RoPhim.
Hãy trả lời câu hỏi của khách hàng dựa trên thông tin chính xác của rạp dưới đây:
1. Quy trình đặt vé: Khách hàng truy cập trang chủ, chọn bộ phim yêu thích, bấm "Đặt vé", chọn suất chiếu, chọn ghế ngồi, chọn bắp nước/combo đi kèm, áp dụng mã giảm giá (nếu có) và tiến hành thanh toán qua ZaloPay hoặc VNPay. Sau khi thanh toán thành công, vé sẽ hiển thị trong phần "Vé của tôi".
2. Chính sách hoàn trả/hủy vé: Vé xem phim đã thanh toán thành công và có mã xác nhận sẽ không được hoàn tiền hoặc thay đổi suất chiếu dưới mọi hình thức để đảm bảo tính công bằng của ghế ngồi.
3. Giá vé bắp nước/Combo:
   - Combo Solo (1 bắp ngọt + 1 nước ngọt lớn): 65,000đ.
   - Combo Couple (1 bắp ngọt lớn + 2 nước ngọt lớn): 95,000đ.
   - Combo Family (2 bắp ngọt + 4 nước ngọt): 165,000đ.
4. Giờ hoạt động: Rạp mở cửa từ 8:00 sáng đến 12:30 khuya tất cả các ngày trong tuần (kể cả lễ tết).
5. Thông tin liên hệ: Hotline hỗ trợ khẩn cấp: 1900 6688, Email: support@rophim.vn.

Hãy trả lời chi tiết, lịch sự, ân cần bằng tiếng Việt.
Đầu ra phải khớp hoàn toàn với cấu trúc Zod Schema TextResponse (type luôn là 'app_question').
`;

const UNKNOWN_SYSTEM = `
Bạn là trợ lý ảo lịch sự của rạp RoPhim.
Câu hỏi của người dùng nằm ngoài phạm vi hoạt động của hệ thống rạp phim (ví dụ: thời tiết, toán học, chính trị, v.v.).
Hãy lịch sự từ chối trả lời câu hỏi nằm ngoài phạm vi này và gợi ý họ hỏi các thông tin liên quan đến phim ảnh, lịch chiếu hoặc dịch vụ của rạp RoPhim.
Đầu ra phải khớp hoàn toàn với cấu trúc Zod Schema TextResponse (type luôn là 'unknown').
`;

// 1. Node lịch chiếu phim (Code-Formatted & Direct DB Lookup)
export async function showtimeNode(state) {
  try {
    const userText = state.messages[state.messages.length - 1].content;
    console.log(`[Node: showtime_node] Extracting showtime parameters for: "${userText}"`);

    // Cung cấp ngày giờ hiện tại của hệ thống để LLM tính toán chính xác "hôm nay", "ngày mai"
    const now = new Date();
    // Định dạng ngày Việt Nam (múi giờ GMT+7)
    const localDateStr = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];

    const systemPrompt = `Bạn là trợ lý trích xuất tham số lọc lịch chiếu phim của rạp RoPhim.
Ngày hôm nay (Hôm nay) của hệ thống là: ${localDateStr}.
Nhiệm vụ của bạn là phân tích câu hỏi người dùng và điền chính xác các bộ lọc.

⚠️ LƯU Ý ĐẶC BIỆT VỀ TIẾNG VIỆT (TRÁNH LẪN LỘN):
1. Từ "mai" có thể là tên bộ phim "Mai" HOẶC là thời gian "ngày mai".
   - Nếu câu hỏi có cụm từ "phim Mai", "suất chiếu Mai", "phim mai thế nào", "lịch chiếu phim mai", "suất chiếu phim mai" -> Đây chắc chắn là TÊN BỘ PHIM "Mai" (movieTitle = "Mai"), và KHÔNG ĐƯỢC trích xuất ngày mai vào trường "date".
   - Nếu câu hỏi có cụm từ "lịch chiếu ngày mai", "mai rạp có phim gì", "suất chiếu ngày mai" -> Đây là thời gian (ngày mai) -> Hãy tính toán ngày mai là ngày nào dựa trên ngày hôm nay (${localDateStr}) và điền vào trường "date" dạng YYYY-MM-DD.
2. Nếu người dùng không hỏi về ngày cụ thể, hãy trả về trường date là chuỗi rỗng "".`;

    // Bước 1: LLM chỉ trích xuất tham số lọc lịch chiếu
    const params = await showtimeParamsLLM.invoke([
      new SystemMessage({ content: systemPrompt }),
      new HumanMessage({ content: userText })
    ]);

    console.log(`[Node: showtime_node] Extracted Params:`, params);

    // Bước 2: Tự code truy vấn DB qua Prisma (0 hao phí token)
    const where = {
      startTime: {
        gt: new Date()
      },
      isActive: true
    };

    if (params.movieTitle && params.movieTitle.trim() !== '') {
      where.movie = {
        title: {
          contains: params.movieTitle,
          mode: 'insensitive'
        }
      };
    }

    if (params.theaterName && params.theaterName.trim() !== '') {
      where.theater = {
        name: {
          contains: params.theaterName,
          mode: 'insensitive'
        }
      };
    }

    if (params.date && params.date.trim() !== '') {
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const shows = await prisma.show.findMany({
      where,
      take: 8,
      include: {
        movie: true,
        theater: true,
        screen: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Bước 3: Định dạng các suất chiếu
    const showtimes = shows.map(s => {
      let priceRange = '95.000đ';
      if (s.priceMap && typeof s.priceMap === 'object') {
        const prices = Object.values(s.priceMap);
        if (prices.length > 0) {
          const minPrice = Math.min(...prices.map(Number));
          const maxPrice = Math.max(...prices.map(Number));
          priceRange = minPrice === maxPrice 
            ? `${minPrice.toLocaleString('vi-VN')}đ`
            : `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
        }
      }

      return {
        id: s.id,
        movieTitle: s.movie.title,
        theaterName: s.theater.name,
        screenName: s.screen.name,
        startTime: s.startTime.toISOString(),
        format: s.format,
        price: priceRange
      };
    });

    const response = {
      type: 'showtimes',
      message: showtimes.length > 0 
        ? 'Dạ RoPhim tìm thấy các suất chiếu phim phù hợp với yêu cầu của bạn đây ạ. Bạn có thể click để đặt vé trực tiếp nhé:' 
        : 'Rất tiếc, rạp hiện chưa tìm thấy lịch chiếu nào khớp với yêu cầu tra cứu của bạn. Hãy đổi mốc ngày hoặc chọn phim khác nhé!',
      showtimes
    };

    return new Command({
      goto: END,
      update: {
        messages: [new AIMessage({ content: JSON.stringify(response) })]
      }
    });

  } catch (error) {
    console.error('[Node: showtime_node] Error:', error);
    throw error;
  }
}

// 2. Node trả lời các câu hỏi FAQ hệ thống (Sử dụng LLM tạo văn bản tự nhiên)
export async function appQuestionNode(state) {
  try {
    const userText = state.messages[state.messages.length - 1].content;

    const structured = await structuredTextLLM.invoke([
      new SystemMessage({ content: APP_QUESTION_SYSTEM }),
      new HumanMessage({ content: userText })
    ]);

    return new Command({
      goto: END,
      update: {
        messages: [new AIMessage({ content: JSON.stringify(structured) })]
      }
    });
  } catch (error) {
    console.error('[Node: app_question_node] Error:', error);
    throw error;
  }
}

// 3. Node xử lý câu hỏi ngoài phạm vi
export async function unknownNode(state) {
  try {
    const userText = state.messages[state.messages.length - 1].content;

    const structured = await structuredTextLLM.invoke([
      new SystemMessage({ content: UNKNOWN_SYSTEM }),
      new HumanMessage({ content: userText })
    ]);

    return new Command({
      goto: END,
      update: {
        messages: [new AIMessage({ content: JSON.stringify(structured) })]
      }
    });
  } catch (error) {
    console.error('[Node: unknown_node] Error:', error);
    throw error;
  }
}

// 4. Node yêu cầu gặp nhân viên hỗ trợ trực tiếp (Human in the loop)
export async function humanNode(state) {
  try {
    const response = {
      type: 'human_intervention',
      message: 'Dạ mình đã ghi nhận yêu cầu cần gặp nhân viên hỗ trợ trực tiếp của bạn. Hệ thống đang chuyển tiếp hội thoại này đến các anh chị quản trị viên. Xin bạn vui lòng chờ trong giây lát ạ!'
    };

    return new Command({
      goto: END,
      update: {
        messages: [new AIMessage({ content: JSON.stringify(response) })]
      }
    });
  } catch (error) {
    console.error('[Node: human_node] Error:', error);
    throw error;
  }
}
