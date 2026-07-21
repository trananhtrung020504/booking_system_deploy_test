'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useGetAdminBookingsQuery } from '@/store/api/adminBookingAPI';
import { setBookingPageNum, setBookingFilterStatus, setBookingDetailOpen, setSelectedBookingId } from '@/store/slice/adminSlice';
import { formatCurrency } from '@/lib/utils';
import { Ticket, Search, XCircle, CheckCircle, Clock, Eye, Calendar, X } from 'lucide-react';
import BookingDetailModal from './components/BookingDetailModal';

export default function AdminBookings() {
  const dispatch = useDispatch();
  const { bookingPageNum, bookingFilterStatus, bookingDetailOpen, selectedBookingId } = useSelector(
    (state: RootState) => state.admin
  );

  const [searchVal, setSearchVal] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
      dispatch(setBookingPageNum(1));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchVal, dispatch]);

  const { data: bookingsData, isLoading } = useGetAdminBookingsQuery({
    page: bookingPageNum,
    limit: 10,
    status: bookingFilterStatus as any,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const handleOpenDetail = (id: string) => {
    dispatch(setSelectedBookingId(id));
    dispatch(setBookingDetailOpen(true));
  };

  const handleClearFilters = () => {
    setSearchVal('');
    dispatch(setBookingFilterStatus(null));
    setDateFrom('');
    setDateTo('');
    dispatch(setBookingPageNum(1));
  };

  const getStatusLabel = (status: string) => {
    if (status === 'CONFIRMED') return 'Thành công';
    if (status === 'PENDING') return 'Chờ thanh toán';
    if (status === 'EXPIRED') return 'Hết hạn';
    return 'Đã hủy';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Đặt vé</h2>
          <p className="text-muted-foreground mt-1">Xem và quản lý các giao dịch đặt vé của khách hàng</p>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card/50 p-4 rounded-xl border border-border">
        {/* Debounced Search */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo mã vé, tên hoặc email..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Trạng thái</label>
          <select
            value={bookingFilterStatus || ''}
            onChange={(e) => dispatch(setBookingFilterStatus(e.target.value || null))}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer appearance-none"
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="CONFIRMED">Thành công</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            className="w-full px-4 py-2.5 border border-border text-foreground rounded-xl hover:bg-muted hover:text-foreground transition-all font-bold text-sm flex items-center justify-center gap-1.5"
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </button>
        </div>

        {/* Date From */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Từ ngày</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                dispatch(setBookingPageNum(1));
              }}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Đến ngày</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                dispatch(setBookingPageNum(1));
              }}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Đang tải dữ liệu...
          </div>
        ) : !bookingsData?.bookings.length ? (
          <div className="flex flex-col items-center justify-center h-96 text-muted-foreground space-y-4">
            <Ticket className="h-12 w-12 opacity-20" />
            <p>Không tìm thấy đặt vé nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase">Mã vé</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase">Khách hàng</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase">Phim</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase text-center">Ghế</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase">Tổng tiền</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase">Trạng thái</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-foreground uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookingsData.bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-bold text-primary font-mono">{booking.bookingRef}</td>
                      <td className="py-4 px-6 text-sm">
                        <div className="text-foreground font-medium truncate max-w-[150px]">{booking.user.name || 'N/A'}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{booking.user.email}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground font-medium">{booking.show.movie.title}</td>
                      <td className="py-4 px-6 text-sm text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-[100px] mx-auto">
                          {booking.seats?.map(s => (
                            <span key={s.id} className="bg-muted px-1.5 py-0.5 rounded text-[10px] border border-border font-bold">
                              {s.row}{s.column}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-cinema-gold">{formatCurrency(booking.total)}</td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          {booking.status === 'CONFIRMED' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                          {booking.status === 'PENDING' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                          {(booking.status === 'CANCELLED' || booking.status === 'EXPIRED') && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            booking.status === 'CONFIRMED'
                              ? 'text-green-500'
                              : booking.status === 'PENDING'
                              ? 'text-amber-500'
                              : 'text-destructive'
                          }`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <button
                          onClick={() => handleOpenDetail(booking.id)}
                          className="px-3 py-1.5 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-all text-xs font-bold border border-primary/30 flex items-center gap-1 shadow-sm shadow-primary/5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-muted border-t border-border p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trang {bookingPageNum} / {bookingsData.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={bookingPageNum === 1}
                  onClick={() => dispatch(setBookingPageNum(bookingPageNum - 1))}
                  className="px-4 py-1.5 border border-border rounded-lg hover:bg-card transition-colors disabled:opacity-50 text-foreground text-sm font-medium"
                >
                  Trước
                </button>
                <button
                  disabled={bookingPageNum >= bookingsData.pagination.totalPages}
                  onClick={() => dispatch(setBookingPageNum(bookingPageNum + 1))}
                  className="px-4 py-1.5 border border-border rounded-lg hover:bg-card transition-colors disabled:opacity-50 text-foreground text-sm font-medium"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mount Booking Detail Modal */}
      {bookingDetailOpen && selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => dispatch(setBookingDetailOpen(false))}
        />
      )}
    </div>
  );
}
