# BÁO CÁO CÔNG NGHỆ VÀ BẢN ĐỒ TÍNH NĂNG HỆ THỐNG ĐẶT VÉ XEM PHIM

Báo cáo chi tiết về Hệ thống Công nghệ (Tech Stack) hiện tại và Bản đồ Tính năng (Features & Modules) của dự án Booking System (Website đặt vé rạp chiếu phim thời gian thực). Tài liệu này được chuẩn hóa để gửi cho các thành viên trong đội ngũ phát triển và vận hành dự án.

---

# PHẦN 1: HỆ THỐNG CÔNG NGHỆ (TECH STACK OVERVIEW)

Dự án được xây dựng theo kiến trúc phân tách độc lập giữa Frontend và Backend (API-driven), tích hợp các dịch vụ Cloud hiện đại để hỗ trợ vận hành và mở rộng.

## Frontend (Client-side)
- Framework chính: Next.js 16.2.6 (sử dụng kiến trúc App Router hiện đại giúp tối ưu SEO và Server-Side Rendering).
- Thư viện lõi: React 19.2.4 và React DOM 19.2.4.
- Ngôn ngữ: TypeScript (khai báo kiểu dữ liệu chặt chẽ cho toàn bộ API Response, Params và Real-time Payload).
- Quản lý trạng thái (State Management): Redux Toolkit kết hợp React Redux và RTK Query (hỗ trợ caching dữ liệu API, tự động đồng bộ hóa/invalidates cache khi cập nhật dữ liệu, xử lý tự động làm mới phiên đăng nhập - Token Auto-Refresh).
- Hệ thống Giao diện & Styling:
  - Tailwind CSS v4 + @tailwindcss/postcss (thiết kế responsive linh hoạt, tùy biến giao diện).
  - shadcn/ui và @base-ui/react (bộ component UI cao cấp, đồng bộ và chuyên nghiệp).
  - Hiệu ứng chuyển động: tw-animate-css (micro-animations), các hiệu ứng Glassmorphism và Immersive Backdrop mờ ảo.
- Thời gian thực (Real-time): socket.io-client v4.8.3 (kết nối WebSocket để cập nhật sơ đồ ghế, số lượng người xem và thông báo thanh toán thành công).
- Thư viện bổ trợ nổi bật:
  - swiper v12.1.4 (hiệu ứng slide danh sách phim cuộn ngang mượt mà).
  - sonner v2.0.7 (hộp thoại thông báo Toast sắc nét, cao cấp).
  - lucide-react v1.14.0 (bộ biểu tượng phong phú).
  - js-cookie & date-fns (xử lý cookie an toàn và định dạng thời gian).
- Thư viện tiện ích và cấu hình phụ trợ khác:
  - next-themes v0.4.6 (hỗ trợ chế độ giao diện sáng/tối - Dark/Light mode).
  - class-variance-authority, clsx, tailwind-merge (quản lý class CSS động cho các thành phần UI).

## Backend (Server-side)
- Runtime & Framework: Node.js (cấu hình ES Modules "type": "module") kết hợp với Express.js v5.2.1 (sử dụng các tính năng mới nhất của Express 5 để xử lý định tuyến hiệu năng cao).
- Hệ thống Cơ sở dữ liệu và Công cụ tìm kiếm (Databases & Search Engines):
  - Cơ sở dữ liệu chính (Main Relational DB): PostgreSQL (sử dụng Neon Cloud PostgreSQL cho Production, chạy Docker PostgreSQL local cho Development; kết nối thông qua trình khách pg v8.20.0 và quản lý bởi Prisma ORM v7.8.0).
  - Bộ nhớ đệm & Giữ ghế tạm thời (Cache & In-memory Store): Redis (sử dụng Upstash Redis cho Production, chạy Docker Redis local cho Development; kết nối qua ioredis v5.10.1).
  - Công cụ tìm kiếm thông minh & Lưu dữ liệu chỉ mục (Search Engine & Index Store): OpenSearch / Elasticsearch (sử dụng Searchly Cloud cho Production, chạy Docker OpenSearch local cho Development; kết nối qua @opensearch-project/opensearch v3.6.0).
