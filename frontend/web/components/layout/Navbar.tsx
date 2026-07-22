'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Film, Ticket, User, LogOut, Menu, X, Search, ChevronDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useLogoutMutation, authAPI } from '@/store/api/authAPI';
import { useGetMoviesQuery } from '@/store/api/movieAPI';
import { clearUser } from '@/store/slice/authSlice';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [logout] = useLogoutMutation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400); // 400ms debounce delay
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResultsData, isFetching: isSearchLoading } = useGetMoviesQuery(
    debouncedQuery ? { search: debouncedQuery, limit: 5 } : undefined,
    { skip: !debouncedQuery }
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/signup') return null;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearUser());
      dispatch(authAPI.util.resetApiState());
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navLinks = [
    { name: 'Phim đang chiếu', href: '/movies?status=now-showing' },
    { name: 'Phim sắp chiếu', href: '/movies?status=coming-soon' },
    { name: 'Rạp / Giá vé', href: '/theaters' },
    { name: 'Khuyến mãi', href: '/promotions' },
    { name: 'Lịch chiếu', href: '/schedule' },
  ];

  return (
    <header 
      className={`fixed top-0 z-[10500] w-full transition-all duration-500 ${
        isScrolled
          ? 'bg-[#14110B]/90 backdrop-blur-md py-2 border-b border-primary/10 shadow-xl' 
          : 'bg-[#14110B] border-b border-primary/10 py-4'
      }`}
    >
      <nav className="relative z-[10520] max-w-[1550px] mx-auto flex items-center justify-between px-6 md:px-10 gap-8">
        <div className="flex items-center gap-10 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transform group-hover:rotate-6 transition-transform duration-500">
              <Film className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold uppercase tracking-tighter text-white leading-none">RoPhim</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary mt-1">Phim hay cả rổ</span>
            </div>
          </Link>

          <div ref={searchRef} className="hidden md:flex w-64 lg:w-80 relative">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Tìm kiếm phim..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-10 text-xs font-medium text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white/10 transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {showDropdown && (searchQuery || isSearchLoading) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1910]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-[150] w-80 lg:w-96 transition-all duration-300">
                <div className="max-h-80 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
                  {isSearchLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Đang tìm kiếm...</span>
                    </div>
                  ) : searchResultsData?.movies && searchResultsData.movies.length > 0 ? (
                    searchResultsData.movies.map((movie: any) => (
                      <Link
                        key={movie.id}
                        href={`/movies/${movie.id}`}
                        onClick={() => {
                          setSearchQuery('');
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-white/5 transition-all group"
                      >
                        <div className="w-10 h-14 bg-[#1E1910] rounded-lg overflow-hidden border border-white/5 flex-shrink-0 flex items-center justify-center">
                          {movie.poster?.source ? (
                            <img src={movie.poster.source} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <Film className="w-4 h-4 text-white/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white uppercase group-hover:text-cinema-gold transition-colors line-clamp-1">{movie.title}</h4>
                          <p className="text-[10px] text-white/40 font-semibold line-clamp-1 mt-0.5">{movie.genre?.join(' • ')}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-white/30">{movie.duration}m</span>
                            <span className="text-[9px] text-white/30">•</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 text-cinema-gold fill-cinema-gold" />
                              <span className="text-[9px] font-bold text-white">{movie.rating || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-white/40 uppercase tracking-wider font-semibold">
                      Không tìm thấy phim phù hợp
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 lg:gap-8">
          <div className="hidden xl:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`text-xs font-bold uppercase tracking-wide transition-all hover:text-primary ${pathname === link.href ? 'text-primary' : 'text-white'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 p-1 rounded-full bg-white/10 border border-white/5 hover:bg-white/20 transition-all cursor-pointer group outline-none">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold uppercase">
                      {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-white/20 group-hover:text-primary mr-2" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1E1910] border-primary/15 text-white rounded-xl mt-2 p-2">
                <DropdownMenuItem 
                  onClick={() => router.push('/profile')}
                  className="focus:bg-primary/10 focus:text-primary cursor-pointer rounded-lg gap-3 py-2.5 text-xs font-bold"
                >
                  <User className="w-4 h-4" /> Trang cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/bookings')} className="focus:bg-primary/10 focus:text-primary cursor-pointer rounded-lg gap-3 py-2.5 text-xs font-bold">
                  <Ticket className="w-4 h-4" /> Vé của tôi
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg gap-3 py-2.5 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button className="h-10 px-6 rounded-full bg-white/90 text-black hover:bg-white font-bold uppercase tracking-wide text-[10px] gap-2 shadow-xl group transition-all">
                <User className="h-4 w-4" />
                Thành viên
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden text-white hover:bg-white/5 w-10 h-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      <div
        className={`xl:hidden fixed inset-0 z-[10510] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <div
        id="mobile-navigation"
        className={`xl:hidden fixed right-0 top-0 z-[10515] flex h-dvh w-full max-w-[420px] flex-col overflow-y-auto bg-[#14110B] px-6 pb-10 pt-24 shadow-[-24px_0_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-lg font-bold uppercase tracking-wider text-white transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
