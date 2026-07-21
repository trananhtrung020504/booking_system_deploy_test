'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Star,
  Calendar,
  Ticket,
  ChevronRight,
  Loader2
} from 'lucide-react';
import ChatbotBookingModal from './ChatbotBookingModal';
import { getSocket, connectSocket } from '@/lib/socket';
import { useAppDispatch } from '@/store/hooks';
import { bookingAPI } from '@/store/api/bookingAPI';
import { toast } from 'sonner';

interface Movie {
  id: string;
  title: string;
  genre: string[];
  duration: number;
  rating: number | null;
  certification: string;
  poster: string | null;
  isActive: boolean;
}

interface Showtime {
  id: string;
  movieTitle: string;
  theaterName: string;
  screenName: string;
  startTime: string;
  format: string;
  price: string;
}

interface Booking {
  id: string;
  bookingRef: string;
  movieTitle: string;
  theaterName: string;
  startTime: string;
  seats: string[];
  status: string;
  total: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  movie?: any;
  movies?: Movie[];
  showtimes?: Showtime[];
  bookings?: Booking[];
  isInterrupted?: boolean;
  paymentData?: any;
}

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1/web').replace(/\/$/, '');
const API_BASE_URL = `${API_ROOT}/chatbot`;
const SLOW_RESPONSE_DELAY_MS = 3000;
const SLOW_RESPONSE_NOTICE = 'Hệ thống đang xử lý yêu cầu của bạn, vui lòng đợi trong giây lát.';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSlowResponseNotice, setShowSlowResponseNotice] = useState(false);
  const [threadIdLang, setThreadIdLang] = useState(''); // LangGraph thread_id
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const paymentPollsRef = useRef<Record<string, number>>({});
  const router = useRouter();

  // 1. Initialize thread and load chat history from backend
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoadingHistory(true);

        // Generate or get LangGraph thread_id
        let langThreadId = sessionStorage.getItem('rophim_chat_thread_id_lang');
        if (!langThreadId) {
          langThreadId = 'thread_' + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('rophim_chat_thread_id_lang', langThreadId);
        }
        setThreadIdLang(langThreadId);

        // Create/get thread on backend
        const threadResponse = await fetch(`${API_BASE_URL}/thread/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadIdLang: langThreadId }),
          credentials: 'include'
        });

        const threadData = await threadResponse.json();
        if (!threadData.success) {
          throw new Error(threadData.message);
        }

        // Load chat history from backend
        const historyResponse = await fetch(`${API_BASE_URL}/history/${langThreadId}`, {
          credentials: 'include'
        });

        const historyData = await historyResponse.json();

        if (historyData.success && historyData.messages.length > 0) {
          // Convert backend messages to ChatMessage format
          const loadedMessages: ChatMessage[] = historyData.messages.map((msg: any) => ({
            id: msg.id,
            sender: msg.sender,
            text: msg.text,
            movie: msg.movie,
            movies: msg.movies,
            showtimes: msg.showtimes,
            bookings: msg.bookings,
            paymentData: msg.paymentData
          }));
          setMessages(loadedMessages);
        } else {
          loadDefaultGreeting();
        }
      } catch (error) {
        console.error('[Chatbot] Error initializing:', error);
        loadDefaultGreeting();
      } finally {
        setIsLoadingHistory(false);
      }
    };

    initializeChat();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showSlowResponseNotice]);

  useEffect(() => {
    if (!loading) {
      setShowSlowResponseNotice(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowResponseNotice(true);
    }, SLOW_RESPONSE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [loading]);

  const dispatch = useAppDispatch();

  const appendPaymentSuccessMessage = useCallback((data: { bookingId?: string; bookingRef: string; source?: 'socket' | 'polling' }) => {
    console.info(`[Chatbot] Payment confirmed by ${data.source || 'unknown'}`, {
      bookingId: data.bookingId,
      bookingRef: data.bookingRef
    });

    setMessages(prev => {
      const alreadyNotified = prev.some(m => m.text.includes(data.bookingRef));
      if (alreadyNotified) return prev;

      toast.success(`Thanh toán thành công! Vé ${data.bookingRef} đã được xác nhận.`);

      return [...prev, {
        id: 'msg_' + Date.now() + '_success',
        sender: 'bot',
        text: `🎉 Tuyệt vời! Giao dịch cho mã vé **${data.bookingRef}** đã thành công. Bạn có thể kiểm tra vé ở mục "Vé của tôi". Cảm ơn bạn đã đặt vé!`,
      }];
    });

    if (data.bookingId && paymentPollsRef.current[data.bookingId]) {
      window.clearInterval(paymentPollsRef.current[data.bookingId]);
      delete paymentPollsRef.current[data.bookingId];
    }

    setIsOpen(true);
    router.refresh();
    dispatch(bookingAPI.util.invalidateTags(['Booking']));
  }, [dispatch, router]);

  const startPaymentStatusPolling = useCallback((bookingId?: string, bookingRef?: string) => {
    if (!bookingId || paymentPollsRef.current[bookingId]) return;

    let attempts = 0;
    paymentPollsRef.current[bookingId] = window.setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`${API_ROOT}/bookings/${bookingId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const booking = await response.json();
          if (booking.status === 'CONFIRMED') {
            appendPaymentSuccessMessage({
              bookingId,
              bookingRef: booking.bookingRef || bookingRef || bookingId,
              source: 'polling'
            });
            return;
          }

          if (['CANCELLED', 'EXPIRED'].includes(booking.status)) {
            window.clearInterval(paymentPollsRef.current[bookingId]);
            delete paymentPollsRef.current[bookingId];
            return;
          }
        }
      } catch (error) {
        console.error('[Chatbot] Payment status polling error:', error);
      }

      if (attempts >= 120) {
        window.clearInterval(paymentPollsRef.current[bookingId]);
        delete paymentPollsRef.current[bookingId];
      }
    }, 3000);
  }, [appendPaymentSuccessMessage]);

  useEffect(() => {
    return () => {
      Object.values(paymentPollsRef.current).forEach((timerId) => window.clearInterval(timerId));
      paymentPollsRef.current = {};
    };
  }, []);

  // Realtime Socket listener for payment success
  useEffect(() => {
    const socket = connectSocket();

    const handleBookingUpdate = (data: any) => {
      if (data.status === 'CONFIRMED' && data.bookingRef) {
        appendPaymentSuccessMessage({ ...data, source: 'socket' });
      }
    };

    socket.on('booking:updated', handleBookingUpdate);

    return () => {
      socket.off('booking:updated', handleBookingUpdate);
    };
  }, [appendPaymentSuccessMessage]);

  const loadDefaultGreeting = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Chào bạn! Mình là Trợ Lý Ảo thông minh của rạp RoPhim. 🎬 Mình có thể giúp gì cho bạn hôm nay?\n\nBạn có thể hỏi mình các câu hỏi như:\n- Hôm nay rạp có những phim nào?\n- Lịch chiếu phim Mai ra sao?\n- Có chương trình khuyến mãi nào không?\n- Xem vé tôi đã đặt\n- Tôi muốn đặt vé phim (Thay thế phim bạn muốn đặt vào)\n- Xem chi tiết phim bạn muốn (Tôi muốn xem chi tiết phim...).'
      }
    ]);
  };

  // 2. Send message to backend
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsgId = 'msg_' + Date.now();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          thread_id: threadIdLang
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.answer) {
        const botMsgId = 'msg_' + Date.now() + '_bot';
        const botAnswer = data.answer;

        const newBotMessage: ChatMessage = {
          id: botMsgId,
          sender: 'bot',
          text: botAnswer.message || 'Mình đã nhận được thông tin.',
          movie: botAnswer.movie,
          movies: botAnswer.movies,
          showtimes: botAnswer.showtimes,
          bookings: botAnswer.bookings,
          isInterrupted: data.debug?.is_interrupted
        };

        const finalMessages = [...updatedMessages, newBotMessage];
        setMessages(finalMessages);

        // Tự động mở modal đặt vé khi có thông tin phim trả về
        if (botAnswer.movie) {
          setCurrentFlow({ movie: botAnswer.movie });
          setBookingModalOpen(true);
        }
        // ✅ Backend automatically persists messages via /chat endpoint
      } else {
        throw new Error(data.message || 'Lỗi xử lý phản hồi từ chatbot.');
      }
    } catch (error: any) {
      const botMsgId = 'msg_' + Date.now() + '_error';
      const errorMsg: ChatMessage = {
        id: botMsgId,
        sender: 'bot',
        text: 'Rất tiếc, mình gặp gián đoạn kết nối một chút. Bạn vui lòng thử lại nhé!'
      };
      setMessages(prev => [...prev, errorMsg]);
      console.error('[Chatbot] Send message error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Clear chat history from backend
  const handleClearHistory = async () => {
    try {
      const deleteResponse = await fetch(`${API_BASE_URL}/history/${threadIdLang}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const deleteData = await deleteResponse.json();

      if (deleteData.success) {
        // Generate new thread for fresh start
        const newThreadId = 'thread_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('rophim_chat_thread_id_lang', newThreadId);
        setThreadIdLang(newThreadId);

        // Create new thread on backend
        await fetch(`${API_BASE_URL}/thread/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadIdLang: newThreadId }),
          credentials: 'include'
        });

        // Reset UI with fresh greeting
        setMessages([
          {
            id: 'welcome',
            sender: 'bot',
            text: 'Lịch sử chat cũ đã được xóa sạch thành công! Mình đã sẵn sàng cho cuộc trò chuyện mới cùng bạn rồi đây. ✨'
          }
        ]);
      } else {
        throw new Error(deleteData.message);
      }
    } catch (error) {
      console.error('[Chatbot] Clear history error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_' + Date.now() + '_error',
          sender: 'bot',
          text: 'Không thể xóa lịch sử chat. Vui lòng thử lại!'
        }
      ]);
    }
  };

  const formatMessageText = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      let content = isListItem ? line.trim().substring(2) : line;

      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts: any[] = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      if (isListItem) {
        return (
          <li key={i} className="list-disc ml-4 my-0.5 text-white/90">
            {parts}
          </li>
        );
      }

      return (
        <p key={i} className="min-h-[1.2em]">
          {parts}
        </p>
      );
    });
  };

  if (isLoadingHistory) {
    return null; // Don't render chatbot until history is loaded
  }

  return (
    <>
      <style>{`
        /* Custom Scrollbar for Chat Window */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px !important;
          height: 5px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12) !important;
          border-radius: 999px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25) !important;
        }

        /* Hide scrollbars for sliders */
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* 🟢 NÚT BẤM FLOATING CHATBOT (GÓC DƯỚI PHẢI) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group shadow-primary/20"
      >
        <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-rose-500 opacity-30 blur-md group-hover:opacity-75 transition duration-300 animate-pulse"></span>
        {isOpen ? (
          <X className="w-6 h-6 relative z-10 transition-transform duration-300 rotate-90" />
        ) : (
          <MessageSquare className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
        )}
      </button>

      {/* 🟢 CỬA SỔ CHAT GRAPH GLASSMORPHISM */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[92vw] sm:w-[400px] h-[550px] max-h-[80vh] rounded-2xl border border-white/10 bg-black/85 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-6">

          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-rose-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                  ROPHIM AI <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
                </h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Trực tuyến - Sẵn sàng hỗ trợ
                </span>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              title="Làm mới lịch sử chat"
              className="text-white/40 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-white/5 hover:bg-white/5 transition-all"
            >
              Clear
            </button>
          </div>

          {/* Khung chứa các tin nhắn */}
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-4 custom-scrollbar">
            {messages.map((msg) => {
              // 🛡️ BẢO VỆ ĐA TẦNG: Tự động giải mã JSON nếu tin nhắn là chuỗi JSON thô
              let displayContent = msg.text;
              let msgMovies = msg.movies;
              let msgShowtimes = msg.showtimes;
              let msgBookings = msg.bookings;

              if (typeof msg.text === 'string') {
                const trimmed = msg.text.trim();

                // Trường hợp tin nhắn là JSON thuần
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                  try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.message) displayContent = parsed.message;
                    if (parsed.movies) msgMovies = parsed.movies;
                    if (parsed.showtimes) msgShowtimes = parsed.showtimes;
                    if (parsed.bookings) msgBookings = parsed.bookings;
                  } catch (e) { }
                }

                // Trường hợp tin nhắn là JSON bọc trong nhãn markdown ```json
                if (trimmed.includes('```json')) {
                  try {
                    const cleanJSON = trimmed
                      .replace(/```json/g, '')
                      .replace(/```/g, '')
                      .trim();
                    const parsed = JSON.parse(cleanJSON);
                    if (parsed.message) displayContent = parsed.message;
                    if (parsed.movies) msgMovies = parsed.movies;
                    if (parsed.showtimes) msgShowtimes = parsed.showtimes;
                    if (parsed.bookings) msgBookings = parsed.bookings;
                  } catch (e) { }
                }
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Bong bóng tin nhắn */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-md ${msg.sender === 'user'
                      ? 'bg-gradient-to-tr from-primary to-rose-500 text-white rounded-tr-none'
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
                      }`}
                  >
                    {formatMessageText(displayContent)}
                  </div>

                  {/* 🎬 1. RENDER CAROUSEL DANH SÁCH PHIM */}
                  {msgMovies && msgMovies.length > 0 && (
                    <div className="w-full mt-3 overflow-x-auto flex gap-3 pb-2 no-scrollbar">
                      {msgMovies.map((movie) => (
                        <div
                          key={movie.id}
                          className="flex-shrink-0 w-36 rounded-xl bg-white/5 border border-white/10 p-2 text-center flex flex-col justify-between hover:bg-white/10 transition-all duration-300"
                        >
                          {movie.poster ? (
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-32 object-cover rounded-lg shadow-md"
                            />
                          ) : (
                            <div className="w-full h-32 bg-white/5 rounded-lg flex items-center justify-center text-[10px] text-white/40">No Poster</div>
                          )}
                          <h4 className="text-white text-xs font-semibold mt-2 line-clamp-1">{movie.title}</h4>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-[10px] text-white/60">{movie.rating || 'N/A'}</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              router.push(`/movies`);
                            }}
                            className="mt-2 w-full py-1 text-[10px] rounded-lg bg-primary/20 hover:bg-primary border border-primary/30 text-white transition-all font-semibold"
                          >
                            Mua Vé
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 📅 2. RENDER CHI TIẾT LỊCH CHIẾU */}
                  {msgShowtimes && msgShowtimes.length > 0 && (
                    <div className="w-full mt-3 space-y-2">
                      {msgShowtimes.map((show) => {
                        const startTimeDate = new Date(show.startTime);
                        const timeStr = startTimeDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const dateStr = startTimeDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                        return (
                          <div
                            key={show.id}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="space-y-0.5">
                              <h4 className="text-white text-xs font-semibold">{show.movieTitle}</h4>
                              <p className="text-[10px] text-white/50">{show.theaterName} • {show.screenName}</p>
                              <p className="text-[10px] text-primary font-medium">{show.price}</p>
                            </div>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                router.push(`/booking/${show.id}`);
                              }}
                              className="flex flex-col items-center justify-center px-3 py-1 bg-gradient-to-tr from-primary to-rose-500 hover:opacity-90 rounded-lg text-white font-semibold shadow-lg shadow-primary/20 transition-all"
                            >
                              <span className="text-xs">{timeStr}</span>
                              <span className="text-[8px] text-white/80">{dateStr}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 🎟️ 3. RENDER MỞ BẢNG ĐẶT VÉ (MODAL) */}
                  {msg.movie && msg.showtimes && msg.showtimes.length > 0 && (
                    <div className="w-full mt-3">
                      <button
                        onClick={() => {
                          setCurrentFlow({ movie: msg.movie });
                          setBookingModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-primary to-rose-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Ticket className="w-4 h-4" />
                        Mở Bảng Đặt Vé
                      </button>
                    </div>
                  )}

                  {/* 💳 4. RENDER PAYMENT DATA (NẾU CÓ) */}
                  {msg.paymentData && (
                    <div className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center shadow-lg">
                      <img src={msg.paymentData.qrImageUrl} alt="Payment QR" className="w-40 h-40 rounded-xl mb-3 shadow-md border border-white/10" />
                      <p className="text-white font-bold text-sm text-center uppercase tracking-wider">{msg.paymentData.movieTitle}</p>
                      <p className="text-white/60 text-[10px] mt-1 font-mono uppercase tracking-widest">Mã vé: {msg.paymentData.bookingRef}</p>
                      <p className="text-primary font-bold mt-1 text-lg">{msg.paymentData.amount.toLocaleString('vi-VN')}đ</p>
                      <button
                        onClick={() => window.open(msg.paymentData.qrImageUrl, '_blank')}
                        className="mt-3 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-[10px] uppercase tracking-widest transition-all"
                      >
                        Mở Cổng Thanh Toán
                      </button>
                    </div>
                  )}

                  {/* 🎟️ 5. RENDER VÉ ĐÃ ĐẶT (BOOKINGS) */}
                  {msgBookings && msgBookings.length > 0 && (
                    <div className="w-full mt-3 space-y-3">
                      {msgBookings.map((booking) => {
                        const bookingDate = new Date(booking.startTime);
                        const isConfirmed = booking.status === 'CONFIRMED';

                        return (
                          <div
                            key={booking.id}
                            className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-lg"
                          >
                            {/* Top part */}
                            <div className="p-3 bg-white/[0.02] border-b border-dashed border-white/10 flex items-start justify-between">
                              <div>
                                <span className="text-[9px] font-mono text-white/40">REF: {booking.bookingRef}</span>
                                <h4 className="text-white text-xs font-bold line-clamp-1 mt-0.5">{booking.movieTitle}</h4>
                                <p className="text-[9px] text-white/50 mt-0.5">{booking.theaterName}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isConfirmed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                {booking.status}
                              </span>
                            </div>
                            {/* Bottom part */}
                            <div className="p-3 flex items-center justify-between text-[10px]">
                              <div className="space-y-1">
                                <p className="text-white/60 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-primary" />
                                  {bookingDate.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                                <p className="text-white/60 flex items-center gap-1">
                                  <Ticket className="w-3 h-3 text-rose-400" />
                                  Ghế: {booking.seats.join(', ')}
                                </p>
                              </div>
                              <span className="text-white font-bold text-xs">{booking.total.toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}

            {/* Bong bóng báo AI đang gõ chữ */}
            {loading && (
              <div className="flex flex-col items-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                {showSlowResponseNotice && (
                  <div className="mt-2 max-w-[85%] rounded-2xl border border-cinema-gold/20 bg-cinema-gold/10 px-4 py-2.5 text-xs leading-5 text-cinema-gold/90 shadow-md" aria-live="polite">
                    {SLOW_RESPONSE_NOTICE}
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Pills */}
          <div className="flex gap-2 py-2 overflow-x-auto px-4 border-t border-white/5 bg-black/20 no-scrollbar flex-shrink-0">
            <button
              onClick={() => handleSendMessage('🎬 Phim đang chiếu')}
              className="flex-shrink-0 text-[10px] text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 hover:text-white transition-all font-medium"
            >
              🎬 Phim đang chiếu
            </button>
            <button
              onClick={() => handleSendMessage('📅 Hôm nay có lịch chiếu nào không?')}
              className="flex-shrink-0 text-[10px] text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 hover:text-white transition-all font-medium"
            >
              📅 Lịch chiếu hôm nay
            </button>
            <button
              onClick={() => handleSendMessage('🎟️ Xem vé tôi đã đặt')}
              className="flex-shrink-0 text-[10px] text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 hover:text-white transition-all font-medium"
            >
              🎟️ Vé của tôi
            </button>
            <button
              onClick={() => handleSendMessage('🎁 Có khuyến mãi gì không?')}
              className="flex-shrink-0 text-[10px] text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 hover:text-white transition-all font-medium"
            >
              🎁 Khuyến mãi
            </button>
          </div>

          {/* Ô nhập thông tin chát */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                loading
                  ? 'Trợ lý đang phản hồi...'
                  : messages[messages.length - 1]?.isInterrupted
                    ? 'Nhập thông tin bổ sung...'
                    : 'Hỏi lịch chiếu, vé đặt, khuyến mãi...'
              }
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/50 placeholder:text-white/30 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-gradient-to-tr from-primary to-rose-500 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:scale-100 rounded-xl p-2.5 text-white shadow-md shadow-primary/20 transition-all flex items-center justify-center flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

        </div>
      )}

      <ChatbotBookingModal
        open={bookingModalOpen}
        flow={currentFlow}
        onClose={() => setBookingModalOpen(false)}
        onPaymentReady={(payload) => {
          const botMsgId = 'msg_' + Date.now() + '_bot';
          const newBotMessage: ChatMessage = {
            id: botMsgId,
            sender: 'bot',
            text: payload.message,
            paymentData: payload
          };
          setMessages(prev => [...prev, newBotMessage]);
          startPaymentStatusPolling(payload.bookingId, payload.bookingRef);
          setBookingModalOpen(false);
          // Show chat window if it was closed
          setIsOpen(true);
        }}
      />
    </>
  );
}