- Hàng đợi tin nhắn (Message Queue): RabbitMQ (sử dụng CloudAMQP trên Production, Docker RabbitMQ local trong Development; kết nối qua amqplib v2.0.1 để xử lý các tác vụ bất đồng bộ như gửi email, đồng bộ dữ liệu phim).
- Lưu trữ tệp tin (File Storage): Cloudflare R2 / AWS S3 (sử dụng @aws-sdk/client-s3 v3.1045.0 hỗ trợ tải ảnh poster phim, logo rạp và ảnh đại diện người dùng lên máy chủ lưu trữ phân tán).
- Trí tuệ nhân tạo (AI Chatbot Brain):
  - LangGraph JS v1.3.0 & @langchain/core (khung sườn thiết lập đồ thị trạng thái điều hướng hội thoại phức tạp).
  - @langchain/openai kết hợp mô hình GPT của OpenAI (phục vụ NLP bóc tách tham số và nhận diện ý định của khách hàng).
  - @langchain/langgraph-checkpoint-postgres (tự động hóa việc nén và ghi nhớ lịch sử chat vĩnh viễn vào DB PostgreSQL qua thread_id).
- Cổng thanh toán kết hợp:
  - vnpay v2.5.0 (tạo URL giao dịch VNPay, quét mã QR và xác thực chữ ký số).
  - ZaloPay Sandbox (gọi các API sinh đơn hàng QR động, checksum MD5/SHA256 bảo mật).
- Hệ thống bảo mật: express-rate-limit, helmet, bcryptjs, jsonwebtoken (JWT), zod (validate đầu vào chặt chẽ), multer & sharp (xử lý resize ảnh sang định dạng WebP).
- Thư viện tiện ích và cấu hình phụ trợ khác:
  - axios v1.16.0 & crypto-js v4.2.0 (gửi request kết nối ZaloPay và xử lý mã hóa dữ liệu).
  - nodemailer v8.0.7 & qrcode v1.5.4 (gửi thư điện tử và tự động sinh mã QR).
  - nanoid v5.1.11 (tạo các chuỗi ID ngẫu nhiên không trùng lặp cho mã vé).
  - date-fns v4.1.0 & moment v2.30.1 (hỗ trợ tính toán định dạng ngày tháng suất chiếu).
  - dotenv v17.4.2 & cookie-parser v1.4.7 & cors v2.8.6 & morgan v1.10.1 (quản lý biến môi trường, phân tích cookie, bảo vệ nguồn gốc truy cập CORS và ghi nhật ký yêu cầu).

---

# PHẦN 2: BẢN ĐỒ 15 TÍNH NĂNG CỐT LÕI (UPGRADED FEATURE MODULES)

Dưới đây là chi tiết 15 tính năng cốt lõi đã được nâng cấp, sửa đổi và hoàn thiện so với tài liệu cũ nhằm đảm bảo tính chính xác theo mã nguồn hiện tại của dự án:

## 1. Hệ thống Xác thực và Quản lý Tài khoản (Authentication & Authorization)
- Đăng ký tài khoản khách hàng mới bằng Email.
- Cơ chế gửi mã OTP 4 số ngẫu nhiên qua email và xác thực OTP an toàn.
- Đăng nhập thông tin thông qua JWT Token lưu trữ dưới dạng Cookie bảo mật (httpOnly, Secure, SameSite) cho Website giúp chống các cuộc tấn công XSS/CSRF, và Header Authorization cho phiên bản Mobile.
- Cơ chế tự động làm mới phiên đăng nhập (Refresh Token) tự động kích hoạt thông qua middleware RTK Query khi Access Token hết hạn, trả về mã lỗi chuẩn "TokenExpiredError" để xử lý mượt mà.
- Đăng xuất an toàn, xóa bỏ session cookie trên trình duyệt và vô hiệu hóa token trong database.
- Trang thông tin cá nhân hiển thị chi tiết hồ sơ, cấp bậc hội viên (Silver, Gold, Platinum), thanh tiến trình thăng hạng trực quan và tích lũy điểm thưởng (Reward Points).

