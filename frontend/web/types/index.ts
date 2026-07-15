export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'ADMIN' | 'USER';
  avatar: UserAvatar | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserAvatar {
  id: string;
  publicId: string;
  source: string;
  userId: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  duration: number;
  genre: string[];
  releaseDate: string;
  languages: string[];
  certification: string;
  poster: MoviePoster | null;
  rating: number | null;
  votes: number | null;
  format: string[];
  trailerUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shows?: Show[];
}

export interface MoviePoster {
  id: string;
  publicId: string;
  source: string;
  movieId: string;
}

export interface GetMoviesParams {
  genre?: string;
  search?: string;
  status?: 'now-showing' | 'coming-soon';
  page?: number;
  limit?: number;
  sort?: string;
}

export interface Theater {
  id: string;
  name: string;
  location: string;
  logo: TheaterLogo | null;
  city: string;
  state: string | null;
  createdAt: string;
  updatedAt: string;
  screens?: Screen[];
}

export interface TheaterLogo {
  id: string;
  publicId: string;
  source: string;
  theaterId: string;
}

export interface Screen {
  id: string;
  name: string;
  theaterId: string;
  rows: number;
  cols: number;
  seats?: Seat[];
}

export interface Seat {
  id: string;
  screenId: string;
  row: string;
  column: number;
  type: 'STANDARD' | 'VIP' | 'SWEETBOX';
  isActive: boolean;
}

export interface Show {
  id: string;
  movieId: string;
  theaterId: string;
  screenId: string;
  format: string;
  startTime: string;
  endTime: string;
  priceMap: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  movie?: Movie;
  theater?: Theater;
  screen?: Screen;
}

export interface HeldSeat {
  seatId: string;
  userId: string;
  expiresAt: number;
}

export interface BookedSeat {
  seatId: string;
  userId?: string;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  isActive: boolean;
}

