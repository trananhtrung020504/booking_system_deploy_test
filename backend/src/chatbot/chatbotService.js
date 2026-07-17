import { HumanMessage } from '@langchain/core/messages';
import { Command } from '@langchain/langgraph';
import { compiledChatGraph } from './graph/chatbotGraph.js';
import { compactConversationState } from './utils/contextMemory.js';

export const ChatbotService = {
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
      const currentState = await compiledChatGraph.getState(config);
      const currentValues = currentState.values || {};
      const interruptedNodes = currentState.next || [];
      const isInterrupted = interruptedNodes.length > 0;
      const compactedContext = await compactConversationState({
        messages: currentValues.messages || [],
        existingSummary: currentValues.conversationSummary || '',
        existingRecentContext: currentValues.recentContext || ''
      });

      let result;

      if (isInterrupted) {
        console.log(`[ChatbotService] Resuming graph from interrupted node: "${interruptedNodes[0]}"`);
        
        result = await compiledChatGraph.invoke(
          new Command({
            resume: question,
            update: {
              userId,
              conversationSummary: compactedContext.conversationSummary,
              recentContext: compactedContext.recentContext
            }
          }),
          config
        );
      } else {
        console.log('[ChatbotService] Invoking fresh graph run');
        
        result = await compiledChatGraph.invoke(
          {
            messages: [new HumanMessage({ content: question })],
            userId,
            intent: '',
            tool_call_count: 0,
            conversationSummary: compactedContext.conversationSummary,
            recentContext: compactedContext.recentContext
          },
          config
        );
      }

      const newState = await compiledChatGraph.getState(config);
      const newInterruptedNodes = newState.next || [];
      const isNewInterrupted = newInterruptedNodes.length > 0;

      if (isNewInterrupted) {
        console.log(`[ChatbotService] Graph has been interrupted at node: "${newInterruptedNodes[0]}"`);

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
