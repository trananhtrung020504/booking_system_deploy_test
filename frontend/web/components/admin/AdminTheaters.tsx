'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useGetAdminTheatersQuery, useDeleteTheaterMutation } from '@/store/api/adminTheaterAPI';
import { setTheaterPageNum, setTheaterSearchQuery, setTheaterModalOpen, setSelectedTheaterId } from '@/store/slice/adminSlice';
import { Building } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTheaters() {
  const dispatch = useDispatch();
  const { theaterPageNum, theaterSearchQuery } = useSelector(
    (state: RootState) => state.admin
  );

  const { data: theatersData, isLoading } = useGetAdminTheatersQuery({
    page: theaterPageNum,
    limit: 10,
    search: theaterSearchQuery,
  });

  const [deleteTheater] = useDeleteTheaterMutation();

  const handleOpenForm = (id?: string) => {
    if (id) {
      dispatch(setSelectedTheaterId(id));
    }
    dispatch(setTheaterModalOpen(true));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa rạp này không?')) {
      try {
        await deleteTheater(id).unwrap();
        toast.success('Đã xóa rạp thành công!');
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error?.data?.message || 'Có lỗi xảy ra khi xóa rạp.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rạp chiếu</h2>
          <p className="text-muted-foreground mt-1">Quản lý các địa điểm rạp chiếu</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20"
        >
          + Thêm rạp
        </button>
      </div>

      <input
        type="text"
        placeholder="Tìm kiếm rạp..."
        value={theaterSearchQuery}
        onChange={(e) => dispatch(setTheaterSearchQuery(e.target.value))}
        className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
      />

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
             Đang tải...
          </div>
        ) : !theatersData?.theaters.length ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">Không tìm thấy rạp</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Tên rạp</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Thành phố</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Vị trí</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground text-center">Suất chiếu</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-foreground">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {theatersData.theaters.map((theater) => (
                    <tr key={theater.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {theater.logo?.source ? (
                              <img src={theater.logo.source} alt="Logo" className="h-full w-full object-contain p-1" />
                            ) : (
                              <Building className="h-5 w-5 text-muted-foreground opacity-50" />
                            )}
                          </div>
                          <div className="font-bold text-foreground">{theater.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{theater.city}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{theater.location}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground text-center font-bold">{theater.activeShowsCount}</td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenForm(theater.id)}
                            className="px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-xs font-medium border border-primary/30"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={() => handleDelete(theater.id)}
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
              <span className="text-sm text-muted-foreground">Trang {theaterPageNum} / {theatersData.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={theaterPageNum === 1}
                  onClick={() => dispatch(setTheaterPageNum(theaterPageNum - 1))}
                  className="px-4 py-1.5 border border-border rounded-lg hover:bg-card transition-colors disabled:opacity-50 text-foreground text-sm font-medium"
                >
                  Trước
                </button>
                <button
                  disabled={theaterPageNum >= theatersData.pagination.totalPages}
                  onClick={() => dispatch(setTheaterPageNum(theaterPageNum + 1))}
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