export interface BookingCombo {
  id: string;
  bookingId: string;
  comboId: string;
  quantity: number;
  combo: Combo;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface Booking {
  id: string;
  bookingRef: string;
  userId: string;
  showId: string;
  voucherId: string | null;
  status: BookingStatus;
  paymentId: string | null;
  paymentMethod: string;
  ticketPrice: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  show?: Show;
  seats?: Seat[];
  combos?: BookingCombo[];
  transaction?: Transaction | null;
}

export interface BookingFlowMovie {
  id: string;
  title: string;
  genre: string[];
  duration: number;
  certification: string;
  poster: string | null;
}

export interface BookingFlowShowtime {
  id: string;
  theaterName: string;
  screenName: string;
  startTime: string;
  format: string;
  availableSeats: number;
}

export interface BookingFlowResponse {
  type: 'booking_flow';
  message: string;
  movie: BookingFlowMovie;
  showtimes: BookingFlowShowtime[];
  supportedPaymentMethods: string[];
}

export type TransactionStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'SPEND' | 'REFUND';
  status: TransactionStatus;
  paymentMethod: string;
  transactionCode: string;
  transactionNo: string | null;
  amount: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MoviesResponse {
  movies: Movie[];
  pagination: PaginationInfo;
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: PaginationInfo;
}

export interface ShowsByMovieResponse {
  movieId: string;
  theaters: {
    theater: Theater;
    shows: Show[];
  }[];
}

export interface SeatsUpdatePayload {
  showId: string;
  held: HeldSeat[];
  booked: BookedSeat[];
  timestamp: number;
}

export interface SeatHoldResponse {
  success: boolean;
  expiresAt?: number;
  message?: string;
}

export interface CreateBookingParams {
  showId: string;
  seatIds: string[];
  paymentMethod: string;
  voucherCode?: string;
  combos?: { comboId: string; quantity: number }[];
}

export interface ConfirmBookingParams {
  bookingId: string;
  transactionCode?: string;
}

export interface CreateMovieParams {
  title: string;
  description: string;
  duration: number;
  genre: string[];
  releaseDate: string;
  languages: string[];
  certification?: string;
  format: string[];
  trailerUrl?: string;
  isActive?: boolean;
  poster?: File;
}

export interface AdminMoviesResponse {
  movies: (Movie & { showCount: number })[];
  pagination: PaginationInfo;
}

export interface CreateTheaterParams {
  name: string;
  location: string;
  city: string;
  state?: string;
  logo?: File;
}

export interface AdminTheatersResponse {
  theaters: (Theater & { activeShowsCount: number })[];
  pagination: PaginationInfo;
}

export interface CreateShowParams {
  movieId: string;
  theaterId: string;
  screenId: string;
  format?: string;
  startTime: string;
  priceMap?: Record<string, number>;
  isActive?: boolean;
  seatLayout?: any;
}

export interface UpdateShowParams {
  movieId?: string;
  theaterId?: string;
  screenId?: string;
  format?: string;
  startTime?: string;
  priceMap?: Record<string, number>;
  isActive?: boolean;
  seatLayout?: any;
}

export interface GetAdminShowsParams {
  page?: number;
  limit?: number;
  movieId?: string;
  theaterId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetAdminBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  showId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface BookingDetailResponse extends Booking {
  user: User;
}

export interface CancelBookingParams {
  reason?: string;
}

export interface BookingsReport {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  byDate?: { date: string; count: number }[];
  byStatus?: { status: string; count: number }[];
  byMovie?: { movieId: string; title: string; count: number }[];
}

export interface RevenueReport {
  totalRevenue: number;
  ticketRevenue: number;
  comboRevenue: number;
  byDate?: { date: string; amount: number }[];
  byTheater?: { theaterId: string; name: string; amount: number }[];
}

export interface GetAdminMoviesParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface UpdateMovieParams {
  title?: string;
  description?: string;
  duration?: number;
  genre?: string[];
  releaseDate?: string;
  languages?: string[];
  certification?: string;
  format?: string[];
  trailerUrl?: string;
  isActive?: boolean;
  poster?: File;
}

export interface MovieAnalytics {
  movieId: string;
  title: string;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  byTheater?: { theaterId: string; name: string; bookings: number; revenue: number }[];
}

export interface TheaterAnalytics {
  theaterId: string;
  name: string;
  totalShows: number;
  totalBookings: number;
  totalRevenue: number;
  byMovie?: { movieId: string; title: string; bookings: number; revenue: number }[];
}

export interface UpdateTheaterParams {
  name?: string;
  location?: string;
  city?: string;
  state?: string;
  logo?: File;
}

export interface GetAdminTheatersParams {
  page?: number;
  limit?: number;
  city?: string;
  search?: string;
}

export type GetCitiesResponse = string[];

export interface SendOtpParams {
  email: string;
}

export interface VerifyOtpParams {
  email: string;
  otp: string;
}

export interface AdminShowsResponse {
  shows: (Show & {
    movie: { id: string; title: string };
    theater: { id: string; name: string; city: string };
    bookingsCount: number;
  })[];
  pagination: PaginationInfo;
}

export interface ShowAnalytics {
  show: Show;
  analytics: {
    seatAnalytics: {
      total: number;
      unavailable: number;
      booked: number;
      held: number;
      available: number;
      occupancyRate: string;
    };
    bookingAnalytics: {
      totalBookings: number;
      confirmedBookings: number;
      totalRevenue: number;
    };
  };
}

export interface ShowSeatsStatus {
  showId: string;
  screen: { id: string; name: string };
  seatsByRow: Record<string, (Seat & { status: 'available' | 'booked' | 'held' | 'unavailable' })[]>;
  summary: {
    total: number;
    available: number;
    booked: number;
    held: number;
    unavailable: number;
  };
}

export interface AdminBookingsResponse {
  bookings: (Booking & {
    user: { id: string; email: string; name: string | null; phone: string | null };
    show: {
      movie: { title: string };
      theater: { name: string; city: string };
    };
  })[];
  pagination: PaginationInfo;
}

export interface DashboardStats {
  stats: {
    users: number;
    activeShows: number;
    activeMovies: number;
    theaters: number;
    bookings: {
      total: number;
      confirmed: number;
      pending: number;
      cancelled: number;
    };
    transactions: {
      total: number;
      totalRevenue: number;
    };
  };
  topMovies: {
    id: string;
    title: string;
    poster: MoviePoster | null;
    bookings: number;
    revenue: number;
  }[];
  topTheaters: {
    id: string;
    name: string;
    city: string;
    bookings: number;
    revenue: number;
  }[];
}
