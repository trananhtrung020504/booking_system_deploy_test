'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Mail, Lock, ArrowRight, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginMutation } from '@/store/api/authAPI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slice/authSlice';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [redirectUrl, setRedirectUrl] = useState('/');

  const [login, { isLoading }] = useLoginMutation();

  // Safely extract the redirect query parameter on the client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        setRedirectUrl(redirect);
      }
    }
  }, []);

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

    if (isAuthenticated) {
      const pendingBooking = sessionStorage.getItem('pending_booking');
      if (pendingBooking) {
        const { showId, seats } = JSON.parse(pendingBooking);
        sessionStorage.removeItem('pending_booking');
        router.replace(`/payment?showId=${showId}&seats=${seats.join(',')}`);
      } else {
        router.replace(redirectUrl);
      }
    }
  }, [isAuthenticated, router, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setUser(result.user));
      toast.success('Chào mừng bạn quay trở lại!');
      
      const pendingBooking = sessionStorage.getItem('pending_booking');
      if (pendingBooking) {
        const { showId, seats } = JSON.parse(pendingBooking);
        sessionStorage.removeItem('pending_booking');
        router.replace(`/payment?showId=${showId}&seats=${seats.join(',')}`);
      } else {
        router.replace(redirectUrl);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Thông tin đăng nhập không chính xác');
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

      <div className="relative z-20 w-full max-w-[400px] px-6 py-4">
        <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-[30px] p-6 md:p-8 shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all duration-700 hover:border-primary/40">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cinema-gold/5 pointer-events-none" />
          
          <div className="relative space-y-4">
            <div className="text-center space-y-3">
              <div className="relative mx-auto w-14 h-14 flex items-center justify-center group/logo">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl rotate-12 transition-transform group-hover/logo:rotate-[30deg] duration-700" />
                <div className="relative w-10 h-10 bg-[#12121a] border border-white/10 rounded-xl flex items-center justify-center shadow-2xl">
                  <Film className="h-5 w-5 text-primary animate-pulse-subtle" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 text-cinema-gold animate-bounce-slow" />
                </div>
              </div>

              <div className="space-y-0.5">
                <h1 className="text-xl font-bold uppercase tracking-tighter text-white">Khởi Chiếu Đam Mê</h1>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Đăng nhập vào RoPhim</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Email Thành Viên</Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 pl-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all text-xs font-medium"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-[8px] font-bold uppercase tracking-widest text-white/30">Mật Mã</Label>
                    <button type="button" className="text-[8px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">Quên?</button>
                  </div>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pl-11 pr-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/10 focus:ring-1 focus:ring-primary/40 transition-all text-xs font-medium"
                      required
                      disabled={isLoading}
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
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-[9px] shadow-[0_10px_30px_rgba(239,68,68,0.2)] hover:shadow-[0_15px_40px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all gap-2" 
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Vào Rạp Chiếu <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>

              <div className="relative py-1 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <span className="relative px-3 bg-transparent text-[8px] font-bold uppercase tracking-widest text-white/20">Hoặc</span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl border-white/5 bg-white/5 text-white hover:bg-white/10 text-[8px] font-bold uppercase tracking-widest transition-all"
                onClick={() => router.push('/signup')}
                disabled={isLoading}
              >
                Gia nhập RoPhim
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-[0.4em] text-white/10 pointer-events-none">
        Experience Excellence • RoPhim Premium
      </div>
    </div>
  );
}
