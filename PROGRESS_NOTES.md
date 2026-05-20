# 📋 BookingSystem - Progress Notes
> Cập nhật lần cuối: 2026-05-16 16:35 (Senior Refactor)

## 1. Hệ thống Quan hệ & Dữ liệu (Relational Architecture)
- **Cấu trúc Rạp - Phòng - Ghế**: Đã triển khai mô hình quan hệ chặt chẽ. Ghế được sinh tự động khi tạo Rạp/Phòng. Loại bỏ hoàn toàn lưu trữ JSON không an toàn.
- **Voucher System**: Hỗ trợ mã giảm giá theo % hoặc số tiền cố định. Kiểm tra điều kiện đơn hàng tối thiểu, hạn dùng và số lượt sử dụng.
- **Concession (Combo) System (Mới)**: Tích hợp hệ thống bán bắp nước đi kèm vé. Tự động tính toán tổng tiền và lưu trữ lịch sử đơn hàng bắp nước chi tiết.

## 2. Real-time & Socket.IO (Advanced Level)
- **Occupancy Tracking**: Hiển thị số lượng người đang xem suất chiếu trực tuyến.
- **Selection Sync**: Đồng bộ trạng thái ghế đang được chọn (trước khi giữ) giữa các người dùng.
- **Global Booking Ticker**: Phát thông báo toàn server khi có người đặt vé thành công, tăng hiệu ứng cộng đồng.
- **Seat Hold Sync**: Giữ ghế trong 7 phút với countdown thời gian thực.

## 3. UI/UX & Trải nghiệm người dùng (Premium Experience)
- **Immersive Backdrop**: Tự động lấy Poster phim làm hình nền mờ ảo (Blurred Backdrop), tạo không gian đắm chìm cho trang đặt vé.
- **Glassmorphism Design**: Sử dụng hiệu ứng kính mờ cho các thẻ tóm tắt và UI điều khiển, mang lại cảm giác cao cấp.
- **Micro-animations**: Các hiệu ứng hover, pulse-glow cho nút thanh toán và trạng thái chọn ghế thời gian thực.

## 4. Thanh toán & Xác nhận (Production Flow)
- **VNPay/ZaloPay Integration**: Luồng thanh toán thực tế với redirect và callback tự động cập nhật trạng thái đơn hàng.
- **Premium Email Confirmation**: Gửi mail xác nhận kèm Template HTML cao cấp và thông tin vé chi tiết (bao gồm cả danh sách bắp nước).

## 5. Tự động hóa & Hiệu năng
- **Background Cleanup Worker**: Tự động quét và hủy các Booking PENDING quá 15 phút, giải phóng ghế cho người khác mỗi phút một lần.
- **Redis Integration**: Lưu trữ trạng thái giữ ghế (Hold) với TTL để đảm bảo hiệu năng cao.

---

## 📖 PHẦN 1: CHI TIẾT TỪNG FILE ĐÃ ĐỌC & SỬA

### 🗄️ `prisma/schema.prisma` — Database Schema
**Nội dung gốc:** 7 models (User, UserAvatar, Movie, MoviePoster, Theater, TheaterLogo, Show, Booking, Transaction) + 4 enums.
**Vấn đề phát hiện:**
- User thiếu `name`, `phone`
- Movie.duration là String (nên Int để tính toán)
- Show.startTime và date là String (nên DateTime)
- Thiếu SeatHold model cho real-time giữ ghế
- Booking.status default CONFIRMED (nên PENDING)
- Thiếu indexes

**✅ Đã sửa thành (KIẾN TRÚC RELATIONAL CHUẨN):**
- Thêm `name`, `phone` vào User + relation `seatHolds`
- `Movie.duration` → `Int` (phút), thêm `trailerUrl`
- Show: `startTime: DateTime` + `endTime: DateTime`, thêm `isActive`
- **MỚI**: Thêm model `Screen` (Phòng chiếu) và `Seat` (Ghế thực thể).
- Mối quan hệ: `Theater` -> `Screen` -> `Seat`.
- Booking: Giờ đây kết nối trực tiếp với mảng `Seat` qua bảng trung gian.
- `SeatHold`: Chuyển sang dùng `seatId` (UUID) đồng bộ với DB.
- Thêm indexes: Movie(isActive, releaseDate), Theater(city), Show(movieId, theaterId, startTime), SeatHold(showId, expiresAt), Booking(userId, showId, status), Transaction(userId, status)

