import express from 'express';
import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../../config/env_vars.js';
import { ChatbotService } from '../../chatbot/chatbotService.js';
import { chatbotLimiter, validateChatInput } from '../../middleware/rateLimiter.js';
import prisma from '../../config/database.js';

const router = express.Router();

// Helper: Extract and validate userId from JWT token
const extractUserId = async (req) => {
  let userId = '';

  // 1. Try extracting from Cookies (Web)
  if (req.cookies && req.cookies.accessToken) {
    try {
      const decoded = jwt.verify(req.cookies.accessToken, ENV_VARS.JWT_ACCESS_SECRET);
      userId = decoded.id;
    } catch (e) {
      console.log('[ChatbotRoute] Web token verification failed');
    }
  }

  // 2. Try extracting from Authorization Header (Mobile/Flutter)
  if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, ENV_VARS.JWT_ACCESS_SECRET);
      userId = decoded.id;
    } catch (e) {
      console.log('[ChatbotRoute] Mobile token verification failed');
    }
  }

  if (userId) {
    try {
      // Validate that the user exists in database to avoid foreign key violations
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      if (user) {
        return user.id;
      }
    } catch (e) {
      console.error('[ChatbotRoute] Database check for user failed:', e);
    }
  }

  return null; // null = guest user
};

// ============================================================
// 1. POST /thread/create - Create or get existing thread
// ============================================================
router.post('/thread/create', async (req, res) => {
  try {
    const userId = await extractUserId(req);
    const { threadIdLang } = req.body; // LangGraph thread_id from frontend

    if (!threadIdLang || threadIdLang.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'threadIdLang is required'
      });
    }

    // Check if thread already exists
    let chatThread = await prisma.chatThread.findUnique({
      where: { threadIdLang: threadIdLang }
    });

    // Create new thread if doesn't exist
    if (!chatThread) {
      chatThread = await prisma.chatThread.create({
        data: {
          userId: userId, // Can be null for guests
          threadIdLang: threadIdLang
        }
      });
    }

    return res.json({
      success: true,
      threadId: chatThread.id,
      threadIdLang: chatThread.threadIdLang
    });
  } catch (error) {
    console.error('[ChatbotRoute] Thread creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating chat thread',
      error: error.message
    });
  }
});

// ============================================================
// 2. POST /chat - Send message (existing endpoint, now with DB persistence)
// ============================================================
router.post('/chat', chatbotLimiter, validateChatInput, async (req, res) => {
  try {
    const { question, thread_id, threadId } = req.body;
    const userId = await extractUserId(req);

    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'question is required and cannot be empty'
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi quá dài. Vui lòng nhập dưới 500 ký tự để trợ lý hỗ trợ tốt nhất nhé!'
      });
    }

    // Support both thread_id (old) and threadId (new)
    const langThreadId = thread_id || threadId;
    if (!langThreadId || langThreadId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'thread_id is required and cannot be empty'
      });
    }

    // Get or create chat thread
    let chatThread = await prisma.chatThread.findUnique({
      where: { threadIdLang: langThreadId }
    });

    if (!chatThread) {
      chatThread = await prisma.chatThread.create({
        data: {
          userId: userId,
          threadIdLang: langThreadId
        }
      });
    }

    // Save user message to database
    await prisma.chatMessage.create({
      data: {
        threadId: chatThread.id,
        userId: userId,
        sender: 'user',
        text: question
      }
    });

    // Process chat through LangGraph
    const response = await ChatbotService.handleChatInput({
      question,
      threadId: langThreadId,
      userId
    });

    if (!response.success) {
      return res.status(500).json(response);
    }

    // Save bot response to database
    await prisma.chatMessage.create({
      data: {
        threadId: chatThread.id,
        sender: 'bot',
        text: response.answer?.message || '',
        metadata: {
          movies: response.answer?.movies || [],
          showtimes: response.answer?.showtimes || [],
          bookings: response.answer?.bookings || [],
          bookingFlow: response.answer?.type === 'booking_flow' ? response.answer : null
        }
      }
    });

    return res.json(response);

  } catch (error) {
    console.error('[ChatbotRoute] Chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ trong quá trình xử lý chatbot.',
      error: error.message
    });
  }
});

