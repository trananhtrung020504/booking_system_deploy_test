import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { Command, interrupt, END } from '@langchain/langgraph';
import { z } from 'zod';
import { llm } from '../config/openai.js';
import prisma from '../../config/database.js';
import { TextResponseSchema, IntentResultSchema } from '../schema/zodSchemas.js';

// ── SCHEMAS TRÍCH XUẤT THAM SỐ (TỐI ƯU HÓA TOKEN) ──────────────────────────
const MovieParamsSchema = z.object({
  keyword: z.string().describe('Từ khóa tên phim người dùng nhắc tới. Trả về chuỗi rỗng "" nếu không nhắc tới.'),
  genre: z.string().describe('Thể loại phim (Hành động, Tình cảm, Hoạt hình, Kinh dị...). Trả về chuỗi rỗng "" nếu không nhắc tới.'),
  status: z.enum(['now-showing', 'coming-soon', 'none']).describe('Trạng thái chiếu phim hoặc "none" nếu không đề cập')
});

const MovieDetailParamSchema = z.object({
  movieTitle: z.string().describe('Tên bộ phim người dùng muốn xem chi tiết (ví dụ: Mai, Mắt Biếc, Skyfall)')
});

const movieParamsLLM = llm.withStructuredOutput(MovieParamsSchema);
const detailParamLLM = llm.withStructuredOutput(MovieDetailParamSchema);
const structuredTextLLM = llm.withStructuredOutput(TextResponseSchema);
const intentLLM = llm.withStructuredOutput(IntentResultSchema);

// 1. Node truy vấn danh sách phim (Code-Formatted)
export async function movieNode(state) {
  try {
    const userText = state.messages[state.messages.length - 1].content;
    console.log(`[Node: movie_node] Extracting search parameters for: "${userText}"`);

    // Bước 1: LLM chỉ trích xuất tham số tìm kiếm (Cực ít token)
    const params = await movieParamsLLM.invoke([
      new SystemMessage({ content: "Bạn là trợ lý trích xuất bộ lọc phim. Hãy phân tích câu hỏi và điền các thuộc tính lọc phù hợp." }),
      new HumanMessage({ content: userText })
    ]);

    console.log(`[Node: movie_node] Extracted Params:`, params);

    // Bước 2: Tự code truy vấn Database qua Prisma (Chính xác 100%, 0 hao token)
    const where = { isActive: true };
    
    if (params.keyword && params.keyword.trim() !== '') {
      where.title = {
        contains: params.keyword,
        mode: 'insensitive'
      };
    }
    
    if (params.genre && params.genre.trim() !== '') {
      where.genre = {
        has: params.genre
      };
    }
    
    if (params.status && params.status !== 'none') {
      const now = new Date();
      if (params.status === 'now-showing') {
        where.releaseDate = {
          lte: now
        };
      } else {
        where.releaseDate = {
          gt: now
        };
      }
    }

    const movies = await prisma.movie.findMany({
      where,
      take: 6,
      include: {
        poster: true
      },
      orderBy: {
        releaseDate: 'desc'
      }
    });

    // Bước 3: Tự code format JSON đầu ra (100% chuẩn, không bị nhét block markdown)
    const response = {
      type: 'movies',
      message: movies.length > 0 
        ? 'Dạ RoPhim xin gửi đến bạn danh sách các bộ phim đang có trên hệ thống theo yêu cầu ạ:' 
        : 'Rất tiếc, rạp hiện tại chưa tìm thấy bộ phim nào phù hợp với yêu cầu lọc của bạn. Hãy thử từ khóa khác nhé!',
      movies: movies.map(m => ({
        id: m.id,
        title: m.title,
        genre: m.genre,
        duration: m.duration,
        rating: m.rating,
        certification: m.certification,
        poster: m.poster?.source || null,
        isActive: m.isActive
      }))
    };

    return new Command({
      goto: END,
      update: {
        messages: [new AIMessage({ content: JSON.stringify(response) })]
      }
    });

  } catch (error) {
    console.error('[Node: movie_node] Error:', error);
    throw error;
  }
}

