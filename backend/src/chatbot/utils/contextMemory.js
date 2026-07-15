import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { llm } from '../config/openai.js';

const SUMMARY_SCHEMA = z.object({
  conversationSummary: z.string().describe('Tóm tắt ngắn về các ý đã trao đổi, thực thể chính, phim đang được nhắc tới, và bước tiếp theo.'),
  recentContext: z.string().describe('Ngữ cảnh rất gần dùng cho suy luận tham chiếu như "phim này", "vé đó", "đặt luôn".')
});

const summaryLLM = llm.withStructuredOutput(SUMMARY_SCHEMA);

const MAX_RECENT_MESSAGES = 6;
const MAX_OLDER_MESSAGES_FOR_SUMMARY = 10;

const normalizeContent = (content) => {
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.message || trimmed;
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }

  return String(content || '').trim();
};

const formatMessages = (messages = []) => {
  return messages
    .map((message) => {
      const role = message?.constructor?.name?.includes('AI') ? 'Assistant' : 'User';
      return `${role}: ${normalizeContent(message?.content)}`;
    })
    .filter((line) => line.trim() !== '')
    .join('\n');
};

export async function compactConversationState({
  messages = [],
  existingSummary = '',
  existingRecentContext = ''
}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      conversationSummary: existingSummary || '',
      recentContext: existingRecentContext || ''
    };
  }

  const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);
  const olderMessages = messages.slice(0, -MAX_RECENT_MESSAGES);
  const recentContext = formatMessages(recentMessages);

  if (olderMessages.length === 0) {
    return {
      conversationSummary: existingSummary || '',
      recentContext
    };
  }

  const summaryWindow = olderMessages.slice(-MAX_OLDER_MESSAGES_FOR_SUMMARY);
  const summaryInput = formatMessages(summaryWindow);

  const result = await summaryLLM.invoke([
    new SystemMessage({
      content: `Bạn là bộ nhớ hội thoại cho chatbot đặt vé phim.
Hãy nén lịch sử hội thoại thành 2 trường:
- conversationSummary: ngắn, chính xác, ưu tiên phim đang được nhắc tới, nhu cầu hiện tại, showtime/rạp nếu đã có, và điều chatbot đang hướng dẫn người dùng làm tiếp.
- recentContext: 1 đoạn rất ngắn nêu rõ thực thể gần nhất để chatbot hiểu các câu tham chiếu như "phim này", "đặt luôn", "vé đó", "ghế đó".
Không bịa thêm thông tin không có trong hội thoại.`
    }),
    new HumanMessage({
      content: `Tóm tắt cũ:
${existingSummary || '(chưa có)'}

Ngữ cảnh rất gần cũ:
${existingRecentContext || '(chưa có)'}

Đoạn hội thoại cần nén thêm:
${summaryInput}`
    })
  ]);

  return {
    conversationSummary: result.conversationSummary?.trim() || existingSummary || '',
    recentContext: recentContext || result.recentContext?.trim() || existingRecentContext || ''
  };
}

export function buildConversationContext(state) {
  const parts = [];

  if (state?.conversationSummary?.trim()) {
    parts.push(`Tóm tắt hội thoại:\n${state.conversationSummary.trim()}`);
  }

  if (state?.recentContext?.trim()) {
    parts.push(`Ngữ cảnh rất gần:\n${state.recentContext.trim()}`);
  }

  return parts.length > 0 ? parts.join('\n\n') : 'Chưa có ngữ cảnh trước đó.';
}