---

### ⚙️ `src/server.js` — Entry Point
**Nội dung gốc:** Express app + HTTP server + Socket.IO + RabbitMQ + Elasticsearch bootstrap. CORS `origin: "*"`.
**Vấn đề:** `origin: "*"` + `credentials: true` → browser block cookies.

**✅ Đã sửa:**
- CORS dùng callback function với `allowedOrigins` array (`localhost:3000`, `3001`, `127.0.0.1:3000`)
- Socket.IO CORS cũng dùng callback tương tự
- Dev mode cho phép tất cả origin

---

### 🔧 `src/config/env_vars.js` — Biến Môi Trường
**Nội dung:** Export object `ENV_VARS` từ `process.env`: DATABASE_URL, JWT secrets, ZaloPay/VNPay keys, Redis, Cloudflare R2, RabbitMQ, Elasticsearch.
**Trạng thái:** ✅ Không cần sửa

### 🔧 `src/config/database.js` — Prisma Client
**Nội dung:** Tạo PrismaClient với PG adapter (pg Pool). Global singleton pattern cho dev mode.
**Trạng thái:** ✅ Không cần sửa

### 🔧 `src/config/redis.js` — Redis Connection
**Nội dung:** ioredis kết nối `REDIS_HOST:REDIS_PORT` (6380), retry strategy, log connect/error.
**Trạng thái:** ✅ Không cần sửa

### 🔧 `src/config/elasticsearch.js` — ES Client
**Nội dung:** `@elastic/elasticsearch` Client kết nối `ELASTICSEARCH_NODE` (port 9201), maxRetries=5, timeout=30s.
**Trạng thái:** ✅ Không cần sửa

### 🔧 `src/config/cloudflareR2.js` — File Storage
**Nội dung:** S3Client kết nối Cloudflare R2. Hàm `uploadToR2(key, body, contentType)` với retry 3 lần + exponential backoff. Hàm `deleteFromR2(key)`.
**Trạng thái:** ✅ Không cần sửa

### 🔧 `src/config/rabbitmq.js` — RabbitMQ Config
**Nội dung:** Export `rabbitmqConfig` object: url (port 5673), heartbeat=30, timeout=10000.
**Trạng thái:** ✅ Không cần sửa

---

### 🔌 `src/socket/socket.js` — Socket.IO Real-Time
**Nội dung gốc:** Chỉ có auth (JWT verify) + join user room + disconnect tracking. Không có seat-hold logic.

**✅ Đã viết lại hoàn toàn:**
- `SEAT_HOLD_TTL = 7 * 60` (7 phút)
- `getHeldSeats(showId)` — Lấy ghế đang giữ từ Redis hash `seathold:{showId}`
- `getBookedSeats(showId)` — Lấy ghế đã đặt từ DB (status CONFIRMED/PENDING)
- `broadcastSeatUpdate(io, showId)` — Gửi trạng thái ghế cho tất cả user trong phòng
- Events:
  - `show:join` → Join room `show:{showId}`, nhận seats-update ngay
  - `show:leave` → Leave room
  - `seats:hold` → Kiểm tra conflicts (đã book / đã giữ bởi người khác), giữ ghế trong Redis + DB, broadcast, schedule auto-release sau TTL
  - `seats:release` → Xóa ghế khỏi Redis + DB, broadcast
  - `disconnect` → Không release ghế (giữ cho user refresh page)
- Auto-expiry: setTimeout release ghế sau SEAT_HOLD_TTL, gửi `seats:expired` event cho user

---

### 🎬 `src/controllers/mobile/movieController.js` — Mobile Movie
**Nội dung:** `createMovie` (với upload poster middleware), `getMovies` (include poster), `getMovie` (include poster).
**Trạng thái:** ✅ Không cần sửa (mobile dùng riêng)

