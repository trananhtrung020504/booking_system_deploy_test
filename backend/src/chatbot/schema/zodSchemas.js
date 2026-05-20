import { z } from 'zod';

// 1. Phân loại ý định (Intent Classifier)
export const IntentResultSchema = z.object({
  intent: z.enum([
    'movies',
    'movie_detail',
    'movie_detail_missing_field',
    'showtimes',
    'vouchers',
    'bookings',
    'app_question',
    'human_intervention',
    'unknown'
  ]).describe('Phân loại chính xác ý định của người dùng')
});

// 2. Phản hồi dạng văn bản thông dụng (FAQ, Missing SKU/Name, Unknown, Human)
export const TextResponseSchema = z.object({
  type: z.enum([
    'movie_detail_missing_field',
    'app_question',
    'human_intervention',
    'unknown',
    'error'
  ]),
  message: z.string().describe('Nội dung phản hồi chi tiết, lịch sự, thân thiện bằng tiếng Việt')
});

// 3. Phản hồi danh sách phim (Movies List)
export const MovieItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  genre: z.array(z.string()),
  duration: z.number(),
  rating: z.number().nullable(),
  certification: z.string(),
  poster: z.string().nullable(),
  isActive: z.boolean(),
  description: z.string().optional()
});

export const MovieListResponseSchema = z.object({
  type: z.enum(['movies', 'movies_query', 'movies_suggestion', 'movie_detail']),
  message: z.string().describe('Lời chào hoặc dẫn dắt thân thiện từ AI trợ lý'),
  movies: z.array(MovieItemSchema)
});

// 4. Phản hồi danh sách lịch chiếu (Showtimes List)
export const ShowtimeItemSchema = z.object({
  id: z.string(),
  movieTitle: z.string(),
  theaterName: z.string(),
  screenName: z.string(),
  startTime: z.string(),
  format: z.string(),
  price: z.string().describe('Giá vé hiển thị (ví dụ: "95,000đ - 125,000đ")')
});

export const ShowtimeResponseSchema = z.object({
  type: z.literal('showtimes'),
  message: z.string().describe('Thông điệp dẫn dắt lịch chiếu cho người dùng'),
  showtimes: z.array(ShowtimeItemSchema)
});

// 5. Phản hồi danh sách vé đặt (Bookings List)
export const BookingItemSchema = z.object({
  id: z.string(),
  bookingRef: z.string(),
  movieTitle: z.string(),
  theaterName: z.string(),
  startTime: z.string(),
  seats: z.array(z.string()),
  status: z.string().describe('Trạng thái vé đặt (CONFIRMED, PENDING, CANCELLED)'),
  total: z.number()
});

export const BookingListResponseSchema = z.object({
  type: z.literal('bookings'),
  message: z.string().describe('Thông báo hoặc tóm tắt danh sách vé đặt của người dùng'),
  bookings: z.array(BookingItemSchema)
});