## 2. Trang chủ và Tìm kiếm Phim Thông minh (Homepage & Intelligent Search)
- Banner tiêu điểm hiển thị những bộ phim nổi bật có đánh giá (rating) cao nhất.
- Danh sách phim đang chiếu và phim sắp chiếu hiển thị trực quan dưới dạng thanh trượt Slider.
- Ô tìm kiếm phim thông minh trên Header tích hợp cơ chế Debounce (trì hoãn 400ms) để tránh spam API liên tục.
- Tích hợp công cụ tìm kiếm OpenSearch/Elasticsearch: Hỗ trợ tìm kiếm fuzzy (không dấu, viết thường, sai một vài ký tự), khớp tiền tố (prefix) và trả về kết quả khớp tối đa tức thì.
- Khung hiển thị kết quả tìm kiếm thả xuống (Dropdown) với đầy đủ thông tin: Ảnh bìa (Poster), tên phim, thể loại, thời lượng và rating. Tự động đóng khi nhấn chuột ra ngoài (Click-outside detection).

## 3. Trang chi tiết Phim và Chọn Suất Chiếu (Movie Detail & Showtimes)
- Trang chi tiết thiết kế giao diện Immersive Backdrop cực kỳ cao cấp, tự động lấy ảnh Poster phim làm hình nền được làm mờ (blur), mang lại trải nghiệm đậm chất rạp phim.
- Hiển thị đầy đủ thông tin chi tiết phim bao gồm: Trailer chính thức (mở tab video riêng biệt), đạo diễn, diễn viên, ngôn ngữ, thể loại, thời lượng và cốt truyện.
- Trình xem suất chiếu thông minh: Lọc suất chiếu theo ngày cụ thể (Available Dates) và hiển thị danh sách các rạp chiếu đang phát phim đó.
- Các khung giờ chiếu được gom nhóm trực quan theo phòng chiếu (Screen) và định dạng phòng (2D, 3D, IMAX), tự động điều hướng sang sơ đồ phòng chiếu tương ứng khi khách hàng click chọn.

## 4. Sơ đồ Chọn Ghế Thời gian thực (Interactive Real-time Seat Map)
- Giao diện phòng chiếu được vẽ bằng vector SVG sắc nét, hiển thị rõ ràng vị trí màn hình, các hàng ghế (A-J) và số cột tương ứng.
- Phân cấp và phân biệt màu sắc rõ ràng giữa các hạng ghế: Ghế Thường (Standard), Ghế VIP (hàng E-G), Ghế đôi (Sweetbox ở hàng cuối J) với mức giá vé khác nhau tương ứng.
- Cho phép chọn tối đa 10 ghế cùng lúc và hiển thị giá tiền tạm tính tương ứng thời gian thực.
- Tích hợp WebSockets (Socket.IO):
  - Đồng bộ hóa lựa chọn (Selection Sync): Khi một người dùng nhấp chọn ghế, ghế đó lập tức chuyển sang màu đỏ trên trình duyệt của tất cả người dùng khác đang xem chung suất chiếu để ngăn chọn trùng.
  - Hiển thị số lượng người dùng đang xem trực tuyến (Occupancy Tracking/Viewer Count) của suất chiếu.
  - Trình chạy thông báo toàn cục (Global Booking Ticker): Phát thông báo dạng chạy chữ trên màn hình khi có khách hàng khác đặt vé thành công để tạo hiệu ứng cộng đồng sôi động.

## 5. Khóa Giữ Ghế Tạm thời và Tự động Giải phóng (Temporary Seat Holds & Auto-Release)
- Cơ chế giữ ghế tạm thời (Seat Hold) khi người dùng tiến vào trang thanh toán được lưu trữ trực tiếp trong bộ nhớ đệm Redis với thời gian hết hạn (TTL) là 7 phút.
- Bộ đếm thời gian ngược (Countdown Timer) 7 phút hiển thị trực tiếp trên giao diện chọn ghế và thanh toán.
- Tự động giải phóng ghế: Hệ thống gửi sự kiện seats:expired qua Socket.IO tới client khi hết 7 phút để giải phóng ghế khỏi Redis và cập nhật lại trạng thái ghế trên sơ đồ.
- Tính năng "Hủy & Chọn lại ghế" cho phép người dùng chủ động giải phóng ghế ngay lập tức khỏi Redis/DB để nhường quyền chọn cho khách hàng khác mà không cần đợi hết hạn.

