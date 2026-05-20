# Giải Thích Lỗi Trình Duyệt Chặn Cookie Trong Tab Ẩn Danh (Incognito) & Cách Khắc Phục Bằng Custom Domain

Chào Trung! Chúc mừng bạn đã cấu hình thành công Custom Domain và khắc phục triệt để lỗi mất session đăng nhập khi tải lại trang! 

Dưới đây là tài liệu giải thích chi tiết về mặt kỹ thuật lý do tại sao lỗi xảy ra và tại sao tên miền chung lại giải quyết được vấn đề này. Bạn có thể sử dụng nội dung này để đưa vào báo cáo đồ án hoặc trả lời câu hỏi phản biện của thầy cô nhé!

---

## 1. Bản chất của lỗi: Cookie bên thứ ba (Third-Party Cookie)

Khi chưa cấu hình Custom Domain, hệ thống của bạn chạy trên hai tên miền hoàn toàn độc lập:
*   **Frontend (Vercel):** `booking-system-deploy-test.vercel.app`
*   **Backend (Render):** `booking-system-backend-api.onrender.com`

Khi người dùng truy cập trang Frontend (Vercel) và thực hiện Đăng nhập, Backend (Render) sẽ trả về Cookie chứa Token xác thực. 
Vì tên miền của Backend (`onrender.com`) khác hoàn toàn tên miền hiển thị trên thanh địa chỉ của trình duyệt (`vercel.app`), trình duyệt sẽ coi các Cookie này là **Cookie bên thứ ba (Third-Party Cookies)**.

---

## 2. Tại sao tab thường hoạt động bình thường nhưng tab ẩn danh (Incognito) lại lỗi?

### Trong tab thường (Normal Tab):
*   Trình duyệt cho phép lưu trữ và truyền nhận Cookie bên thứ ba **NẾU** chúng ta cấu hình thuộc tính `SameSite=None` và `Secure` ở Backend.
*   Do đó, ở tab thường bạn vẫn đăng nhập và tải lại trang bình thường.

### Trong tab ẩn danh (Incognito Tab):
*   Chế độ ẩn danh hoạt động với tiêu chí bảo mật và quyền riêng tư cao nhất (chống theo dõi người dùng chéo trang).
*   **Tất cả các trình duyệt hiện đại (Chrome, Edge, Safari, Firefox) đều cấu hình mặc định là CHẶN HOÀN TOÀN Cookie bên thứ ba trong tab ẩn danh**, bất kể nhà phát triển có set `SameSite=None` hay không.
*   Khi cookie bị chặn, trình duyệt không lưu lại Token. Dẫn đến việc khi bạn vừa F5 (tải lại trang), Frontend gửi request `check auth` lên Backend nhưng không mang theo cookie xác thực nào cả 👉 Bị trả về lỗi **`401 Unauthorized`**.

---

## 3. Tại sao Custom Domain chung lại giải quyết được 100% vấn đề?

Khi bạn đưa dự án về chạy chung một gốc tên miền:
*   **Frontend (Vercel):** `www.trananhtrung.me`
*   **Backend (Render):** `api.trananhtrung.me`

Lúc này, dù chạy ở hai subdomain khác nhau, nhưng chúng đều chung một tên miền đăng ký gốc là **`trananhtrung.me`**.

### Kết quả:
1.  **Biến thành Cookie chính chủ (First-Party Cookie):**
    Trình duyệt nhận thấy Cookie được gửi giữa các trang cùng chung gốc `trananhtrung.me` nên sẽ coi đó là Cookie chính chủ (First-party).
2.  **Tab ẩn danh không bao giờ chặn:**
    Chế độ ẩn danh của trình duyệt **chỉ chặn cookie bên thứ ba** chứ **không bao giờ chặn cookie chính chủ** (vì nếu chặn cookie chính chủ thì người dùng không thể đăng nhập vào bất kỳ trang web nào khi lướt ẩn danh).
3.  **Tăng cường bảo mật tối đa:**
    Bây giờ, chúng ta có thể chuyển thuộc tính `sameSite` từ `None` quay về `Lax`. Đây là cơ chế bảo mật tiêu chuẩn giúp chống lại các cuộc tấn công giả mạo yêu cầu chéo trang (CSRF) cực kỳ hiệu quả mà vẫn đảm bảo tính năng hoạt động trơn tru.

---

Tài liệu này sẽ giúp bạn ghi điểm tuyệt đối trong mắt hội đồng phản biện vì đã hiểu sâu sắc về cơ chế hoạt động của Cookie và chính sách bảo mật của các trình duyệt hiện đại!
