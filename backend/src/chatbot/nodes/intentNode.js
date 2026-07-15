import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { Command } from '@langchain/langgraph';
import { llm } from '../config/openai.js';
import prisma from '../../config/database.js';
import { IntentResultSchema } from '../schema/zodSchemas.js';
import { buildConversationContext } from '../utils/contextMemory.js';

const intentLLM = llm.withStructuredOutput(IntentResultSchema);

const INTENT_SYSTEM = `
Bạn là Trợ lý phân loại ý định (Intent Classifier) cho ứng dụng đặt vé xem phim trực tuyến RoPhim.
Nhiệm vụ của bạn là phân tích câu hỏi của khách hàng và phân loại chính xác ý định (intent) của họ vào 1 trong các nhóm sau:

1. movies: Người dùng hỏi xem có những bộ phim nào đang chiếu, sắp chiếu, phim hay, phim kịch tính, hoặc nhờ gợi ý phim nói chung.
   - Ví dụ: "Rạp mình đang chiếu phim gì?", "Có phim hành động nào hay không?", "Gợi ý cho tôi vài bộ phim sắp ra mắt."
   
2. movie_detail: Người dùng hỏi chi tiết (nội dung, đạo diễn, thời lượng, thể loại, lịch chiếu) của một bộ phim cụ thể và ĐÃ CUNG CẤP tên phim.
   - Ví dụ: "Phim Mai chiếu mấy giờ?", "Xem thông tin phim Nhà bà Nữ", "Mắt Biếc thể loại gì?", "còn phim nhà bà nữ thì sao"
   
3. movie_detail_missing_field: Người dùng muốn hỏi chi tiết hoặc lịch chiếu của một bộ phim nhưng hoàn toàn KHÔNG CÓ tên phim nào được nhắc đến.
   - Ví dụ: "Phim đó chiếu mấy giờ?", "Cho tôi xem lịch chiếu của phim này", "Bộ phim này thời lượng bao lâu?"

4. book_movie: Người dùng thể hiện rõ nhu cầu đặt vé/đặt phim/mua vé và ĐÃ nêu tên phim cụ thể.
   - Ví dụ: "Tôi muốn đặt phim Mai", "Đặt vé phim Nhà Bà Nữ", "Mua vé xem phim Mắt Biếc tối nay"

5. book_movie_missing_field: Người dùng muốn đặt vé nhưng CHƯA nói rõ tên phim, hoặc chỉ mới nói muốn đặt phim nói chung.
   - Ví dụ: "Tôi muốn đặt phim", "Đặt vé giúp tôi", "Muốn mua vé xem phim"

6. showtimes: Người dùng hỏi về lịch chiếu của các phim nói chung hoặc tại một rạp cụ thể, một ngày cụ thể (không giới hạn ở 1 phim riêng lẻ).
   - Ví dụ: "Lịch chiếu ngày mai thế nào?", "Rạp Hùng Vương hôm nay có suất chiếu nào?", "Xem lịch chiếu phim."

7. vouchers: Người dùng hỏi về các khuyến mãi, mã giảm giá, voucher hiện có của hệ thống.
   - Ví dụ: "Có khuyến mãi gì không?", "Cửa hàng có mã giảm giá nào không?", "Xem các voucher đang hoạt động."

8. bookings: Người dùng muốn kiểm tra lịch sử đặt vé, trạng thái vé đã mua hoặc thông tin đặt vé của cá nhân họ.
   - Ví dụ: "Tôi đã đặt những vé nào?", "Cho xem vé đã mua của tôi", "Vé của tôi có trạng thái gì rồi?"

9. app_question: Người dùng hỏi các thông tin chung về quy chế rạp, cách đặt vé, hoàn trả vé, thông tin bắp nước, giá vé chung, liên hệ rạp.
   - Ví dụ: "Làm thế nào để đặt vé?", "Tôi có thể hủy vé và hoàn tiền không?", "Giá vé bắp nước là bao nhiêu?", "Rạp mở cửa mấy giờ?"

10. human_intervention: Người dùng yêu cầu được gặp nhân viên hỗ trợ trực tiếp, tổng đài viên hoặc phàn nàn nặng nề cần có người xử lý.
   - Ví dụ: "Tôi muốn gặp nhân viên hỗ trợ", "Kết nối với tổng đài viên", "Yêu cầu hỗ trợ trực tiếp."

11. unknown: Câu hỏi hoàn toàn không liên quan đến rạp phim, đặt vé hoặc nội dung hỗ trợ.
   - Ví dụ: "Thời tiết hôm nay thế nào?", "1+1 bằng mấy?", "Kể cho tôi nghe chuyện ma."
`;

export async function intentRouterNode(state) {
  try {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1].content;

    console.log(`[Node: intent_router] Analyzing message: "${lastMessage.substring(0, 60)}"`);
    const conversationContext = buildConversationContext(state);

    // Lấy danh sách phim đang hoạt động động từ DB để làm bộ đối chiếu chính xác cho LLM
    const activeMovies = await prisma.movie.findMany({
      where: { isActive: true },
      select: { title: true }
    });
    const movieTitlesStr = activeMovies.map(m => `"${m.title}"`).join(', ');

    const dynamicIntentPrompt = `${INTENT_SYSTEM}

NGỮ CẢNH HỘI THOẠI ĐÃ NÉN:
${conversationContext}

⚠️ SUY LUẬN THAM CHIẾU THEO NGỮ CẢNH:
- Nếu câu mới dùng các cách nói như "phim này", "phim đó", "đặt phim này", "đặt luôn", "vé đó", hãy ưu tiên dùng ngữ cảnh hội thoại đã nén để hiểu người dùng đang nói tới phim hoặc booking nào.
- Nếu ngữ cảnh gần nhất đã xác định được một phim cụ thể và người dùng nói "Tôi muốn đặt phim này", hãy phân loại là "book_movie" thay vì "book_movie_missing_field".
- Nếu ngữ cảnh gần nhất đã xác định được một phim cụ thể và người dùng hỏi lịch/chi tiết bằng cách nói "phim này", hãy phân loại là "movie_detail" hoặc "showtimes" tùy ý định của câu mới.

⚠️ DANH SÁCH BỘ PHIM ĐANG CÓ TRÊN HỆ THỐNG:
[ ${movieTitlesStr} ]
- Nếu trong câu hỏi có nhắc tới bất kỳ phim nào trong danh sách trên (viết thường, viết không dấu, hoặc so khớp tương đối như "nhà bà nữ", "mai", "mắt biếc", "skyfall", "tấm cám", "thỏ ơi", "đảo độc đắc"...) -> Bạn PHẢI tuyệt đối phân loại ý định là "movie_detail" (vì tên phim đã được nhắc tới trực tiếp).`;

    const result = await intentLLM.invoke([
      new SystemMessage({ content: dynamicIntentPrompt }),
      new HumanMessage({ content: lastMessage })
    ]);

    console.log(`[Node: intent_router] Classified Intent: "${result.intent}"`);

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

    const goto = routeMap[result.intent] || 'unknown_node';

    return new Command({
      goto,
      update: {
        intent: result.intent,
        tool_call_count: 0
      }
    });
  } catch (error) {
    console.error('[Node: intent_router] Error:', error);
    throw error;
  }
}
