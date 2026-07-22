'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useGetBookingsReportQuery,
  useGetDashboardStatsQuery,
  useGetRevenueReportQuery,
} from '@/store/api/adminBookingAPI';
import { formatCurrency } from '@/lib/utils';
import StatsCard from './components/StatsCard';
import { BarChart, LineMetricChart, StatusChart } from './components/Chart';
import { TrendingUp, Users, Film, Ticket, Theater, Calendar, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const reportParams = dateFrom || dateTo ? { dateFrom, dateTo } : undefined;

  const { data: stats, isLoading, error } = useGetDashboardStatsQuery(reportParams);
  const { data: revenueReport } = useGetRevenueReportQuery(reportParams);
  const { data: bookingsByDate } = useGetBookingsReportQuery({ ...reportParams, groupBy: 'date' });
  const { data: bookingsByStatus } = useGetBookingsReportQuery({ ...reportParams, groupBy: 'status' });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-destructive/5 rounded-xl border border-destructive/20">
        <div className="text-destructive text-4xl">!</div>
        <p className="text-destructive font-medium">Lỗi tải dữ liệu dashboard</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground bg-card rounded-xl border border-border">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="relative bg-gradient-to-r from-[#fff0b8] via-[#d8a94f] to-[#9b6b24] rounded-[2rem] p-8 md:p-10 overflow-hidden shadow-2xl shadow-primary/20">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-4xl font-bold text-white mb-3">Bảng điều hành RoPhim</h2>
          <p className="text-white/80 mb-8 font-medium text-lg leading-relaxed">
            Theo dõi doanh thu, đơn đặt vé, người dùng và hiệu quả vận hành từ dữ liệu thực tế trong hệ thống.
          </p>
          <Link href="/admin/bookings" className="inline-flex px-8 py-3 bg-white text-primary rounded-2xl font-bold hover:bg-white/90 transition-all shadow-xl shadow-black/10 uppercase tracking-wider text-sm">
            Xem đơn đặt vé
          </Link>
        </div>
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block opacity-20 transform rotate-12 scale-150">
          <TrendingUp className="w-64 h-64 text-white" />
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#1E1910]/58 rounded-full blur-[100px]" />
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between bg-card/40 backdrop-blur-md p-6 rounded-[2rem] border border-border/50">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Khoảng thời gian báo cáo</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Hiển thị thống kê tài chính và tỷ lệ đặt vé theo ngày</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-40 pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-xs cursor-pointer"
            />
          </div>
          <span className="text-muted-foreground text-xs font-bold">đến</span>
          <div className="relative flex-1 sm:flex-initial">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-40 pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-xs cursor-pointer"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all border border-destructive/20"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatsCard
          label="Tổng người dùng"
          value={stats.stats.users.toLocaleString()}
          color="blue"
          icon={<Users className="h-5 w-5" />}
          trend={stats.trends?.users != null ? `${stats.trends.users > 0 ? '+' : ''}${stats.trends.users}%` : 'N/A'}
          trendIsDown={stats.trends?.users != null ? stats.trends.users < 0 : false}
          trendIsUnavailable={stats.trends?.users == null}
        />
        <StatsCard
          label="Tổng doanh thu"
          value={formatCurrency(stats.stats.transactions.totalRevenue)}
          color="gold"
          icon={<DollarSign className="h-5 w-5" />}
          trend={stats.trends?.revenue != null ? `${stats.trends.revenue > 0 ? '+' : ''}${stats.trends.revenue}%` : 'N/A'}
          trendIsDown={stats.trends?.revenue != null ? stats.trends.revenue < 0 : false}
          trendIsUnavailable={stats.trends?.revenue == null}
        />
        <StatsCard
          label="Đặt vé xác nhận"
          value={stats.stats.bookings.confirmed}
          color="green"
          icon={<Ticket className="h-5 w-5" />}
          trend={stats.trends?.bookings != null ? `${stats.trends.bookings > 0 ? '+' : ''}${stats.trends.bookings}%` : 'N/A'}
          trendIsDown={stats.trends?.bookings != null ? stats.trends.bookings < 0 : false}
          trendIsUnavailable={stats.trends?.bookings == null}
        />
        <StatsCard
          label="Tổng đơn đặt vé"
          value={stats.stats.bookings.total}
          color="purple"
          icon={<Film className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <LineMetricChart
            title="Doanh thu theo ngày"
            subtitle="Tổng giao dịch đã thanh toán trong khoảng thời gian đang chọn"
            valueType="currency"
            color="gold"
            data={(revenueReport?.summary.byDate || []).map((item) => ({
              label: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
              value: item.amount,
            }))}
          />
        </div>
        <StatusChart
          title="Trạng thái đặt vé"
          subtitle="Phân bổ trạng thái booking từ dữ liệu hệ thống"
          data={(bookingsByStatus?.data || []).map((item) => ({
            label: item.status || 'UNKNOWN',
            value: item.count,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <BarChart
          title="Đơn đặt vé theo ngày"
          subtitle="Số booking được tạo trong khoảng thời gian đang chọn"
          color="green"
          data={(bookingsByDate?.data || []).map((item) => ({
            label: item.date ? new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'N/A',
            value: item.count,
          }))}
        />
        <BarChart
          title="Doanh thu theo phim nổi bật"
          subtitle="Tính từ các booking đã xác nhận trong thống kê tổng quan"
          valueType="currency"
          color="primary"
          data={stats.topMovies.map((movie) => ({
            label: movie.title,
            value: movie.revenue,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/50 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Phim nổi bật</h3>
             </div>
             <Link href="/admin/movies" className="text-xs font-bold text-primary hover:underline">Tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left py-4 px-8 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tên phim</th>
                  <th className="text-center py-4 px-8 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vé</th>
                  <th className="text-right py-4 px-8 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {stats.topMovies.length > 0 ? stats.topMovies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="py-5 px-8 text-sm font-bold text-foreground group-hover:text-primary transition-colors">{movie.title}</td>
                    <td className="py-5 px-8 text-sm text-center font-bold text-muted-foreground">{movie.bookings}</td>
                    <td className="py-5 px-8 text-sm font-bold text-cinema-gold text-right">{formatCurrency(movie.revenue)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu phim</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/50 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Theater className="h-6 w-6 text-cinema-gold" />
                <h3 className="text-xl font-bold text-foreground">Rạp hiệu quả</h3>
             </div>
             <Link href="/admin/theaters" className="text-xs font-bold text-cinema-gold hover:underline">Tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left py-4 px-8 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tên rạp</th>
                  <th className="text-center py-4 px-8 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vé</th>
                  <th className="text-right py-4 px-8 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {stats.topTheaters.length > 0 ? stats.topTheaters.map((theater) => (
                  <tr key={theater.id} className="hover:bg-cinema-gold/5 transition-colors group">
                    <td className="py-5 px-8">
                      <div className="text-sm font-bold text-foreground group-hover:text-cinema-gold transition-colors">{theater.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">{theater.city}</div>
                    </td>
                    <td className="py-5 px-8 text-sm text-center font-bold text-muted-foreground">{theater.bookings}</td>
                    <td className="py-5 px-8 text-sm font-bold text-cinema-gold text-right">{formatCurrency(theater.revenue)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu rạp</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