### 📋 `src/controllers/mobile/showController.js` — Mobile Show
**Nội dung:** `getShows` (include movie + theater), `getShow`, `getShowsByMovie`.
**Trạng thái:** ✅ Không cần sửa

### 🎫 `src/controllers/mobile/bookingController.js` — Mobile Booking
**Nội dung:** `createBooking` (transaction check seats → create booking), `getUserBookings` (include show→movie+theater).
**Trạng thái:** ✅ Không cần sửa

### 💳 `src/controllers/mobile/paymentController.js` — Mobile Payment
**Nội dung:**
- `createVNPayPayment` → Tạo transaction DB + build VNPay URL + QR code
- `vnpayReturn` → Verify return URL, cập nhật transaction PAID/FAILED, emit socket `payment:success`
- `createZaloPay` → Tạo transaction + gọi ZaloPay API + QR code
- `zaloPayCallback` → Verify MAC, cập nhật transaction, emit socket
**Trạng thái:** ✅ Không cần sửa

### 🔑 `src/controllers/mobile/authController.js` — Mobile Auth
**Nội dung:** `sendOtp` (generate + hash + email), `verifyOtp` (verify + create/find user + return tokens trong body), `refreshToken` (từ body), `logout`.
**Trạng thái:** ✅ Không cần sửa

---

### 🔑 `src/controllers/web/authController.js` — Web Auth
**Nội dung gốc:** Giống mobile nhưng tokens trong cookies thay vì body. Thiếu `getMe`.

**✅ Đã sửa:**
- Thêm `getMe` endpoint → lấy user từ DB, filter password/refreshToken
- `verifyOtp` → thêm filter sensitive fields trong response
- `refreshToken` → error message trả `"TokenExpiredError"` để frontend detect và auto-refresh

---

### 🎬 `src/controllers/web/movieController.js` — Web Movie
**Nội dung gốc:** `getMovies` (KHÔNG include poster), `getMovie` (KHÔNG include poster). Không pagination.

**✅ Đã viết lại hoàn toàn:**
- `getMovies` → Pagination (page, limit), filter by genre, search by title (insensitive), sort (rating/title/releaseDate), include poster, trả `{ movies, pagination }`
- `getMovie` → Include poster + active future shows (include theater+logo), sort shows by startTime
- `getGenres` → Trả danh sách unique genres từ tất cả phim active

---

### 🎬 `src/controllers/web/showController.js` — Web Show ⭐ MỚI
**Tạo mới hoàn toàn:**
- `getShows` → Filter by movieId, theaterId, date. Include movie+poster, theater+logo. Default only future shows
- `getShow` → Chi tiết show + heldSeats (từ Redis) + bookedSeats (từ DB)
- `getShowsByMovie` → Shows grouped by theater (cho trang chi tiết phim)
- `getAvailableDates` → Trả danh sách ngày có suất chiếu cho 1 phim

---

### 🎫 `src/controllers/web/bookingController.js` — Web Booking
**Nội dung gốc:** `createBooking` (đơn giản, không check seat hold), `getUserBookings`.

**✅ Đã viết lại hoàn toàn:**
- `createBooking` → Verify seat hold từ Redis trước, tính giá từ show.priceMap + seatLayout, double-check DB, status PENDING
- `confirmBooking` ⭐ MỚI → Sau thanh toán: update CONFIRMED, release seat holds, broadcast socket
- `getUserBookings` → Thêm pagination, include movie poster + theater logo
- `getBookingDetail` ⭐ MỚI → Chi tiết booking + transaction
- `cancelBooking` ⭐ MỚI → Hủy booking + release seats + broadcast socket

---

### 💳 `src/controllers/web/paymentController.js` — Web Payment
**Nội dung:** Reuse toàn bộ từ mobile (VNPay + ZaloPay logic giống nhau).
**Trạng thái:** ✅ Không cần sửa

---

### 🛡️ `src/middleware/web/auth.js` — Web Auth Middleware
**Nội dung:** Lấy `accessToken` từ `req.cookies`, verify JWT, set `req.user`.
**Trạng thái:** ✅ Không cần sửa

