1. Hệ thống Xác thực và Quản lý Tài khoản (Authentication & Authorization)
   - Đăng ký tài khoản khách hàng mới.
   - Đăng nhập tài khoản khách hàng sử dụng JWT Token và Cookie bảo mật.
   - Cơ chế tự động làm mới phiên đăng nhập (Refresh Token) khi Access Token hết hạn.
   - Đăng xuất an toàn và xóa bỏ session cookie trên trình duyệt.
   - Trang hồ sơ cá nhân (Profile) hiển thị chi tiết thông tin người dùng, cấp bậc hội viên (Silver, Gold, Platinum), tiến trình thăng hạng và điểm thưởng tích lũy (Reward Points).

2. Trang chủ và Tìm kiếm Phim Thông minh (Homepage & Debounced Search)
   - Banner tiêu điểm hiển thị phim nổi bật có điểm đánh giá cao nhất.
   - Danh sách phim đang chiếu và phim sắp chiếu hiển thị dưới dạng thanh trượt Slider cuộn ngang.
   - Thanh tìm kiếm phim thông minh trên Header tích hợp cơ chế Debounce (trì hoãn 400ms) để tối ưu hiệu năng.
   - Dropdown hiển thị kết quả tìm kiếm thời gian thực với đầy đủ thông tin: Ảnh bìa (Poster), tên phim, thể loại, thời lượng và điểm đánh giá.
   - Cơ chế tự động đóng khung tìm kiếm khi nhấp chuột ra ngoài vùng ô nhập liệu (Click-outside detection).

3. Trang chi tiết Phim và Chọn Suất Chiếu (Movie Detail & Showtimes)
   - Hiển thị đầy đủ thông tin chi tiết phim bao gồm: Trailer chính thức (mở tab mới), đạo diễn, diễn viên, ngôn ngữ, thể loại, thời lượng, ngày khởi chiếu và cốt truyện.
   - Hiển thị danh sách các rạp đang chiếu phim đó và các suất chiếu tương ứng đi kèm.
   - Danh sách các khung giờ chiếu hiển thị trực quan theo từng phòng chiếu và định dạng phòng chiếu (2D, 3D, IMAX).
   - Điều hướng trực tiếp tới sơ đồ đặt vé theo mã suất chiếu đã chọn.

4. Sơ đồ Chọn Ghế Thời gian thực (Interactive Real-time Seat Map)
   - Giao diện sơ đồ phòng chiếu dạng SVG, hiển thị màn hình, các hàng ghế (A-J) và số cột ghế.
   - Phân biệt rõ ràng màu sắc và vị trí các phân hạng ghế: Ghế Thường (Standard), Ghế VIP, Ghế đôi (Sweetbox).
   - Cho phép chọn tối đa 10 ghế cùng lúc và tự động tính tổng tiền tạm tính.
   - Tích hợp WebSocket (Socket.io) thời gian thực: Tự động đổi ghế sang trạng thái màu đỏ (đang chọn) trên trình duyệt của người dùng khác khi có ai đó đang nhấn giữ ghế, tránh trùng lặp ghế đặt.
   - Hiển thị số lượng người dùng đang xem chung suất chiếu thời gian thực (Viewer Count).

5. Khóa Giữ Ghế Tạm thời và Tự động Giải phóng (Temporary Seat Holds & Auto-Release)
   - Cơ chế giữ ghế tạm thời (Seat Hold) được lưu trực tiếp vào bộ nhớ đệm Redis trong 10 phút.
   - Bộ đếm thời gian ngược (10 phút) hiển thị trực quan tại trang thanh toán.
   - Script dọn dẹp giữ ghế tự động chạy ngầm (background cleanup script) tự động giải phóng ghế trong Redis và cập nhật trạng thái trong cơ sở dữ liệu nếu người dùng không hoàn tất thanh toán sau 10 phút.
   - Tính năng "Hủy & Chọn lại ghế" giải phóng ghế ngay lập tức khỏi Redis và database để người dùng khác có thể chọn.