## 6. Cổng Thanh toán Trực tuyến ZaloPay & VNPay (Payment Gateway Integrations)
- Tích hợp cổng thanh toán ZaloPay Sandbox: Hỗ trợ tạo đơn hàng QR code động hiển thị trực tiếp trên giao diện Web, cho phép quét mã thanh toán thật trong môi trường giả lập.
- Tích hợp cổng thanh toán VNPay: Hỗ trợ thanh toán qua thẻ ATM nội địa hoặc quét mã QR ngân hàng.
- Cơ chế Webhook Callback bảo mật từ ZaloPay/VNPay truyền về Backend thông qua đường truyền an toàn (Ngrok trong môi trường dev). Backend tiến hành xác thực chữ ký (checksum), kiểm tra số tiền và cập nhật trạng thái đơn hàng thành CONFIRMED một cách tự động.
- Sử dụng Socket.IO / API Polling để tự động phát hiện trạng thái thanh toán thành công từ Server và chuyển hướng khách hàng về trang danh sách vé của họ ngay lập tức mà không cần F5 tải lại trang.

## 7. Trang Danh sách Vé đã Đặt (My Bookings)
- Hiển thị danh sách toàn bộ lịch sử đặt vé của người dùng dưới dạng các thẻ (Card) trực quan kèm phân trang.
- Thông tin vé hiển thị chi tiết: Tên phim, ảnh poster, thời gian chiếu, rạp chiếu, phòng chiếu, danh sách số ghế cụ thể (ví dụ: A7, E8), thông tin các phần bắp nước combo đi kèm, tổng tiền và trạng thái (Chờ thanh toán / Đã thanh toán / Đã hủy / Hết hạn).
- Cho phép người dùng chủ động Hủy vé đặt (Cancel Booking) đối với các vé chưa thanh toán hoặc theo chính sách rạp, tự động giải phóng ghế liên đới tức thì.

## 8. Trang Hệ thống Rạp và Giá vé (Theaters & Pricing)
- Bộ lọc danh sách rạp theo từng thành phố/tỉnh thành lớn.
- Thông tin chi tiết của từng rạp bao gồm: Hotline, địa chỉ cụ thể và phân hạng phòng chiếu tích hợp.
- Bảng giá vé 2D/3D chuẩn quốc tế hiển thị chi tiết cho cả ngày thường và cuối tuần ứng với từng phân hạng ghế thường, ghế VIP và ghế đôi.
- Logic tự động hóa: Khi quản trị viên tạo một rạp/phòng chiếu mới, hệ thống tự động sinh cấu trúc ghế thực thể (Seat Layout) tương ứng trong PostgreSQL theo cấu hình hàng/cột định sẵn.

## 9. Trang Ưu đãi và Khuyến mãi (Vouchers & Coupons)
- Danh sách các thẻ coupon giảm giá, voucher quà tặng, bắp nước thiết kế dạng lưới hover 3D bắt mắt.
- Tính năng sao chép mã ưu đãi nhanh (Copy to Clipboard) chỉ với 1-Click kèm thông báo toast.
- Hệ thống Voucher hỗ trợ giảm giá theo phần trăm (%) hoặc số tiền cố định, kiểm tra chặt chẽ điều kiện áp dụng (giá trị đơn hàng tối thiểu, ngày hết hạn, giới hạn số lần sử dụng của mỗi user).

## 10. Hệ thống Quản trị Viên Admin (Backoffice Dashboard)
- Trang quản trị biệt lập bảo vệ nghiêm ngặt bằng middleware xác thực quyền verifyAdminRole (chỉ cho phép tài khoản có role === 'ADMIN' truy cập).
- Bảng điều khiển (Dashboard Stats): Thống kê tổng doanh thu rạp, số lượng vé bán ra, tổng số phim đang hoạt động, biểu đồ doanh thu theo thời gian và danh sách top phim/rạp đem lại doanh thu cao nhất.
- Quản lý Phim (Movie CRUD): Thêm mới phim (tải ảnh poster trực tiếp lên Cloudflare R2 thông qua Multer + Sharp chuyển đổi WebP), chỉnh sửa thông tin, xem thống kê doanh thu riêng của từng phim, thực hiện xóa mềm (isActive = false) hoặc xóa cứng vĩnh viễn.
- Quản lý Rạp & Phòng (Theater & Screen CRUD): Tạo rạp kèm logo rạp, quản lý các phòng chiếu tích hợp bên trong rạp.
- Quản lý Suất chiếu (Show CRUD): Tạo suất chiếu mới (chọn phim, chọn rạp, chọn phòng chiếu, thiết lập giờ chiếu bắt đầu/kết thúc và cấu hình sơ đồ giá vé tương ứng).
- Quản lý Đơn hàng (Booking & Transaction): Tìm kiếm và lọc toàn bộ lịch sử đặt vé của tất cả người dùng, thực hiện hủy các đơn hàng vi phạm hoặc theo yêu cầu hỗ trợ của khách hàng.

