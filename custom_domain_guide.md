# Hướng Dẫn Cấu Hướng Tên Miền Custom Domain (Namecheap + Vercel + Render)

Chào Trung! Mình thấy bạn đang sở hữu tên miền **`trananhtrung.me`** trên Namecheap. Dưới đây là hướng dẫn chi tiết từng bước để cấu hình tên miền này giúp hệ thống hoạt động hoàn hảo (kể cả tab ẩn danh).

---

## BƯỚC 1: Cấu hình DNS trên Namecheap
1. Đăng nhập vào tài khoản **Namecheap** của bạn.
2. Vào phần **Domain List** -> Bấm **MANAGE** bên cạnh tên miền `trananhtrung.me`.
3. Chuyển sang tab **Advanced DNS**.
4. Xóa hết tất cả các bản ghi mặc định của Namecheap (như CNAME Parking, URL Redirect,...) để tránh xung đột.
5. Thêm mới **3 bản ghi** sau:

| Type (Loại) | Host (Ký tự) | Value (Giá trị) | TTL | Giải thích |
| :--- | :--- | :--- | :--- | :--- |
| **A Record** | `@` | `76.76.21.21` | Automatic | Trỏ tên miền gốc về Vercel (Frontend) |
| **CNAME Record** | `www` | `cname.vercel-dns.com.` | Automatic | Trỏ bản ghi www về Vercel |
| **CNAME Record** | `api` | `booking-system-backend-api.onrender.com.` | Automatic | Trỏ subdomain `api` về Render (Backend) |

> [!IMPORTANT]
> Lưu ý ở cuối các giá trị CNAME có một dấu chấm `.` (ví dụ: `cname.vercel-dns.com.`). Bạn nhớ điền đầy đủ nhé.

---

## BƯỚC 2: Cấu hình trên Vercel (Frontend)
1. Đăng nhập vào trang quản lý dự án **Vercel** của bạn.
2. Vào **Settings** -> **Domains**.
3. Nhập **`trananhtrung.me`** và bấm **Add**.
4. Vercel sẽ tự động gợi ý thêm cả bản ghi `www.trananhtrung.me` và thiết lập chuyển hướng (Redirect). Bạn cứ chọn theo khuyến nghị của Vercel.
5. Chờ vài phút để Vercel xác thực DNS. Khi hiện dòng chữ màu xanh lá báo thành công là xong.

---

## BƯỚC 3: Cấu hình trên Render (Backend)
1. Đăng nhập vào trang quản lý dự án **Render** của bạn.
2. Chọn Web Service của Backend.
3. Vào phần **Settings** -> Kéo xuống mục **Custom Domains**.
4. Bấm **Add Custom Domain** -> Điền **`api.trananhtrung.me`** rồi bấm **Save**.
5. Render sẽ xác thực bản ghi CNAME và tự động cấp chứng chỉ SSL miễn phí (mất khoảng vài phút).

---

## BƯỚC 4: Cấu hình Biến môi trường để kích hoạt Cookie chính chủ
Mình đã cập nhật sẵn code Backend để hỗ trợ chia sẻ cookie thông qua biến môi trường. Giờ bạn chỉ cần vào cấu hình trên giao diện là xong:

### 1. Trên Render (Backend):
Vào mục **Environment Variables** của Backend và thêm biến sau:
*   **Key:** `COOKIE_DOMAIN`
*   **Value:** `.trananhtrung.me` *(Chú ý: Phải có dấu chấm `.` ở đằng trước để cookie dùng chung được cho cả tên miền gốc và subdomain).*

### 2. Trên Vercel (Frontend):
Vào mục **Settings** -> **Environment Variables** và cập nhật lại các biến sau cho trỏ về tên miền mới:
*   **`NEXT_PUBLIC_API_URL`**: `https://api.trananhtrung.me/api/v1/web`
*   **`NEXT_PUBLIC_SOCKET_URL`**: `https://api.trananhtrung.me`

*(Sau khi đổi biến môi trường trên Vercel, bạn nhớ bấm **Redeploy** lại bản build mới nhất của Frontend để Vercel nạp các biến mới này vào code nhé).*

---

Chúc bạn thực hiện thành công! Nếu gặp vướng mắc ở bước nào, hãy nhắn ngay để mình hỗ trợ nhé.