// ============================================================
// 3. GET /history/{threadIdLang} - Load all chat messages
// ============================================================
router.get('/history/:threadIdLang', async (req, res) => {
  try {
    const { threadIdLang } = req.params;
    const userId = await extractUserId(req);

    // Find chat thread by LangGraph thread ID
    const chatThread = await prisma.chatThread.findUnique({
      where: { threadIdLang: threadIdLang },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chatThread) {
      return res.status(404).json({
        success: false,
        message: 'Chat thread not found'
      });
    }

    // Security: Only user who created the thread can view it (or guests can view their own)
    if (chatThread.userId && chatThread.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this chat thread'
      });
    }

    // Format messages for frontend
    const messages = chatThread.messages.map(msg => ({
      id: msg.id,
      sender: msg.sender,
      text: msg.text,
      movies: msg.metadata?.movies || [],
      showtimes: msg.metadata?.showtimes || [],
      bookings: msg.metadata?.bookings || [],
      bookingFlow: msg.metadata?.bookingFlow || null,
      paymentQr: msg.metadata?.paymentQr || null,
      createdAt: msg.createdAt
    }));

    return res.json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('[ChatbotRoute] History error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
});

// ============================================================
// 4. POST /history/{threadIdLang}/payment-qr - Persist chatbot QR message
// ============================================================
router.post('/history/:threadIdLang/payment-qr', async (req, res) => {
  try {
    const { threadIdLang } = req.params;
    const { message, paymentQr } = req.body;
    const userId = await extractUserId(req);

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }

    if (!paymentQr || typeof paymentQr !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'paymentQr is required'
      });
    }

    const chatThread = await prisma.chatThread.findUnique({
      where: { threadIdLang }
    });

    if (!chatThread) {
      return res.status(404).json({
        success: false,
        message: 'Chat thread not found'
      });
    }

    if (chatThread.userId && chatThread.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this chat thread'
      });
    }

    const savedMessage = await prisma.chatMessage.create({
      data: {
        threadId: chatThread.id,
        sender: 'bot',
        text: message,
        metadata: {
          paymentQr
        }
      }
    });

    return res.json({
      success: true,
      message: {
        id: savedMessage.id,
        sender: savedMessage.sender,
        text: savedMessage.text,
        paymentQr: savedMessage.metadata?.paymentQr || null,
        createdAt: savedMessage.createdAt
      }
    });
  } catch (error) {
    console.error('[ChatbotRoute] Persist payment QR error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving payment QR message',
      error: error.message
    });
  }
});

// ============================================================
// 5. DELETE /history/{threadIdLang} - Clear all chat messages
// ============================================================
router.delete('/history/:threadIdLang', async (req, res) => {
  try {
    const { threadIdLang } = req.params;
    const userId = await extractUserId(req);

    // Find chat thread
    const chatThread = await prisma.chatThread.findUnique({
      where: { threadIdLang: threadIdLang }
    });

    if (!chatThread) {
      return res.status(404).json({
        success: false,
        message: 'Chat thread not found'
      });
    }

    // Security: Only user who created the thread can delete it
    if (chatThread.userId && chatThread.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this chat thread'
      });
    }

    // Delete all messages in this thread
    await prisma.chatMessage.deleteMany({
      where: { threadId: chatThread.id }
    });

    // Delete the thread itself (optional - you can keep empty threads)
    // await prisma.chatThread.delete({
    //   where: { id: chatThread.id }
    // });

    return res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });

  } catch (error) {
    console.error('[ChatbotRoute] Clear history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error clearing chat history',
      error: error.message
    });
  }
});

export default router;
