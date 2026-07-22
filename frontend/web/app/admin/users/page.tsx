'use client';

import { useState } from 'react';
import { Users, Search, Shield, Calendar, Mail, Phone, CheckCircle, UserX, Loader2 } from 'lucide-react';
import { useGetAdminUsersQuery, useToggleUserActiveMutation } from '@/store/api/adminUserAPI';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useGetAdminUsersQuery({
    page,
    limit: 20,
    search: searchQuery || undefined
  });

  const [toggleActive, { isLoading: isToggling }] = useToggleUserActiveMutation();

  const handleToggleActive = async (userId: string) => {
    try {
      const result = await toggleActive(userId).unwrap();
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể thay đổi trạng thái tài khoản');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-destructive/5 rounded-xl border border-destructive/20">
        <div className="text-destructive text-4xl">⚠️</div>
        <p className="text-destructive font-medium">Lỗi tải dữ liệu người dùng</p>
      </div>
    );
  }

  const users = data?.users || [];
  const stats = data?.stats || { total: 0, active: 0, locked: 0 };
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Quản lý Khách hàng</h2>
          <p className="text-muted-foreground mt-1">Quản lý danh sách thành viên và phân quyền trong hệ thống</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card/40 border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tổng số thành viên</p>
          </div>
        </div>

        <div className="bg-card/40 border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{stats.active}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tài khoản đang hoạt động</p>
          </div>
        </div>

        <div className="bg-card/40 border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-cinema-gold/10 rounded-xl text-cinema-gold">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{stats.locked}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tài khoản bị khóa</p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Tìm kiếm theo họ tên, email hoặc số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="bg-card/30 border border-border rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <th className="px-6 py-4">Hội viên</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Ngày gia nhập</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-cinema-gold/20 border border-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{user.name || 'Chưa cập nhật'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {user._count.bookings} đơn đặt vé
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary/60" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary/60" />
                      <span>{user.phone || 'Chưa cập nhật'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      user.role === 'ADMIN' 
                        ? 'bg-cinema-gold/10 text-cinema-gold border border-cinema-gold/20' 
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      <Shield className="h-3.5 w-3.5" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary/60" />
                      <span>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      user.isActive 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-cinema-gold/10 text-cinema-gold border border-cinema-gold/20'
                    }`}>
                      {user.isActive ? 'Đang hoạt động' : 'Đang Khóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleToggleActive(user.id)}
                        disabled={isToggling}
                        className={`p-1.5 rounded-lg transition-all ${
                          user.isActive
                            ? 'text-muted-foreground hover:text-cinema-gold hover:bg-cinema-gold/10'
                            : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'
                        }`}
                        title={user.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-xs font-bold border border-border rounded-xl hover:bg-muted/20 disabled:opacity-40 transition-all"
          >
            Trước
          </button>
          <span className="text-sm text-muted-foreground px-4">
            {page} / {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-xs font-bold border border-border rounded-xl hover:bg-muted/20 disabled:opacity-40 transition-all"
          >
            Tiếp
          </button>
        </div>
      )}
    </div>
  );
}