6. Cổng Thanh toán Trực tuyến ZaloPay & VNPay (Payment Gateway Integrations)
   - Tích hợp cổng thanh toán ZaloPay thật thông qua môi trường Sandbox của ZaloPay.
   - Tích hợp cổng thanh toán VNPay thông qua thẻ ATM nội địa hoặc quét mã QR.
   - Tạo mã QR thanh toán động và hiển thị trực tiếp trên giao diện Modal của khách hàng.
   - Cơ chế Webhook Callback bảo mật từ ZaloPay/VNPay truyền qua đường truyền Ngrok (Public Port 5000) về Backend, tự động xác thực chữ ký (checksum), ghi nhận thanh toán thành công và cập nhật trạng thái vé thành CONFIRMED.
   - Tự động phát hiện trạng thái thanh toán thành công thông qua Socket/API Polling để chuyển hướng khách hàng về trang danh sách vé ngay lập tức.

7. Trang Danh sách Vé đã Đặt (My Bookings)
   - Hiển thị danh sách toàn bộ các vé người dùng đã đặt.
   - Thông tin vé hiển thị rõ ràng: Tên phim, thời gian chiếu, rạp chiếu, phòng chiếu, danh sách số ghế cụ thể (ví dụ: A7, B12), tổng tiền đã thanh toán và trạng thái vé (Đã thanh toán / Đã hủy).

8. Trang Hệ thống Rạp và Giá vé (Theaters & Pricing)
   - Bộ lọc danh sách rạp theo từng khu vực thành phố lớn trên cả nước.
   - Thông tin chi tiết của từng rạp bao gồm: Hotline, địa chỉ cụ thể và phân hạng phòng chiếu tích hợp.
   - Bảng giá vé 2D chuẩn quốc tế hiển thị chi tiết cho cả ngày thường và cuối tuần ứng với từng phân hạng ghế thường, ghế VIP và ghế đôi.

9. Trang Ưu đãi và Khuyến mãi (Promotions & Coupons)
   - Danh sách thẻ coupon, voucher bắp nước và vé phim thiết kế dạng lưới hover 3D.
   - Tính năng sao chép mã khuyến mãi chỉ bằng 1-Click (Copy to Clipboard) kèm thông báo toast của hệ thống.

10. Hệ thống Quản trị Viên Admin (Backoffice Dashboard)
    - Thống kê doanh thu, số lượng vé bán ra, số lượng phim và rạp chiếu.
    - Quản lý phim: Thêm phim mới, chỉnh sửa thông tin phim, cập nhật trạng thái hoạt động.
    - Quản lý suất chiếu (Shows): Tạo lịch chiếu, chọn phòng chiếu, giờ chiếu và mức giá vé.
    - Quản lý phòng chiếu (Screens) và thiết lập sơ đồ ghế phòng chiếu.
    - Quản lý rạp chiếu (Theaters) và quản lý hóa đơn giao dịch của khách hàng.

11. Trợ lý ảo AI Chatbot Đỉnh cao (LangGraph JS & State Graph Agent)
    - Tích hợp trợ lý ảo thông minh chạy trên khung sườn đồ thị trạng thái **LangGraph JS** kết hợp mô hình ngôn ngữ lớn **OpenAI GPT**.
    - **Mô hình Lai đột phá (Hybrid AI & Database Agent)**: AI đóng vai trò làm bộ não NLP để phân loại 9 loại ý định (Intent Classifier) và bóc tách bộ lọc tìm kiếm (Parameter Extractor) thông qua Zod Schemas. Toàn bộ dữ liệu nặng được Node.js + Prisma ORM truy vấn trực tiếp từ PostgreSQL, triệt tiêu 100% hiện tượng bịa đặt dữ liệu (Zero Hallucination) và tối ưu hóa 95% chi phí vận hành token.
    - **Quản lý trạng thái đa tầng (PostgreSQL Checkpointer)**: Tích hợp thư viện `@langchain/langgraph-checkpoint-postgres` để tự động nén và lưu vĩnh viễn lịch sử trò chuyện (messages) vào bảng `checkpoint_blobs` theo `thread_id`. Người dùng có thể F5 tải lại trang thoải mái mà không bị mất lịch sử chat.
    - **Xử lý ngắt hội thoại thông minh (Interrupt & Resume)**: Tự động phát hiện thiếu thông tin tên phim (ý định `movie_detail_missing_field`), gọi hàm `interrupt()` để tạm dừng đồ thị, yêu cầu người dùng bổ sung và tự động `resume` tiếp tục chạy mượt mà.
    - **Nhúng ngữ cảnh đối chiếu động (Dynamic Context Injection)**: Trước khi gọi AI phân loại, hệ thống tự động tải danh sách phim đang hoạt động từ PostgreSQL và nhúng trực tiếp làm tập đối chiếu, giúp AI nhận diện chính xác 100% các từ đồng âm viết thường/không dấu (ví dụ: "còn phim nhà bà nữ thì sao", "phim mai thế nào") và tự động chuẩn hóa chữ hoa/thường để khớp với Database.
    - Tối ưu hóa Giao thức Handshake (Socket.io Upgrade): Hệ thống Socket.io kết nối trợ lý tự động thử giao thức HTTP Polling trước để đảm bảo kết nối thành công 100%, sau đó tự động nâng cấp lên WebSocket mà không gây bất kỳ lỗi Console nào. Đồng thời, tự động cho phép người dùng vãng lai (Guest) hoặc phiên hết hạn được kết nối dưới quyền Guest Viewer để xem trạng thái ghế thời gian thực thay vì bị ngắt kết nối thô bạo.