### 🛡️ `src/middleware/mobile/auth.js` — Mobile Auth Middleware
**Nội dung:** Lấy token từ `Authorization: Bearer ...` header, verify JWT, set `req.user`.
**Trạng thái:** ✅ Không cần sửa

### 📎 `src/middleware/handle_multer.js` — Multer Config
**Nội dung:** Memory + disk storage, file filter (image + video mimes), max 50MB/100MB, error handler.
**Trạng thái:** ✅ Không cần sửa

### 📎 `src/middleware/upload.js` — Upload to R2
**Nội dung:** Generic `uploadToR2Middleware`, `processAndUpload` (sharp → webp → R2). Pre-configured: `uploadMoviePosterToR2`, `uploadTheaterLogoToR2`, `uploadUserAvatarToR2`.
**Trạng thái:** ✅ Không cần sửa

---

### 🔗 `src/routes/index.js` — Route Entry
**Nội dung:** Mount `/api/v1/mobile` và `/api/v1/web`.
**Trạng thái:** ✅ Không cần sửa

### 🔗 `src/routes/webRoutes/index.js` — Web Routes Mount
**Nội dung:** Mount auth, movies, shows (public), bookings + payment (protected via verifyToken).
**Trạng thái:** ✅ Không cần sửa

### 🔗 `src/routes/webRoutes/authRoutes.js` — Web Auth Routes
**✅ Đã sửa:** Thêm `GET /me` (protected)

### 🔗 `src/routes/webRoutes/movieRoutes.js` — Web Movie Routes
**✅ Đã sửa:** Thêm `GET /genres`

### 🔗 `src/routes/webRoutes/showRoutes.js` — Web Show Routes
**✅ Đã sửa:** Đổi sang dùng web showController, thêm `GET /movie/:movieId/dates`

### 🔗 `src/routes/webRoutes/bookingRoutes.js` — Web Booking Routes
**✅ Đã sửa:** Thêm `POST /confirm`, `GET /:id`, `PATCH /:id/cancel`

### 🔗 `src/routes/webRoutes/paymentRoutes.js` — Web Payment Routes
**Nội dung:** VNPay create/return + ZaloPay create/callback.
**Trạng thái:** ✅ Không cần sửa

---

### 🔧 `src/utils/token.js` — JWT Utilities
**Nội dung:** `generateTokens(payload)` → access (1h) + refresh (7d). `verifyAccessToken`, `verifyRefreshToken`, `storeRefreshToken`, `findRefreshToken`, `deleteRefreshToken` (tất cả dùng Prisma).
**Trạng thái:** ✅ Không cần sửa

### 🔧 `src/utils/otp.js` — OTP Utilities
**Nội dung:** `generateOTP()` → 4 chữ số random. `hashOTP(data)` → HMAC SHA256. `verifyOTP`. `sendOTPtoEmail(email, otp)` → Nodemailer Gmail.
**Trạng thái:** ✅ Không cần sửa

### 🔧 `src/utils/imageProcessor.js` — Image Processing
**Nội dung:** `processImage(buffer, options)` → sharp resize + webp. `processMedia(buffer, options)` → detect type + process.
**Trạng thái:** ✅ Không cần sửa

### 🔧 `src/utils/index.js` — General Utils
**Nội dung:** `isValidEmail(email)`, `generateBookingReference()`.
**Trạng thái:** ✅ Không cần sửa

---

### 🐰 `src/rabbitmq/` — Message Queue
**Nội dung:**
- `connection/manager.js` → Singleton RabbitMQ connection, auto-reconnect
- `channel/channelManager.js` → `createConsumerChannel(prefetch)`, `createPublisherChannel()`
- `topology/definitions.js` → Exchange `booking_events` (topic), Queues: `booking_confirmation_email`, `booking_sync_elasticsearch`
- `topology/setup.js` → Assert exchanges + queues + bindings
- `publisher/publish.js` → `publishJson({ exchange, routingKey, payload })`
- `consumer/subscribe.js` → `subscribeJson({ queue, handler })`
- `consumer/index.js` → `initAllConsumers()` (placeholder, chưa implement consumers)
**Trạng thái:** ✅ Không cần sửa (sẵn sàng dùng)

