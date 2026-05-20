'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { User, Mail, ShieldAlert, Award, Calendar, DollarSign, Sparkles, MapPin, Phone, LogIn, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#06060a] text-white flex items-center justify-center px-6 pt-24 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.08),transparent_50%)]" />
        <Card className="w-full max-w-md bg-[#0d0d15]/90 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10">
          <CardContent className="p-8 text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold uppercase tracking-tight">Yêu cầu đăng nhập</h2>
              <p className="text-xs text-white/50 leading-relaxed">Vui lòng đăng nhập tài khoản của bạn để truy cập trang cá nhân và xem các thông tin thành viên đặc quyền.</p>
            </div>
            <Link href="/login" className="w-full">
              <Button className="w-full py-6 rounded-2xl bg-gradient-to-r from-primary to-[#ff4b4b] text-white font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" /> Đăng nhập ngay
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060a] text-white pt-28 pb-16 px-6 md:px-10 max-w-[1400px] mx-auto relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.06),transparent_50%)]" />
      <div className="absolute top-[20%] left-[-10%] w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Breadcrumb / Back Button */}
      <div className="relative z-10 mb-8 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-white/60 hover:text-white hover:bg-white/5 gap-2 rounded-xl text-xs font-bold uppercase tracking-wider"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </Button>
        <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 uppercase px-3 py-1 font-bold text-[10px] tracking-widest rounded-lg flex items-center gap-1.5 shadow-lg shadow-primary/10">
          <Sparkles className="w-3 h-3 animate-pulse" /> Thành viên đặc quyền
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left Card - Quick Avatar & Tier Info */}
        <div className="space-y-6">
          <Card className="bg-[#0d0d15]/80 border border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-primary/30 to-[#ff4b4b]/10 blur-xl opacity-30" />
            <CardContent className="p-8 text-center flex flex-col items-center relative z-10">
              <div className="relative group mb-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-[#ff4b4b] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <Avatar className="h-24 w-24 rounded-full border-4 border-[#0d0d15] relative z-10 shadow-2xl">
                  <AvatarFallback className="bg-gradient-to-tr from-primary/30 to-primary text-white text-3xl font-extrabold uppercase">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-1 line-clamp-1">
                {user.name || 'Người dùng RoPhim'}
              </h3>
              <p className="text-xs font-semibold text-white/40 mb-4">{user.email}</p>

              <Badge className="bg-gradient-to-r from-[#fceabb] to-[#f8d49d] text-zinc-950 px-4 py-1.5 rounded-full font-extrabold uppercase text-[10px] tracking-wider border-none shadow-xl">
                Cấp độ: Vàng (Gold)
              </Badge>

              <div className="w-full border-t border-white/5 my-6" />

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-1">Điểm thưởng</span>
                  <span className="text-lg font-black text-white">2,500 <span className="text-xs font-bold text-primary">R-pts</span></span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider block mb-1">Chi tiêu</span>
                  <span className="text-lg font-black text-white">1.8Mđ</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exclusive Vouchers preview */}
          <Card className="bg-[#0d0d15]/50 border border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Voucher Độc Quyền</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-white block uppercase">VOUCHER 20% OFF</span>
                    <span className="text-[10px] text-white/40 block mt-0.5">Hạn dùng: 31/12/2026</span>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary text-[9px] font-black tracking-wider uppercase px-2 py-0.5">GIAM20</Badge>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl opacity-60">
                  <div>
                    <span className="text-xs font-bold text-white block uppercase">COMBO BẮP NƯỚC FREE</span>
                    <span className="text-[10px] text-white/40 block mt-0.5">Áp dụng khi mua từ 2 vé</span>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white/60 text-[9px] font-black tracking-wider uppercase px-2 py-0.5">FREEPOP</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Cards - Detailed Info & Loyalty Level details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#0d0d15]/80 border border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wide">Thông tin tài khoản</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">Thông tin cá nhân & Quản lý bảo mật</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      readOnly 
                      value={user.name || 'Người dùng RoPhim'} 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-primary/50" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Hòm thư điện tử</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="email" 
                      readOnly 
                      value={user.email} 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      readOnly 
                      value={user.phone || '090 123 4567'} 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Khu vực ưu thích</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      readOnly 
                      value="TP. Hồ Chí Minh" 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-white/5 pt-4" />

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/5 border border-white/5 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Trạng thái bảo mật</span>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Tài khoản đã được xác thực an toàn</span>
                  </div>
                </div>
                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider px-6 py-2.5 h-auto transition-all">Đổi mật khẩu</Button>
              </div>
            </CardContent>
          </Card>

          {/* Membership tier benefits progress */}
          <Card className="bg-[#0d0d15]/80 border border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wide">Tiến trình nâng cấp hội viên</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">Đặt thêm vé để thăng hạng Platinum nhận thêm ưu đãi</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/40">VÀNG (GOLD)</span>
                  <span className="text-primary font-black">75% (Còn 200,000đ nữa)</span>
                  <span className="text-white/40">BẠCH KIM (PLATINUM)</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-primary to-[#ff4b4b] rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]" style={{ width: '75%' }} />
                </div>
                <p className="text-[10px] text-white/40 italic leading-relaxed text-center">Đặc quyền hội viên Platinum: Tích lũy 10% điểm thưởng trên mọi giao dịch, tặng bắp nước miễn phí vào ngày sinh nhật, được ưu tiên đặt trước các phim bom tấn hot nhất.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
