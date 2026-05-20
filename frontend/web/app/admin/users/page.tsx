'use client';

import { useState } from 'react';
import { Loader2, Users, Search, Plus, Trash2, Shield, Calendar, Mail, Phone, CheckCircle, UserX } from 'lucide-react';

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample seed & real user accounts for display
  const sampleUsers = [
    { id: '1', name: 'Admin RoPhim', email: 'admin@gmail.com', phone: '0900000000', role: 'ADMIN', createdAt: '2026-05-01T12:00:00Z', isActive: true },
    { id: '2', name: 'Khách hàng mẫu', email: 'user@gmail.com', phone: '0911111111', role: 'USER', createdAt: '2026-05-10T15:30:00Z', isActive: true },
    { id: '3', name: 'Nguyễn Văn Minh', email: 'vanminh@gmail.com', phone: '0988776655', role: 'USER', createdAt: '2026-05-12T09:15:00Z', isActive: true },
    { id: '4', name: 'Trần Thị Hạnh', email: 'thihanh.tran@gmail.com', phone: '0905123456', role: 'USER', createdAt: '2026-05-15T18:45:00Z', isActive: true },
    { id: '5', name: 'Phạm Đức Anh', email: 'ducanh99@gmail.com', phone: '0932889900', role: 'USER', createdAt: '2026-05-16T22:10:00Z', isActive: false },
  ];

  const filteredUsers = sampleUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Quản lý Khách hàng</h2>
          <p className="text-muted-foreground mt-1">Quản lý danh sách thành viên và phân quyền trong hệ thống</p>
        </div>
        <button
          onClick={() => alert('Thêm quản trị viên/khách hàng mới đang được phát triển.')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Thêm thành viên
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card/40 border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{sampleUsers.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tổng số thành viên</p>
          </div>
        </div>

        <div className="bg-card/40 border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {sampleUsers.filter(u => u.isActive).length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Tài khoản đang hoạt động</p>
          </div>
        </div>

        <div className="bg-card/40 border border-border p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {sampleUsers.filter(u => !u.isActive).length}
            </p>
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {/* Dynamic Avatar with elegant gradient */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-rose-500/20 border border-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">ID: #{user.id}</div>
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
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
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
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}>
                      {user.isActive ? 'Đang hoạt động' : 'Đang Khóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => alert('Thay đổi quyền vai trò sẽ được tích hợp trong bản cập nhật tới.')}
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg transition-all"
                      >
                        Phân quyền
                      </button>
                      <button 
                        onClick={() => alert('Khóa tài khoản này sẽ được thực hiện trong bản cập nhật tới.')}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all"
                        title={user.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                      >
                        <UserX className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
