import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminUIState {
  // Movie management
  movieModalOpen: boolean;
  selectedMovieId: string | null;
  movieSearchQuery: string;
  moviePageNum: number;

  // Theater management
  theaterModalOpen: boolean;
  selectedTheaterId: string | null;
  theaterSearchQuery: string;
  theaterPageNum: number;

  // Show management
  showModalOpen: boolean;
  selectedShowId: string | null;
  showFilterMovieId: string | null;
  showFilterTheaterId: string | null;
  showPageNum: number;

  // Booking management
  bookingDetailOpen: boolean;
  selectedBookingId: string | null;
  bookingFilterStatus: string | null;
  bookingPageNum: number;

  // Dashboard
  dashboardDateFrom: string | null;
  dashboardDateTo: string | null;

  // General
  activeTab: 'dashboard' | 'movies' | 'theaters' | 'shows' | 'bookings';
  isLoading: boolean;
}

const initialState: AdminUIState = {
  movieModalOpen: false,
  selectedMovieId: null,
  movieSearchQuery: '',
  moviePageNum: 1,

  theaterModalOpen: false,
  selectedTheaterId: null,
  theaterSearchQuery: '',
  theaterPageNum: 1,

  showModalOpen: false,
  selectedShowId: null,
  showFilterMovieId: null,
  showFilterTheaterId: null,
  showPageNum: 1,

  bookingDetailOpen: false,
  selectedBookingId: null,
  bookingFilterStatus: null,
  bookingPageNum: 1,

  dashboardDateFrom: null,
  dashboardDateTo: null,

  activeTab: 'dashboard',
  isLoading: false,
};

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    // Movie
    setMovieModalOpen: (state, action: PayloadAction<boolean>) => {
      state.movieModalOpen = action.payload;
      if (!action.payload) {
        state.selectedMovieId = null;
      }
    },
    setSelectedMovieId: (state, action: PayloadAction<string | null>) => {
      state.selectedMovieId = action.payload;
    },
    setMovieSearchQuery: (state, action: PayloadAction<string>) => {
      state.movieSearchQuery = action.payload;
      state.moviePageNum = 1;
    },
    setMoviePageNum: (state, action: PayloadAction<number>) => {
      state.moviePageNum = action.payload;
    },

    // Theater
    setTheaterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.theaterModalOpen = action.payload;
      if (!action.payload) {
        state.selectedTheaterId = null;
      }
    },
    setSelectedTheaterId: (state, action: PayloadAction<string | null>) => {
      state.selectedTheaterId = action.payload;
    },
    setTheaterSearchQuery: (state, action: PayloadAction<string>) => {
      state.theaterSearchQuery = action.payload;
      state.theaterPageNum = 1;
    },
    setTheaterPageNum: (state, action: PayloadAction<number>) => {
      state.theaterPageNum = action.payload;
    },

    // Show
    setShowModalOpen: (state, action: PayloadAction<boolean>) => {
      state.showModalOpen = action.payload;
      if (!action.payload) {
        state.selectedShowId = null;
      }
    },
    setSelectedShowId: (state, action: PayloadAction<string | null>) => {
      state.selectedShowId = action.payload;
    },
    setShowFilterMovieId: (state, action: PayloadAction<string | null>) => {
      state.showFilterMovieId = action.payload;
      state.showPageNum = 1;
    },
    setShowFilterTheaterId: (state, action: PayloadAction<string | null>) => {
      state.showFilterTheaterId = action.payload;
      state.showPageNum = 1;
    },
    setShowPageNum: (state, action: PayloadAction<number>) => {
      state.showPageNum = action.payload;
    },

    // Booking
    setBookingDetailOpen: (state, action: PayloadAction<boolean>) => {
      state.bookingDetailOpen = action.payload;
      if (!action.payload) {
        state.selectedBookingId = null;
      }
    },
    setSelectedBookingId: (state, action: PayloadAction<string | null>) => {
      state.selectedBookingId = action.payload;
    },
    setBookingFilterStatus: (state, action: PayloadAction<string | null>) => {
      state.bookingFilterStatus = action.payload;
      state.bookingPageNum = 1;
    },
    setBookingPageNum: (state, action: PayloadAction<number>) => {
      state.bookingPageNum = action.payload;
    },

    // Dashboard
    setDashboardDateFrom: (state, action: PayloadAction<string | null>) => {
      state.dashboardDateFrom = action.payload;
    },
    setDashboardDateTo: (state, action: PayloadAction<string | null>) => {
      state.dashboardDateTo = action.payload;
    },

    // General
    setActiveTab: (
      state,
      action: PayloadAction<'dashboard' | 'movies' | 'theaters' | 'shows' | 'bookings'>
    ) => {
      state.activeTab = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Reset all
    resetAdminUI: () => initialState,
  },
});

export const {
  setMovieModalOpen,
  setSelectedMovieId,
  setMovieSearchQuery,
  setMoviePageNum,
  setTheaterModalOpen,
  setSelectedTheaterId,
  setTheaterSearchQuery,
  setTheaterPageNum,
  setShowModalOpen,
  setSelectedShowId,
  setShowFilterMovieId,
  setShowFilterTheaterId,
  setShowPageNum,
  setBookingDetailOpen,
  setSelectedBookingId,
  setBookingFilterStatus,
  setBookingPageNum,
  setDashboardDateFrom,
  setDashboardDateTo,
  setActiveTab,
  setIsLoading,
  resetAdminUI,
} = adminSlice.actions;
