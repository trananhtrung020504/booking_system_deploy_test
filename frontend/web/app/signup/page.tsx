'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Mail, User, Phone, Lock, ArrowRight, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignupMutation, useSendOtpMutation } from '@/store/api/authAPI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slice/authSlice';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  const [signup, { isLoading }] = useSignupMutation();
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpHash, setOtpHash] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handledRedirect = useRef(false);

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      width: (Math.floor(Math.random() * 3) + 1) + 'px',
      height: (Math.floor(Math.random() * 3) + 1) + 'px',
      left: (Math.floor(Math.random() * 100)) + '%',
      top: (Math.floor(Math.random() * 100)) + '%',
      delay: (Math.random() * 5).toFixed(2) + 's',
      duration: (Math.floor(Math.random() * 10) + 10) + 's'
    }));
    setParticles(newParticles);
    setMounted(true);

    if (isAuthenticated && !handledRedirect.current) {
      handledRedirect.current = true;
      const pendingBooking = sessionStorage.getItem('pending_booking');
      if (pendingBooking) {
        const { showId, seats } = JSON.parse(pendingBooking);
        sessionStorage.removeItem('pending_booking');
        router.replace(`/payment?showId=${showId}&seats=${seats.join(',')}`);
      } else {
        router.replace('/');
      }
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.name || !formData.phone || !formData.password || !formData.confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return false;
    }
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (!/^[0-9]{10,}$/.test(formData.phone)) {
      toast.error('Số điện thoại phải có ít nhất 10 chữ số');
      return false;
    }
    if (formData.password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return false;
    }
    return true;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const result = await sendOtp({ email: formData.email }).unwrap();
      setOtpHash(result.hash);
      setIsOtpSent(true);
      setResendCooldown(60);
      toast.success('Mã xác thực OTP đã được gửi tới email của bạn!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
    }
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 4) {
      toast.error('Vui lòng nhập đúng mã OTP gồm 4 chữ số');
      return;
    }

    try {
      const result = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        otp: otpCode,
        hash: otpHash
      }).unwrap();
      dispatch(setUser(result.user));
      toast.success('Gia nhập RoPhim thành công!');
      // Việc redirect sẽ được xử lý tự động bởi useEffect khi isAuthenticated chuyển thành true.
    } catch (error: any) {
      toast.error(error?.data?.message || 'Đăng ký tài khoản thất bại hoặc mã OTP không chính xác');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050507]">
      <div 
        className="absolute inset-0 z-0 scale-110 animate-subtle-zoom"
        style={{
          backgroundImage: 'url(/login-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3) contrast(1.2)'
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#050507]/60 to-[#050507]" />
      
      <button 
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-primary/40 transition-all group"
      >
        <Film className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Trang Chủ</span>
      </button>

      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {mounted && particles.map((p) => (
          <div 
            key={p.id}
            className="absolute bg-white/20 rounded-full blur-xl animate-float-particle"
            style={{
              width: p.width,
              height: p.height,
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration
            }}
          />
        ))}
      </div>

      <div className="relative z-20 w-full max-w-[460px] px-6 py-4">
        <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#1E1910]/64 backdrop-blur-[30px] p-6 md:p-8 shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all duration-700 hover:border-primary/40">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cinema-gold/5 pointer-events-none" />

          <div className="relative space-y-4">
            <div className="text-center space-y-2">
              <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 rounded-xl rotate-12" />
                <div className="relative w-9 h-9 bg-[#12121a] border border-white/10 rounded-lg flex items-center justify-center">
                  <Film className="h-4 w-4 text-primary animate-pulse-subtle" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-3.5 h-3.5 text-cinema-gold animate-bounce-slow" />
                </div>
              </div>

              <div className="space-y-0.5">
                <h1 className="text-lg font-bold uppercase tracking-tighter text-white">Thành Viên Mới</h1>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Hành trình bắt đầu</p>
              </div>
            </div>

            {isOtpSent ? (
              <form onSubmit={handleVerifyAndSignup} className="space-y-4">
                <div className="text-center space-y-2 py-2">
                  <p className="text-xs text-white/70">
                    Chúng tôi đã gửi mã xác thực gồm 4 chữ số đến email:
                  </p>
                  <p className="text-sm font-bold text-primary tracking-wide">{formData.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Mã Xác Thực OTP</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      maxLength={4}
                      placeholder="••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="h-12 text-center bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all text-xl font-bold tracking-[1em] pl-[0.8em]"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpSent(false);
                      setOtpCode('');
                    }}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    ← Chỉnh sửa email
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (resendCooldown > 0) return;
                      try {
                        const result = await sendOtp({ email: formData.email }).unwrap();
                        setOtpHash(result.hash);
                        setResendCooldown(60);
                        toast.success('Mã OTP mới đã được gửi!');
                      } catch (error: any) {
                        toast.error(error?.data?.message || 'Không thể gửi lại mã OTP');
                      }
                    }}
                    disabled={resendCooldown > 0 || isSendingOtp}
                    className={`font-bold transition-colors ${resendCooldown > 0 ? 'text-white/20' : 'text-primary hover:underline'}`}
                  >
                    {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : 'Gửi lại mã'}
                  </button>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-[9px] shadow-[0_10px_30px_rgba(246,213,138,0.22)] hover:shadow-[0_15px_40px_rgba(246,213,138,0.34)] hover:scale-[1.02] active:scale-[0.98] transition-all gap-2" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Xác Nhận & Đăng Ký <ArrowRight className="h-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Danh Tính</Label>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                      <Input
                        name="name"
                        placeholder="Họ và tên"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="h-10 pl-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all text-xs font-medium"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Liên Hệ</Label>
                    <div className="relative group/input">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                      <Input
                        name="phone"
                        type="tel"
                        placeholder="Số điện thoại"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="h-10 pl-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all text-xs font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Email</Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-10 pl-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all text-xs font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Mật Mã</Label>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="h-10 pl-11 pr-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all text-xs font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Xác Nhận</Label>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                      <Input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="h-10 pl-11 pr-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all text-xs font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-[9px] shadow-[0_10px_30px_rgba(246,213,138,0.22)] hover:shadow-[0_15px_40px_rgba(246,213,138,0.34)] hover:scale-[1.02] active:scale-[0.98] transition-all gap-2" 
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Gửi Mã Xác Thực OTP <ArrowRight className="h-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-primary transition-all"
                  >
                    Đã có tài khoản? <span className="text-primary underline underline-offset-4 ml-1">Đăng nhập</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-[0.4em] text-white/10 pointer-events-none">
        Experience Excellence • RoPhim Premium
      </div>
    </div>
  );
}