---

### 🔍 `src/services/elasticsearchService.js` — Search
**Nội dung:** Index `movies` (title, genre, poster, rating) + `users` (email). `createIndices()`, `syncMoviesToES()`, `searchMovies(keyword, {limit, offset})` với fuzzy + prefix + wildcard. `initElasticsearch()` gọi khi server start.
**Trạng thái:** ✅ Không cần sửa

---

### 🌱 `src/scripts/seed.js` — Seed Data
**Nội dung gốc:** 4 phim, 2 rạp, 4 suất chiếu. KHÔNG có users, bookings, transactions.

**✅ Đã viết lại hoàn toàn:**
- 3 users: `user1@test.com`, `user2@test.com`, `admin@bookmyscreen.com` (pass: 123456)
- 6 phim: Lật Mặt 7, Hành Tinh Khỉ, Doraemon, Garfield, Furiosa, Inside Out 2
- 3 rạp: CGV Vincom, Lotte Cantavil, Galaxy Nguyễn Du
- 12 suất chiếu (future dates + 1 past date)
- 3 transactions (2 VNPAY + 1 ZALOPAY, tất cả PAID)
- 5 bookings (4 CONFIRMED + 1 CANCELLED)
- Seat layout: 10 rows (A-J), 12 cols, VIP rows E-G, Sweetbox row J

---

### 📁 `.env` — Environment Variables
**Nội dung:** PORT=5000, DB port 5433, JWT secrets, ZaloPay/VNPay sandbox keys, Redis port 6380, Cloudflare R2, RabbitMQ port 5673, ES port 9201.
**Trạng thái:** ✅ Không cần sửa

### 📁 `package.json` — Dependencies
**Nội dung:** Express 5, Prisma 7, Socket.IO 4, ioredis, bcryptjs, jsonwebtoken, multer, sharp, vnpay, axios, crypto-js, qrcode, moment, nodemailer, amqplib, @aws-sdk/client-s3, @elastic/elasticsearch. ESM (`"type": "module"`).
**Trạng thái:** ✅ Không cần sửa

---

## 🔍 PHẦN 2: THAM KHẢO TỪ DỰ ÁN KHÁC

### `social/store/index.ts` — Redux Store Config
```
configureStore({ reducer: { sliceName: slice.reducer, [api.reducerPath]: api.reducer }, middleware: concat all api.middleware })
export type RootState, AppDispatch
```

### `social/store/hooks.ts` — Typed Hooks
```
export const useAppDispatch = useDispatch (typed)
export const useAppSelector = useSelector (typed)
```

### `social/store/api/authAPI.ts` — RTK Query Pattern
```
createApi({ reducerPath, baseQuery: baseQueryWithRefresh, endpoints: builder => ({ login: builder.mutation<Response, Params>({ query }) }) })
```

### `jungvy_ecommerce/lib/api/baseQueryWithRefresh.ts` — Token Refresh
```
Gọi baseQuery → nếu 401 + "TokenExpiredError" → refreshToken() → retry baseQuery
Nếu refresh fail → trả error "Phiên đăng nhập hết hạn"
```
**Khác biệt cho web:** Token trong cookie (httpOnly), không cần gửi header Authorization

---

## ✅ PHẦN 3: TIẾN ĐỘ CÔNG VIỆC