// 2. Node truy vấn chi tiết phim và suất chiếu (Code-Formatted)
export async function movieDetailNode(state) {
  try {
    const userText = state.messages[state.messages.length - 1].content;
    console.log(`[Node: movie_detail_node] Extracting movie title for detail lookup: "${userText}"`);

    // Lấy danh sách phim đang hoạt động động từ DB để làm bộ đối chiếu chính xác cho LLM
    const activeMovies = await prisma.movie.findMany({
      where: { isActive: true },
      select: { title: true }
    });
    const movieTitlesStr = activeMovies.map(m => `"${m.title}"`).join(', ');

    const detailSystemPrompt = `Bạn là trợ lý rút trích chính xác tên bộ phim được nhắc tới trong câu hỏi của người dùng.
    
⚠️ DANH SÁCH CÁC BỘ PHIM TRÊN HỆ THỐNG:
[ ${movieTitlesStr} ]
Nhiệm vụ của bạn:
- Hãy tìm xem người dùng nhắc tới tên phim nào (hoặc viết gần giống/không dấu) khớp với một phim trong danh sách trên.
- Trả về chính xác tên đầy đủ của bộ phim đó từ danh sách trên (ví dụ: nếu họ ghi "nhà bà nữ" -> trả về "Nhà Bà Nữ").`;

    // Bước 1: LLM trích xuất tên phim
    const params = await detailParamLLM.invoke([
      new SystemMessage({ content: detailSystemPrompt }),
      new HumanMessage({ content: userText })
    ]);

    console.log(`[Node: movie_detail_node] Looked up title: "${params.movieTitle}"`);

    // Bước 2: Tự code tìm kiếm tương đối trong Database
    const movie = await prisma.movie.findFirst({
      where: {
        title: {
          contains: params.movieTitle,
          mode: 'insensitive'
        },
        isActive: true
      },
      include: {
        poster: true,
        shows: {
          where: {
            startTime: {
              gt: new Date()
            },
            isActive: true
          },
          include: {
            theater: true,
            screen: true
          },
          take: 5,
          orderBy: {
            startTime: 'asc'
          }
        }
      }
    });

    if (!movie) {
      const errorResponse = {
        type: 'error',
        message: `Dạ RoPhim chưa tìm thấy thông tin của bộ phim nào tên là "${params.movieTitle}". Bạn vui lòng kiểm tra lại tên phim chính xác giúp mình nhé!`
      };
      return new Command({
        goto: END,
        update: {
          messages: [new AIMessage({ content: JSON.stringify(errorResponse) })]
        }
      });
    }

    // Bước 3: Định dạng các suất chiếu sắp diễn ra
    const showtimes = movie.shows.map(s => {
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
        movieTitle: movie.title,
        theaterName: s.theater.name,
        screenName: s.screen.name,
        startTime: s.startTime.toISOString(),
        format: s.format,
        price: priceRange
      };
    });

    // Trả về type "showtimes" kèm mảng showtimes để frontend vẽ luôn Time Chips đặt vé cực xịn!
    const response = {
      type: 'showtimes',
      message: `🎬 **Thông tin phim ${movie.title}**:\n- *Thể loại:* ${movie.genre.join(', ')}\n- *Thời lượng:* ${movie.duration} phút\n- *Độ tuổi:* ${movie.certification}\n\nDưới đây là danh sách các suất chiếu sắp diễn ra. Bạn có thể bấm chọn suất chiếu để tiến hành đặt vé ngay nhé:`,
      showtimes
    };

    return new Command({
      goto: END,
      update: {
        messages: [new AIMessage({ content: JSON.stringify(response) })]
      }
    });

  } catch (error) {
    console.error('[Node: movie_detail_node] Error:', error);
    throw error;
  }
}

// 3. Node thiếu tên phim → interrupt chờ người dùng nhập bổ sung
export async function movieMissingNameNode(state) {
  try {
    const askResponse = {
      type: 'movie_detail_missing_field',
      message: 'Bạn muốn tìm hiểu thông tin hay lịch chiếu của bộ phim nào ạ? Hãy cho mình biết tên phim nhé! (Ví dụ: phim Mai, Mắt Biếc, Skyfall...)'
    };

    // Gọi interrupt() để tạm dừng graph và gửi yêu cầu cho client
    const userInput = interrupt(JSON.stringify(askResponse));
    console.log(`[Node: movie_missing_name] Graph resumed with input: "${userInput}"`);

    // Dùng LLM trích xuất tên phim từ câu trả lời mới
    const extractPrompt = `
    Bạn là trợ lý lọc thông tin. Hãy kiểm tra xem câu trả lời của người dùng có chứa tên phim nào không.
    Trả về định dạng JSON của TextResponse. 
    - Nếu có chứa tên phim (ví dụ: "phim Mai", "tôi muốn xem Mai", "Mai nhé", "Skyfall"): trả về type="movie_detail_missing_field" và message là đúng tên phim đó (ví dụ: "Mai", "Skyfall").
    - Nếu người dùng chuyển chủ đề hoặc không đưa ra tên phim: trả về type="unknown" và message là câu trả lời của họ.
    `;

    const extractResult = await structuredTextLLM.invoke([
      new SystemMessage({ content: extractPrompt }),
      new HumanMessage({ content: userInput })
    ]);

    if (extractResult.type === 'movie_detail_missing_field' && extractResult.message.trim().length > 0) {
      console.log(`[Node: movie_missing_name] Extracted Movie Name: "${extractResult.message}"`);
      // Đi thẳng tới movie_detail_node với câu hỏi chứa tên phim rõ ràng
      return new Command({
        goto: 'movie_detail_node',
        update: {
          messages: [new HumanMessage({ content: `Cho tôi xem chi tiết phim ${extractResult.message}` })],
          intent: 'movie_detail',
          tool_call_count: 0
        }
      });
    }

    // Nếu vẫn không cung cấp tên phim, tiến hành phân loại lại intent dựa trên nội dung mới
    const INTENT_SYSTEM_SHORT = `
    Phân loại câu hỏi của người dùng vào 1 trong các ý định: 
    'movies', 'movie_detail', 'movie_detail_missing_field', 'showtimes', 'vouchers', 'bookings', 'app_question', 'human_intervention', 'unknown'.
    `;
    const newIntent = await intentLLM.invoke([
      new SystemMessage({ content: INTENT_SYSTEM_SHORT }),
      new HumanMessage({ content: userInput })
    ]);

    console.log(`[Node: movie_missing_name] Re-classified Intent: "${newIntent.intent}"`);

    const routeMap = {
      movies: 'movie_node',
      movie_detail: 'movie_detail_node',
      movie_detail_missing_field: 'movie_missing_name_node',
      showtimes: 'showtime_node',
      vouchers: 'booking_node',
      bookings: 'booking_node',
      app_question: 'app_question_node',
      human_intervention: 'human_node',
      unknown: 'unknown_node'
    };

    const goto = routeMap[newIntent.intent] || 'unknown_node';

    return new Command({
      goto,
      update: {
        messages: [new HumanMessage({ content: userInput })],
        intent: newIntent.intent,
        tool_call_count: 0
      }
    });
  } catch (error) {
    console.error('[Node: movie_missing_name] Error:', error);
    throw error;
  }
}
