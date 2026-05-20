'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  useGetAdminMoviesQuery,
  useDeleteMovieMutation,
} from '@/store/api/adminMovieAPI';
import {
  setMovieModalOpen,
  setSelectedMovieId,
  setMovieSearchQuery,
  setMoviePageNum,
} from '@/store/slice/adminSlice';
import { toast } from 'sonner';

export default function AdminMovies() {
  const dispatch = useDispatch();
  
  const ensureArray = (val: any): string[] => {
    if (!val) return [];
    if (typeof val === 'string') {
      let trimmed = val.trim();
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        trimmed = trimmed.substring(1, trimmed.length - 1).trim();
      }
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          return ensureArray(parsed);
        } catch (e) { }
      }
      return trimmed.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    if (Array.isArray(val)) {
      return val.flatMap(item => ensureArray(item));
    }
    return [];
  };

  const {
    movieSearchQuery,
    moviePageNum,
  } = useSelector((state: RootState) => state.admin);

  const { data: moviesData, isLoading } = useGetAdminMoviesQuery({
    page: moviePageNum,
    limit: 10,
    search: movieSearchQuery,
  });

  const [deleteMovie] = useDeleteMovieMutation();

  const handleDeleteMovie = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phim này không?')) {
      try {
        await deleteMovie(id).unwrap();
        toast.success('Đã xóa phim thành công!');
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error?.data?.message || 'Có lỗi xảy ra khi xóa phim.');
      }
    }
  };

  const handleOpenForm = (id?: string) => {
    if (id) {
      dispatch(setSelectedMovieId(id));
    }
    dispatch(setMovieModalOpen(true));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Phim</h2>
          <p className="text-muted-foreground mt-1">Quản lý phim trong hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20"
        >
          + Thêm phim
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={movieSearchQuery}
          onChange={(e) => dispatch(setMovieSearchQuery(e.target.value))}
          placeholder="Tìm kiếm phim..."
          className="flex-1 px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
        />
      </div>

      {/* Movies Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
             Đang tải...
          </div>
        ) : !moviesData || moviesData.movies.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Không tìm thấy phim
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">
                      Tên phim
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">
                      Thời lượng
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">
                      Thể loại
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground text-center">
                      Suất chiếu
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">
                      Trạng thái
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {moviesData.movies.map((movie) => (
                    <tr key={movie.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-foreground font-medium">
                        {movie.title}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {movie.duration} phút
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        <div className="flex gap-1 flex-wrap">
                          {ensureArray(movie.genre).slice(0, 2).map((g) => (
                            <span
                              key={g}
                              className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded border border-primary/30 uppercase tracking-tighter"
                            >
                              {g}
                            </span>
                          ))}
                          {ensureArray(movie.genre).length > 2 && (
                            <span className="text-muted-foreground text-xs font-medium">
                              +{ensureArray(movie.genre).length - 2} thêm
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground text-center font-bold">
                        {movie.showCount || 0}
                      </td>
                       <td className="py-4 px-6 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            movie.isActive
                              ? 'bg-green-500/20 text-green-500 border-green-500/30'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {movie.isActive ? 'Đang chiếu' : 'Ngừng chiếu'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenForm(movie.id)}
                            className="px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-xs font-medium border border-primary/30"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(movie.id)}
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

            {/* Pagination */}
            <div className="bg-muted border-t border-border p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Trang {moviePageNum} / {moviesData.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={moviePageNum === 1}
                  onClick={() => dispatch(setMoviePageNum(moviePageNum - 1))}
                  className="px-4 py-1.5 border border-border rounded-lg hover:bg-card transition-colors disabled:opacity-50 text-foreground text-sm font-medium"
                >
                  Trước
                </button>
                <button
                  disabled={moviePageNum >= moviesData.pagination.totalPages}
                  onClick={() => dispatch(setMoviePageNum(moviePageNum + 1))}
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
