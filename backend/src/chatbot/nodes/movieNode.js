import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { Command, interrupt, END } from '@langchain/langgraph';
import { z } from 'zod';
import { llm } from '../config/openai.js';
import prisma from '../../config/database.js';
import { TextResponseSchema, IntentResultSchema } from '../schema/zodSchemas.js';
import { buildConversationContext } from '../utils/contextMemory.js';

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

export async function movieNode(state) {
  try {
    const userText = state.messages[state.messages.length - 1].content;
    const conversationContext = buildConversationContext(state);
    console.log(`[Node: movie_node] Extracting search parameters for: "${userText}"`);

    const params = await movieParamsLLM.invoke([
      new SystemMessage({ content: `Bạn là trợ lý trích xuất bộ lọc phim. Hãy phân tích câu hỏi và điền các thuộc tính lọc phù hợp.

Ngữ cảnh hội thoại:
${conversationContext}

Nếu người dùng dùng cách nói tham chiếu như "phim này", "phim đó", hãy dùng ngữ cảnh để suy ra phim hoặc nhu cầu gần nhất.` }),
      new HumanMessage({ content: userText })
    ]);

    console.log(`[Node: movie_node] Extracted Params:`, params);

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

export async function movieDetailNode(state) {
  try {
    const userText = state.messages[state.messages.length - 1].content;
    const conversationContext = buildConversationContext(state);
    console.log(`[Node: movie_detail_node] Extracting movie title for detail lookup: "${userText}"`);

    const activeMovies = await prisma.movie.findMany({
      where: { isActive: true },
      select: { title: true }
    });
    const movieTitlesStr = activeMovies.map(m => `"${m.title}"`).join(', ');

    const detailSystemPrompt = `Bạn là trợ lý rút trích chính xác tên bộ phim được nhắc tới trong câu hỏi của người dùng.

NGỮ CẢNH HỘI THOẠI:
${conversationContext}
    
⚠️ DANH SÁCH CÁC BỘ PHIM TRÊN HỆ THỐNG:
[ ${movieTitlesStr} ]
Nhiệm vụ của bạn:
- Hãy tìm xem người dùng nhắc tới tên phim nào (hoặc viết gần giống/không dấu) khớp với một phim trong danh sách trên.
- Trả về chính xác tên đầy đủ của bộ phim đó từ danh sách trên (ví dụ: nếu họ ghi "nhà bà nữ" -> trả về "Nhà Bà Nữ").`;

    const params = await detailParamLLM.invoke([
      new SystemMessage({ content: detailSystemPrompt }),
      new HumanMessage({ content: userText })
    ]);

    console.log(`[Node: movie_detail_node] Looked up title: "${params.movieTitle}"`);

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

export async function movieMissingNameNode(state) {
  try {
    const conversationContext = buildConversationContext(state);
    const askResponse = {
      type: 'movie_detail_missing_field',
      message: 'Bạn muốn tìm hiểu thông tin hay lịch chiếu của bộ phim nào ạ? Hãy cho mình biết tên phim nhé! (Ví dụ: phim Mai, Mắt Biếc, Skyfall...)'
    };

    const userInput = interrupt(JSON.stringify(askResponse));
    console.log(`[Node: movie_missing_name] Graph resumed with input: "${userInput}"`);

    const extractPrompt = `
    Bạn là trợ lý lọc thông tin. Hãy kiểm tra xem câu trả lời của người dùng có chứa tên phim nào không.
    Ngữ cảnh hội thoại:
    ${conversationContext}

    Trả về định dạng JSON của TextResponse. 
    - Nếu có chứa tên phim (ví dụ: "phim Mai", "tôi muốn xem Mai", "Mai nhé", "Skyfall"): trả về type="movie_detail_missing_field" và message là đúng tên phim đó (ví dụ: "Mai", "Skyfall").
    - Nếu người dùng dùng cách nói tham chiếu như "phim này", "bộ đó", hãy suy ra theo ngữ cảnh hội thoại nếu ngữ cảnh đã có phim cụ thể.
    - Nếu người dùng chuyển chủ đề hoặc không đưa ra tên phim: trả về type="unknown" và message là câu trả lời của họ.
    `;

    const extractResult = await structuredTextLLM.invoke([
      new SystemMessage({ content: extractPrompt }),
      new HumanMessage({ content: userInput })
    ]);

    if (extractResult.type === 'movie_detail_missing_field' && extractResult.message.trim().length > 0) {
      console.log(`[Node: movie_missing_name] Extracted Movie Name: "${extractResult.message}"`);
      return new Command({
        goto: 'movie_detail_node',
        update: {
          messages: [new HumanMessage({ content: `Cho tôi xem chi tiết phim ${extractResult.message}` })],
          intent: 'movie_detail',
          tool_call_count: 0
        }
      });
    }

    const INTENT_SYSTEM_SHORT = `
    Phân loại câu hỏi của người dùng vào 1 trong các ý định: 
    'movies', 'movie_detail', 'movie_detail_missing_field', 'book_movie', 'book_movie_missing_field', 'showtimes', 'vouchers', 'bookings', 'app_question', 'human_intervention', 'unknown'.
    Nếu người dùng nói "phim này", "đặt phim này", "bộ đó", hãy suy ra theo ngữ cảnh hội thoại.
    `;
    const newIntent = await intentLLM.invoke([
      new SystemMessage({ content: `${INTENT_SYSTEM_SHORT}\nNgữ cảnh hội thoại:\n${conversationContext}` }),
      new HumanMessage({ content: userInput })
    ]);

    console.log(`[Node: movie_missing_name] Re-classified Intent: "${newIntent.intent}"`);

    const routeMap = {
      movies: 'movie_node',
      movie_detail: 'movie_detail_node',
      movie_detail_missing_field: 'movie_missing_name_node',
      book_movie: 'booking_node',
      book_movie_missing_field: 'booking_node',
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