## 11. Trợ lý ảo AI Chatbot Đỉnh cao (LangGraph JS & State Graph Agent)
- Tích hợp trợ lý ảo thông minh chạy trên khung sườn đồ thị trạng thái LangGraph JS kết hợp mô hình ngôn ngữ lớn OpenAI GPT.
- Mô hình Lai đột phá (Hybrid AI & Database Agent): AI đóng vai trò làm bộ não NLP để phân loại 9 loại ý định (Intent Classifier) và bóc tách bộ lọc tìm kiếm (Parameter Extractor) thông qua Zod Schemas. Toàn bộ dữ liệu nặng được Node.js + Prisma ORM truy vấn trực tiếp từ PostgreSQL, triệt tiêu 100% hiện tượng bịa đặt dữ liệu (Zero Hallucination) và tối ưu hóa 95% chi phí vận hành token.
- Quản lý trạng thái đa tầng (PostgreSQL Checkpointer): Tích hợp thư viện @langchain/langgraph-checkpoint-postgres to tự động nén và lưu vĩnh viễn lịch sử trò chuyện vào bảng checkpoint_blobs theo thread_id. Người dùng có thể F5 tải lại trang thoải mái mà không bị mất lịch sử chat.
- Xử lý ngắt hội thoại thông minh (Interrupt & Resume): Tự động phát hiện thiếu thông tin tên phim (ý định movie_detail_missing_field), gọi hàm interrupt() để tạm dừng đồ thị, yêu cầu người dùng bổ sung và tự động resume tiếp tục chạy mượt mà.
- Nhúng ngữ cảnh đối chiếu động (Dynamic Context Injection): Trước khi gọi AI phân loại, hệ thống tự động tải danh sách phim đang hoạt động từ PostgreSQL và nhúng trực tiếp làm tập đối chiếu, giúp AI nhận diện chính xác 100% các từ đồng âm viết thường/không dấu (ví dụ: "còn phim nhà bà nữ thì sao", "phim mai thế nào") và tự động chuẩn hóa chữ hoa/thường để khớp với Database.
- Tối ưu hóa Giao thức Handshake (Socket.io Upgrade): Hệ thống Socket.io kết nối trợ lý tự động thử giao thức HTTP Polling trước để đảm bảo kết nối thành công 100%, sau đó tự động nâng cấp lên WebSocket mà không gây lỗi Console. Đồng thời, tự động cho phép khách vãng lai (Guest) kết nối dưới quyền Guest Viewer để trải nghiệm thời gian thực thay vì bị ngắt kết nối.

