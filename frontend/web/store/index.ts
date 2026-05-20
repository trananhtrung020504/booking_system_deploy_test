import { configureStore } from '@reduxjs/toolkit';
import { authAPI } from './api/authAPI';
import { movieAPI } from './api/movieAPI';
import { showAPI } from './api/showAPI';
import { bookingAPI } from './api/bookingAPI';
import { comboAPI } from './api/comboAPI';
import { theaterAPI } from './api/theaterAPI';
import { voucherAPI } from './api/voucherAPI';
import { adminMovieAPI } from './api/adminMovieAPI';
import { adminTheaterAPI } from './api/adminTheaterAPI';
import { adminShowAPI } from './api/adminShowAPI';
import { adminBookingAPI } from './api/adminBookingAPI';
import { authSlice } from './slice/authSlice';
import { bookingSlice } from './slice/bookingSlice';
import { adminSlice } from './slice/adminSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      bookingFlow: bookingSlice.reducer,
      admin: adminSlice.reducer,
      [authAPI.reducerPath]: authAPI.reducer,
      [movieAPI.reducerPath]: movieAPI.reducer,
      [showAPI.reducerPath]: showAPI.reducer,
      [bookingAPI.reducerPath]: bookingAPI.reducer,
      [comboAPI.reducerPath]: comboAPI.reducer,
      [theaterAPI.reducerPath]: theaterAPI.reducer,
      [voucherAPI.reducerPath]: voucherAPI.reducer,
      [adminMovieAPI.reducerPath]: adminMovieAPI.reducer,
      [adminTheaterAPI.reducerPath]: adminTheaterAPI.reducer,
      [adminShowAPI.reducerPath]: adminShowAPI.reducer,
      [adminBookingAPI.reducerPath]: adminBookingAPI.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(
        authAPI.middleware,
        movieAPI.middleware,
        showAPI.middleware,
        bookingAPI.middleware,
        comboAPI.middleware,
        theaterAPI.middleware,
        voucherAPI.middleware,
        adminMovieAPI.middleware,
        adminTheaterAPI.middleware,
        adminShowAPI.middleware,
        adminBookingAPI.middleware
      ),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
