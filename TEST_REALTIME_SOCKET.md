# Test Real-Time Seat Updates Socket Implementation

## Scenario: Người dùng 2 thanh toán → Người dùng 1 nhận socket update

### Setup
- Đảm bảo backend running trên port 5000
- Frontend running trên port 3000
- WebSocket server (Socket.IO) hoạt động

### Test Steps

#### 1. **Chuẩn bị 2 trình duyệt**
```
- Browser 1: User A (chọn ghế)
- Browser 2: User B (thanh toán)
```

#### 2. **User A: Chọn ghế A4**
- Truy cập: `http://localhost:3000/booking/{showId}`
- Click chọn ghế A4
- Nhìn thấy ghế highlight (blue state)
- Để ghế ở trạng thái "selecting"

#### 3. **User A: Qua trang payment**
- Click "THANH TOÁN" button
- Điều hướng đến: `/payment?bookingId={...}`
- **Quan sát:** Console log & network tab xem socket connection
- **Expected:** Socket emit `show:join` event

#### 4. **User B: Cũng chọn ghế A4 và thanh toán**
- Alternative browser tab / incognito window
- Register / Login với user khác  
- Chọn cùng show và chọn **ghế A4**
- Click "THANH TOÁN"
- Tiến hành thanh toán (test payment)
- **Expected on Backend:**
  - POST `/payment/vnpay` return payment QR
  - 30 giây sau (hoặc format payment thành công)
  - Backend `vnpayReturn` handler:
    1. Cập nhật booking status → CONFIRMED
    2. Call `emitShowUpdate(io, booking.showId)`
    3. Broadcast `show:seats-update` vào room `show:{showId}`
    4. Include: `{ booked: [{ seatId: "A4-id", userId: "user-b" }], ...other }`

#### 5. **User A: Nhìn thấy real-time update**
- **Tại payment page sau khi User B thanh toán thành công:**
  
  **Expected Behavior:**
  ✅ Toast error hiển thị: `⚠️ Ghế A4 không còn trống!` (10 giây)
  ✅ Alert box hiển thị red warning: "Ghế A4 đã được người khác đặt!"
  ✅ Payment button bị disable (grayed out)
  ✅ Button text đổi thành: "❌ Không thể thanh toán"
  ✅ User click button sẽ không call API, chỉ show toast error

#### 6. **Browser DevTools Verification**
- **Network tab:**
  - Không có new HTTP request khi socket update nhận được
  - Socket.IO frame hiển thị `42["show:seats-update", {...}]`

- **Console:**
  ```javascript
  // Socket events log
  [show:join] User joined room show:{showId}
  [show:seats-update] {booked: [{seatId: "...", userId: "user-b"}], ...}
  ```

- **Redux DevTools / Application State:**
  - `seatsConflict: ["A4-seat-id"]`
  - `conflictWarning: "Ghế A4 đã được người khác đặt!"`

#### 7. **Alternatives Test: No Conflict**
- Nếu User B chọn ghế **A5** thay vì A4:
  - **Expected:** Không có alert, payment button vẫn enabled
  - User A có thể tiếp tục thanh toán

---

## Implementation Checklist ✅

- [x] Payment page import `getSocket` từ `@/lib/socket`
- [x] Socket connection: `socket.emit('show:join', showId)`  
- [x] Socket listener: `socket.on('show:seats-update', handleSeatsUpdate)`
- [x] Conflict detection: Filter booked seats từ other users
- [x] State management: `seatsConflict`, `conflictWarning`
- [x] UI warning alert component with AlertTriangle icon
- [x] Disable payment button nếu conflict
- [x] Toast notification 1 lần khi conflict phát hiện
- [x] Cleanup: `socket.off('show:seats-update')` on unmount

---

## Possible Issues & Debug

### Issue 1: Socket không connect
**Sign:** Browser console không thấy socket events
**Debug:**
```javascript
// In browser console
const socket = window.__socket__ || io();
console.log('Connected:', socket.connected);
console.log('Room:', socket.rooms);
```
**Fix:** Check `getSocket()` implementation, ensure token in localStorage

### Issue 2: `show:seats-update` không nhận
**Sign:** Payment page không update UI
**Debug:**
- Check backend terminal log: `io.to('show:..').emit()`
- Verify `showId` match in room emission
- Check Redux state: `booking.showId`

**Fix:** Ensure `show:join` emit với đúng `showId`, backend emit vào đúng room

### Issue 3: Multiple toasts appear
**Sign:** Toast hiển thị nhiều lần
**Debug:** Check if `if (seatsConflict.length === 0)` guard working
**Fix:** Ensure toast guard exists in conflict detection

---

## Performance Monitoring

Track socket events in monitoring:
- Event: `show:seats-update` received
- Latency: Time từ backend emit → frontend receive
- Payload size: Typical 200-500 bytes
- Frequency: ~1 per payment confirmation

---

## Deployment Checklist

- [ ] Frontend production build test
- [ ] Socket connection persistence across navigation
- [ ] Cleanup listeners on component unmount
- [ ] Error handling for socket disconnection
- [ ] Toast message localization (if needed)
- [ ] Verify with actual VNPay payment (not always reliable in sandbox)