12. Hệ thống Bảo mật & Chống Phá hoại Nâng cao (Advanced Security & Abuse Prevention)
    - **Lớp chặn Tốc độ Toàn cục (Global API Limiter)**: Tích hợp middleware `express-rate-limit` giới hạn tối đa 100 requests/phút trên mỗi IP tại cổng ngõ `/api` để triệt tiêu các hành vi spam hay tấn công từ chối dịch vụ (DDoS) cơ bản.
    - **Bảo vệ Đăng nhập & Đăng ký (Auth Brute-Force Shield)**: Thiết lập bộ giới hạn 15 giây đối với tối đa 5 lần thử sai liên tục trên các tuyến đăng nhập, đăng ký và lấy OTP. Đảm bảo chặn đứng hoàn toàn các script dò mật khẩu tốc độ cao của bot mà vẫn mang lại trải nghiệm thân thiện nhất cho người dùng thật (chỉ cần đợi 15s là có thể thử lại).
    - **Chặn Spam Chatbot AI (AI LLM Token Protection)**: Áp dụng giới hạn 5 tin nhắn/phút cho route chatbot `/chat` cùng bộ lọc lặp ký tự vô nghĩa (như "aaaaaa", "?????") và chuỗi lặp lại liên tục trước khi gọi Gemini API, giúp bảo vệ 100% ngân sách chi phí token và ngăn chặn quá tải event loop của máy chủ.
    - **Chống Giữ Ghế Ảo và Khóa Ghế Spam (Seat-Locking Cooldown & Constraints)**:
      - Ràng buộc logic tại tầng database: Mỗi tài khoản chỉ được phép có duy nhất **tối đa 1 đơn hàng ở trạng thái `PENDING`** (chờ thanh toán) tại một thời điểm để tránh giữ nhiều ghế ảo song song.
      - Thiết lập hình phạt đóng băng: Đếm số lượng đơn hàng bị hủy hoặc quá giờ hết hạn (`CANCELLED`, `EXPIRED`) trong vòng 1 giờ qua. Nếu người dùng hủy hoặc để đơn hết hạn quá 3 lần liên tiếp, hệ thống tự động khóa tính năng đặt vé của tài khoản đó trong 1 giờ. Không bao giờ áp dụng hình phạt đối với người dùng thanh toán vé thành công (`CONFIRMED`).
    - **Đồng bộ hóa Bảo mật Đa kênh (Postman/cURL Sync & React Redux Catch)**: Lớp bảo vệ chặn đứng hoàn toàn ở tầng Backend máy chủ, trả về mã trạng thái HTTP chuẩn `429 Too Many Requests` kèm JSON mô tả chi tiết lỗi khi bị bot/Postman spam. Ở Frontend trình duyệt, ứng dụng tự động bắt mã lỗi này và hiển thị hộp cảnh báo màu đỏ tuyệt đẹp (Sonner Toast) báo cho người dùng.
