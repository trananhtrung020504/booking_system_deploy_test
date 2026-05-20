import { HumanMessage } from '@langchain/core/messages';
import { Command } from '@langchain/langgraph';
import { compiledChatGraph } from './graph/chatbotGraph.js';

export const ChatbotService = {
  /**
   * Xử lý tin nhắn từ người dùng, điều khiển luồng đi của LangGraph.
   * @param {Object} params
   * @param {string} params.question - Câu hỏi của người dùng
   * @param {string} params.threadId - Định danh phiên hội thoại (Thread ID)
   * @param {string} [params.userId] - ID người dùng đã đăng nhập (nếu có)
   * @returns {Promise<Object>} Phản hồi chuẩn hóa cho Frontend
   */
  async handleChatInput({ question, threadId, userId = '' }) {
    if (!question || question.trim() === '') {
      return { success: false, message: 'Câu hỏi không được để trống.' };
    }
    if (!threadId || threadId.trim() === '') {
      return { success: false, message: 'Thread ID không được để trống.' };
    }

    const config = { configurable: { thread_id: threadId } };
    console.log(`[ChatbotService] Processing: threadId="${threadId}", userId="${userId}", question="${question}"`);

    try {
      // 1. Kiểm tra trạng thái hiện tại của Thread xem có bị tạm dừng (interrupt) không
      const currentState = await compiledChatGraph.getState(config);
      const interruptedNodes = currentState.next || [];
      const isInterrupted = interruptedNodes.length > 0;

      let result;

      // 2. Chạy hoặc Resume Graph
      if (isInterrupted) {
        console.log(`[ChatbotService] Resuming graph from interrupted node: "${interruptedNodes[0]}"`);
        
        // Resume graph bằng Command resume truyền dữ liệu người dùng bổ sung vào
        result = await compiledChatGraph.invoke(
          new Command({
            resume: question
          }),
          config
        );
      } else {
        console.log('[ChatbotService] Invoking fresh graph run');
        
        // Chạy graph mới từ đầu
        result = await compiledChatGraph.invoke(
          {
            messages: [new HumanMessage({ content: question })],
            userId,
            intent: '',
            tool_call_count: 0
          },
          config
        );
      }

      // 3. Kiểm tra xem Graph sau khi chạy có sinh ra một interrupt mới không
      const newState = await compiledChatGraph.getState(config);
      const newInterruptedNodes = newState.next || [];
      const isNewInterrupted = newInterruptedNodes.length > 0;

      if (isNewInterrupted) {
        console.log(`[ChatbotService] Graph has been interrupted at node: "${newInterruptedNodes[0]}"`);

        // Lấy giá trị truyền vào trong hàm interrupt()
        let interruptValue = null;
        if (newState.tasks && newState.tasks.length > 0) {
          for (const t of newState.tasks) {
            if (t.interrupts && t.interrupts.length > 0) {
              interruptValue = t.interrupts[0].value;
              break;
            }
          }
        }

        let parsedAnswer;
        if (interruptValue) {
          try {
            parsedAnswer = JSON.parse(interruptValue);
          } catch (e) {
            parsedAnswer = { type: 'error', message: interruptValue };
          }
        } else {
          parsedAnswer = { type: 'error', message: 'Yêu cầu thêm thông tin từ hệ thống.' };
        }

        return {
          success: true,
          answer: parsedAnswer,
          thread_id: threadId,
          debug: {
            intent: newState.values.intent,
            is_interrupted: true,
            interrupted_node: newInterruptedNodes[0]
          }
        };
      }

      // 4. Graph đã chạy xong bình thường -> lấy tin nhắn AIMessage cuối cùng
      const messages = result.messages || newState.values.messages || [];
      if (messages.length === 0) {
        throw new Error('Graph execution returned no messages.');
      }

      const lastAIMessage = messages[messages.length - 1];
      const rawContent = lastAIMessage.content;

      let parsedAnswer;
      try {
        parsedAnswer = JSON.parse(rawContent);
      } catch (e) {
        // Trường hợp khẩn cấp nếu AI trả về chuỗi text thuần túy
        parsedAnswer = {
          type: result.intent || 'unknown',
          message: rawContent
        };
      }

      return {
        success: true,
        answer: parsedAnswer,
        thread_id: threadId,
        debug: {
          intent: result.intent || newState.values.intent,
          is_interrupted: false
        }
      };

    } catch (error) {
      console.error('[ChatbotService] Error executing graph:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra trong quá trình xử lý hội thoại với trợ lý ảo.',
        error: error.message
      };
    }
  }
};
