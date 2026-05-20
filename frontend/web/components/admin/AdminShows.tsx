'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useGetAdminShowsQuery, useDeleteShowMutation } from '@/store/api/adminShowAPI';
import { useGetAdminMoviesQuery } from '@/store/api/adminMovieAPI';
import { useGetAdminTheatersQuery } from '@/store/api/adminTheaterAPI';
import { setShowModalOpen, setSelectedShowId, setShowPageNum, setShowFilterMovieId, setShowFilterTheaterId } from '@/store/slice/adminSlice';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminShows() {
  const dispatch = useDispatch();
  const { showPageNum, showFilterMovieId, showFilterTheaterId } = useSelector((state: RootState) => state.admin);

  const { data: moviesData } = useGetAdminMoviesQuery({ limit: 100 });
  const { data: theatersData } = useGetAdminTheatersQuery({ limit: 100 });

  const { data: showsData, isLoading } = useGetAdminShowsQuery({
    page: showPageNum,
    limit: 10,
    movieId: showFilterMovieId || undefined,
    theaterId: showFilterTheaterId || undefined,
  });

  const [deleteShow] = useDeleteShowMutation();

  const handleOpenForm = (id?: string) => {
    if (id) {
      dispatch(setSelectedShowId(id));
    }
    dispatch(setShowModalOpen(true));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa suất chiếu này không?')) {
      try {
        await deleteShow(id).unwrap();
        toast.success('Đã xóa suất chiếu thành công!');
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error?.data?.message || 'Có lỗi xảy ra khi xóa suất chiếu.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Suất chiếu</h2>
          <p className="text-muted-foreground mt-1">Quản lý các suất chiếu phim trong hệ thống</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20"
        >
          + Thêm suất chiếu
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card/50 p-4 rounded-xl border border-border mb-6">
        {/* Movie select dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lọc theo phim</label>
          <select
            value={showFilterMovieId || ''}
            onChange={(e) => dispatch(setShowFilterMovieId(e.target.value || null))}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer"
          >
            <option value="">Tất cả phim</option>
            {moviesData?.movies.map(movie => (
              <option key={movie.id} value={movie.id}>{movie.title}</option>
            ))}
          </select>
        </div>

        {/* Theater select dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lọc theo rạp</label>
          <select
            value={showFilterTheaterId || ''}
            onChange={(e) => dispatch(setShowFilterTheaterId(e.target.value || null))}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer"
          >
            <option value="">Tất cả rạp</option>
            {theatersData?.theaters.map(theater => (
              <option key={theater.id} value={theater.id}>{theater.name} ({theater.city})</option>
            ))}
          </select>
        </div>

        {/* Reset button */}
        <div className="flex items-end">
          <button
            onClick={() => {
              dispatch(setShowFilterMovieId(null));
              dispatch(setShowFilterTheaterId(null));
            }}
            className="w-full px-4 py-2.5 border border-border text-foreground rounded-xl hover:bg-muted hover:text-foreground transition-all font-bold text-sm"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
             Đang tải...
          </div>
        ) : !showsData?.shows.length ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">Không tìm thấy suất chiếu</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Phim</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Rạp</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Thời gian bắt đầu</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground text-center">Đặt vé</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Trạng thái</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {showsData.shows.map((show) => (
                    <tr key={show.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-foreground">{show.movie.title}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{show.theater.name}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {format(new Date(show.startTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground text-center font-bold">{show.bookingsCount}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          show.isActive 
                            ? 'bg-green-500/20 text-green-500 border-green-500/30' 
                            : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {show.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenForm(show.id)}
                            className="px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-xs font-medium border border-primary/30"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={() => handleDelete(show.id)}
                            className="px-2 py-1 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors text-xs font-medium border border-destructive/30"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-muted border-t border-border p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trang {showPageNum} / {showsData.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={showPageNum === 1}
                  onClick={() => dispatch(setShowPageNum(showPageNum - 1))}
                  className="px-4 py-1.5 border border-border rounded-lg hover:bg-card transition-colors disabled:opacity-50 text-foreground text-sm font-medium"
                >
                  Trước
                </button>
                <button
                  disabled={showPageNum >= showsData.pagination.totalPages}
                  onClick={() => dispatch(setShowPageNum(showPageNum + 1))}
                  className="px-4 py-1.5 border border-border rounded-lg hover:bg-card transition-colors disabled:opacity-50 text-foreground text-sm font-medium"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