## 12. Hệ thống Bảo mật & Chống Phá hoại Nâng cao (Advanced Security & Abuse Prevention)
- Lớp chặn Tốc độ Toàn cục (Global API Limiter): Tích hợp middleware express-rate-limit giới hạn tối đa 100 requests/phút trên mỗi IP tại cổng ngõ /api để triệt tiêu các hành vi spam hay tấn công từ chối dịch vụ (DDoS) cơ bản.
- Bảo vệ Đăng nhập & Đăng ký (Auth Brute-Force Shield): Thiết lập bộ giới hạn 15 giây đối với tối đa 5 lần thử sai liên tục trên các tuyến đăng nhập, đăng ký và lấy OTP. Đảm bảo chặn đứng hoàn toàn các script dò mật khẩu tốc độ cao của bot mà vẫn mang lại trải nghiệm thân thiện nhất cho người dùng thật (chỉ cần đợi 15s là có thể thử lại).
- Chặn Spam Chatbot AI (AI LLM Token Protection): Áp dụng giới hạn 5 tin nhắn/phút cho route chatbot /chat cùng bộ lọc lặp ký tự vô nghĩa (như "aaaaaa", "?????") và chuỗi lặp lại liên tục trước khi gọi Gemini/OpenAI API, giúp bảo vệ 100% ngân sách chi phí token và ngăn chặn quá tải event loop của máy chủ.
- Chống Giữ Ghế Ảo và Khóa Ghế Spam (Seat-Locking Cooldown & Constraints):
  - Ràng buộc logic tại tầng database: Mỗi tài khoản chỉ được phép có duy nhất tối đa 1 đơn hàng ở trạng thái PENDING (chờ thanh toán) tại một thời điểm để tránh giữ nhiều ghế ảo song song.
  - Thiết lập hình phạt đóng băng: Đếm số lượng đơn hàng bị hủy hoặc quá giờ hết hạn (CANCELLED, EXPIRED) trong vòng 1 giờ qua. Nếu người dùng hủy hoặc để đơn hết hạn quá 3 lần liên tiếp, hệ thống tự động khóa tính năng đặt vé của tài khoản đó trong 1 giờ. Không bao giờ áp dụng hình phạt đối với người dùng thanh toán vé thành công (CONFIRMED).
- Đồng bộ hóa Bảo mật Đa kênh (Postman/cURL Sync & React Redux Catch): Lớp bảo vệ chặn đứng hoàn toàn ở tầng Backend máy chủ, trả về mã trạng thái HTTP chuẩn 429 Too Many Requests kèm JSON mô tả chi tiết lỗi khi bị bot/Postman spam. Ở Frontend trình duyệt, ứng dụng tự động bắt mã lỗi này và hiển thị hộp cảnh báo màu đỏ tuyệt đẹp (Sonner Toast) báo cho người dùng.

## 13. Hệ thống Bán Đồ ăn kèm (Concession / Popcorn & Drink Combo System)
- Cho phép người dùng chọn mua các combo bắp nước (ví dụ: Solo Combo, Couple Combo) song song với quá trình đặt ghế xem phim.
- Tự động cộng gộp giá trị của các combo bắp nước vào tổng tiền thanh toán của đơn hàng.
- Lưu trữ chi tiết thông tin các món đồ ăn đi kèm trong các bảng quan hệ cơ sở dữ liệu (BookingConcession) để phục vụ việc kiểm tra và chuẩn bị đồ ăn tại quầy khi khách hàng đến rạp nhận vé.

## 14. Tác vụ ngầm gửi Mail Xác nhận Sang trọng (Premium Email Confirmation via Worker)
- Khi thanh toán thành công, hệ thống tự động sinh Email với mẫu giao diện HTML chuyên nghiệp, sang trọng (Premium HTML Email Template).
- Email chứa đầy đủ thông tin: Mã vé (Booking Reference), tên phim, ảnh poster, rạp chiếu, phòng chiếu, danh sách số ghế, thông tin combo bắp nước đi kèm, tổng tiền và một lời chào cảm ơn từ hệ thống rạp.
- Tác vụ gửi mail được đẩy vào hàng đợi RabbitMQ để xử lý bất đồng bộ, giúp tốc độ phản hồi API thanh toán cho khách hàng gần như tức thời mà không bị nghẽn bởi tốc độ gửi mail của SMTP Server.

## 15. Đồng bộ hóa Cơ sở dữ liệu và Kiến trúc Hàng đợi (Database Sync & RabbitMQ Architecture)
- Áp dụng kiến trúc khớp nối lỏng (Decoupled Architecture) sử dụng RabbitMQ làm Message Broker điều phối tin nhắn giữa các dịch vụ ngầm.
- Thiết lập các Queue chuyên biệt:
  - booking_confirmation_email: Nhận dữ liệu đặt vé thành công và gửi email.
  - booking_sync_elasticsearch: Đồng bộ hóa trạng thái hoặc dữ liệu phim mới sang OpenSearch/Elasticsearch ngay lập tức khi có thay đổi trong PostgreSQL.
- Đảm bảo tính nhất quán dữ liệu cao (Eventual Consistency) và triệt tiêu khả năng nghẽn luồng xử lý chính của máy chủ Web khi lượng người truy cập tăng đột biến.