### Backend
| # | Công việc | Trạng thái |
|---|---|---|
| 1 | Schema overhaul (SeatHold, indexes, DateTime, etc.) | ✅ Done |
| 2 | Seed script (3 users, 6 movies, 3 theaters, 12 shows, 5 bookings, 3 txns) | ✅ Done |
| 3 | Socket.js real-time seat holding | ✅ Done |
| 4 | Web authController (getMe, filter fields) | ✅ Done |
| 5 | Web movieController (pagination, filter, genres) | ✅ Done |
| 6 | Web showController (MỚI - grouped by theater, dates, seat status) | ✅ Done |
| 7 | Web bookingController (seat-hold verify, confirm, cancel, detail) | ✅ Done |
| 8 | Web routes cập nhật (auth/me, genres, show dates, booking confirm/cancel) | ✅ Done |
| 9 | Server.js CORS fix | ✅ Done |
| 14 | Relational Seat Architecture (Theater-Screen-Seat) | ✅ Done |
| 15 | Automated Seat Generation on Theater Creation | ✅ Done |
| 16 | Production Payment Flow (VNPAY/ZaloPay Redirect + Callback) | ✅ Done |
| 17 | Auto-confirm link with Transaction success | ✅ Done |
| 18 | Background Worker: Auto-cancel Expired Bookings | ⏳ In Progress |
| 11 | Seed data | ✅ Done |
| 12 | ES reset script (`resetES.js` — xóa + tạo lại indexes + sync) | ✅ Done |
| 13 | Package.json scripts (db:reset, db:seed, db:fresh, db:studio, es:reset) | ✅ Done |

### Frontend (Next.js 16 + TailwindCSS 4 + shadcn v5 + RTK Query)
| # | Công việc | Trạng thái |
|---|---|---|
| 1 | Khởi tạo Next.js project (`frontend/web`) | ✅ Done |
| 2 | Cài dependencies (RTK, shadcn, socket.io-client, date-fns, lucide) | ✅ Done |
| 3 | Types (`types/index.ts` - tất cả model + API response/params) | ✅ Done |
| 4 | baseQuery cookie-based (`lib/baseQuery.ts` - auto refresh token) | ✅ Done |
| 5 | Socket client (`lib/socket.ts` - singleton, connect/disconnect) | ✅ Done |
| 6 | Redux Store (`store/index.ts` - 4 APIs + 2 slices) | ✅ Done |
| 7 | RTK Query APIs (auth, movie, show, booking) | ✅ Done |
| 8 | Slices (auth, bookingFlow) | ✅ Done |
| 9 | Providers (StoreProvider, AuthInitializer) | ✅ Done |
| 10 | Root Layout (Inter font, dark theme, Navbar, Toaster) | ✅ Done |
| 11 | Navbar (responsive, auth dropdown, mobile menu) | ✅ Done |
| 12 | Homepage (hero + featured movies grid) | ✅ Done |
| 13 | Login page (OTP 2-step flow) | ✅ Done |
| 14 | Movies listing page (search, genre filter, sort, pagination) | ✅ Done |
| 15 | Movie detail page (hero banner, info, showtimes by theater) | ✅ Done |
| 16 | Seat selection page (real-time socket, countdown, price calc) | ✅ Done |
| 17 | Booking history page (status badges, cancel, pagination) | ✅ Done |
| 18 | **BUILD VERIFIED** — `npx next build` thành công, 0 errors | ✅ Done |

### Frontend Files Chi Tiết
| File | Nội dung |
|---|---|
| `types/index.ts` | User, Movie, Theater, Show, SeatLayout, Booking, Transaction, API responses/params, Socket payloads |
| `lib/baseQuery.ts` | fetchBaseQuery credentials:include, 401 → refresh cookie → retry |
| `lib/socket.ts` | Socket.IO singleton, connectSocket(token), disconnectSocket() |
| `store/index.ts` | configureStore with 4 APIs (auth, movie, show, booking) + 2 slices (auth, bookingFlow) |
| `store/hooks.ts` | useAppDispatch, useAppSelector typed hooks |
| `store/api/authAPI.ts` | sendOtp, verifyOtp, getMe, logout |
| `store/api/movieAPI.ts` | getMovies (pagination+filter), getMovie, getGenres |
| `store/api/showAPI.ts` | getShows, getShow, getShowsByMovie, getAvailableDates |
| `store/api/bookingAPI.ts` | createBooking, confirmBooking, getUserBookings, getBookingDetail, cancelBooking |
| `store/slice/authSlice.ts` | user, isAuthenticated, isLoading |
| `store/slice/bookingSlice.ts` | selectedShowId, selectedSeats, holdExpiresAt, seatStatus |
| `components/providers/StoreProvider.tsx` | Redux Provider with ref pattern (Next.js App Router) |
| `components/providers/AuthInitializer.tsx` | useGetMeQuery → dispatch setUser/clearUser on mount |
| `components/layout/Navbar.tsx` | Logo, nav links, auth dropdown, mobile hamburger menu |
| `app/layout.tsx` | Inter font (Vietnamese), dark mode, Navbar + footer |
| `app/page.tsx` | Hero section + featured movies grid (sort by rating) |
| `app/login/page.tsx` | 2-step OTP: email → OTP input (4 digits, mono font) |
| `app/movies/page.tsx` | Movie grid + search + genre filter + sort + pagination |
| `app/movies/[id]/page.tsx` | Movie hero (blurred poster bg) + date picker + showtimes grouped by theater |
| `app/booking/[showId]/page.tsx` | Seat grid (10×12), real-time socket updates, countdown timer, hold/release/book flow |
| `app/bookings/page.tsx` | Booking history cards, status badges, cancel, pagination |
| `app/globals.css` | Dark cinema theme (red primary), seat CSS classes, animations |

