'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useGetMeQuery } from '@/store/api/authAPI';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RootState } from '@/store';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { 
  LayoutDashboard, 
  Film, 
  Theater, 
  Calendar, 
  Ticket, 
  Loader2, 
  Coffee, 
  Tag, 
  Users, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import MovieFormModal from '@/components/admin/components/MovieFormModal';
import ShowFormModal from '@/components/admin/components/ShowFormModal';
import TheaterFormModal from '@/components/admin/components/TheaterFormModal';
import { 
  setMovieModalOpen, 
  setSelectedMovieId, 
  setShowModalOpen, 
  setSelectedShowId as setSelectedShowIdAction, 
  setTheaterModalOpen, 
  setSelectedTheaterId 
} from '@/store/slice/adminSlice';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { 
    movieModalOpen, 
    selectedMovieId, 
    showModalOpen, 
    selectedShowId, 
    theaterModalOpen, 
    selectedTheaterId 
  } = useSelector((state: RootState) => state.admin);
  
  // Collapsible sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('admin_sidebar_collapsed', String(nextValue));
  };
  
  // Check if user is authenticated and is admin
  const { data: user, isLoading } = useGetMeQuery();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin', category: 'MAIN' },
    
    { id: 'movies', label: 'Phim', icon: Film, href: '/admin/movies', category: 'CORE' },
    { id: 'theaters', label: 'Rạp chiếu', icon: Theater, href: '/admin/theaters', category: 'CORE' },
    { id: 'shows', label: 'Suất chiếu', icon: Calendar, href: '/admin/shows', category: 'CORE' },
    
    { id: 'combos', label: 'Bắp nước (Combos)', icon: Coffee, href: '/admin/combos', category: 'SERVICES' },
    { id: 'vouchers', label: 'Vouchers & Quà', icon: Tag, href: '/admin/vouchers', category: 'SERVICES' },
    
    { id: 'bookings', label: 'Đặt vé', icon: Ticket, href: '/admin/bookings', category: 'TRANSACTIONS' },
    { id: 'users', label: 'Khách hàng', icon: Users, href: '/admin/users', category: 'TRANSACTIONS' },
  ];

  const categories = [
    { id: 'MAIN', label: 'Menu chính' },
    { id: 'CORE', label: 'Quản lý phim & rạp' },
    { id: 'SERVICES', label: 'Dịch vụ & Ưu đãi' },
    { id: 'TRANSACTIONS', label: 'Giao dịch' }
  ];

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar - Full height */}
      <aside className={`bg-card/40 backdrop-blur-md border-r border-border overflow-y-auto overflow-x-hidden hidden md:flex flex-col transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}>
        {/* Floating toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-md z-50 transition-all duration-300 hover:scale-110 active:scale-95"
          title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        <div className={`p-8 ${isCollapsed ? 'px-4' : ''}`}>
          {/* Logo */}
          <div className={`flex items-center gap-3 mb-10 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#fff0b8] via-[#d8a94f] to-[#9b6b24] rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <Film className="text-white h-5 w-5" />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold tracking-tighter text-foreground uppercase animate-fade-in">
                Admin <span className="text-primary">Cinema</span>
              </h1>
            )}
          </div>

          <div className="space-y-8">
            {categories.map((cat) => {
              const items = menuItems.filter(item => item.category === cat.id);
              if (items.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-3">
                  {!isCollapsed ? (
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 px-4 opacity-50 transition-all duration-300">
                      {cat.label}
                    </p>
                  ) : (
                    <div className="h-px bg-border/50 my-4 animate-fade-in" />
                  )}
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          title={isCollapsed ? item.label : undefined}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group ${
                            isCollapsed ? 'justify-center' : ''
                          } ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                          {!isCollapsed && (
                            <span className="text-sm tracking-tight whitespace-nowrap animate-fade-in">{item.label}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className={`mt-auto p-8 opacity-40 ${isCollapsed ? 'px-4 text-center' : ''}`}>
           <div className="h-px bg-border mb-6"></div>
           <p className="text-[10px] font-bold uppercase tracking-widest">
             {isCollapsed ? 'BMS' : 'BookMyScreen v1.0'}
           </p>
        </div>
      </aside>

      {/* Right Column: Header + Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background/50 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <AdminNavbar user={user} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto relative">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Admin Modals */}
      {movieModalOpen && (
        <MovieFormModal
          movieId={selectedMovieId}
          onClose={() => {
            dispatch(setMovieModalOpen(false));
            dispatch(setSelectedMovieId(null));
          }}
        />
      )}

      {showModalOpen && (
        <ShowFormModal
          showId={selectedShowId}
          onClose={() => {
            dispatch(setShowModalOpen(false));
            dispatch(setSelectedShowIdAction(null));
          }}
        />
      )}

      {theaterModalOpen && (
        <TheaterFormModal
          theaterId={selectedTheaterId}
          onClose={() => {
            dispatch(setTheaterModalOpen(false));
            dispatch(setSelectedTheaterId(null));
          }}
        />
      )}
    </div>
  );
}