---

## 🔌 API Endpoints (Web) — Đầy đủ

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/web/auth/send-otp` | ❌ | Gửi OTP qua email |
| POST | `/api/v1/web/auth/verify-otp` | ❌ | Xác thực OTP → set cookies |
| POST | `/api/v1/web/auth/refresh-token` | ❌ | Refresh access token |
| GET | `/api/v1/web/auth/me` | ✅ | Lấy thông tin user hiện tại |
| POST | `/api/v1/web/auth/logout` | ✅ | Đăng xuất, clear cookies |
| GET | `/api/v1/web/movies?genre=&search=&page=&limit=&sort=` | ❌ | Danh sách phim (pagination, filter) |
| GET | `/api/v1/web/movies/genres` | ❌ | Danh sách thể loại |
| GET | `/api/v1/web/movies/:id` | ❌ | Chi tiết phim + suất chiếu tương lai |
| GET | `/api/v1/web/shows?movieId=&theaterId=&date=` | ❌ | Danh sách suất chiếu (filter) |
| GET | `/api/v1/web/shows/:id` | ❌ | Chi tiết suất chiếu + ghế held/booked |
| GET | `/api/v1/web/shows/movie/:movieId` | ❌ | Suất chiếu theo phim (grouped by theater) |
| GET | `/api/v1/web/shows/movie/:movieId/dates` | ❌ | Ngày có suất chiếu |
| POST | `/api/v1/web/bookings/create` | ✅ | Tạo booking (cần seat hold trước) |
| POST | `/api/v1/web/bookings/confirm` | ✅ | Xác nhận booking sau thanh toán |
| GET | `/api/v1/web/bookings/my-bookings?page=&limit=` | ✅ | Lịch sử đặt vé |
| GET | `/api/v1/web/bookings/:id` | ✅ | Chi tiết booking |
| PATCH | `/api/v1/web/bookings/:id/cancel` | ✅ | Hủy booking |
| POST | `/api/v1/web/payment/vnpay/create` | ✅ | Tạo thanh toán VNPay |
| GET | `/api/v1/web/payment/vnpay/return` | - | VNPay callback |
| POST | `/api/v1/web/payment/zalopay/create` | ✅ | Tạo thanh toán ZaloPay |
| POST | `/api/v1/web/payment/zalopay/callback` | - | ZaloPay callback |

## 🔌 Socket Events

| Event | Direction | Payload | Mô tả |
|---|---|---|---|
| `show:join` | Client→Server | `showId` | Join phòng xem ghế |
| `show:leave` | Client→Server | `showId` | Rời phòng |
| `seats:hold` | Client→Server | `{ showId, seats[] }` + callback | Giữ ghế 7 phút |
| `seats:release` | Client→Server | `{ showId }` + callback | Hủy giữ ghế |
| `show:seats-update` | Server→Client | `{ showId, held[], booked[], timestamp }` | Broadcast trạng thái ghế |
| `seats:expired` | Server→Client | `{ showId, seats[] }` | Hết thời gian giữ |
| `payment:success` | Server→Client | `{ transactionCode, amount, status }` | Thanh toán thành công |
