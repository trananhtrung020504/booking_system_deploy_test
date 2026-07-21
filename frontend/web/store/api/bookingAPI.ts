import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type { Booking, BookingsResponse, CreateBookingParams } from '@/types';

export const bookingAPI = createApi({
  reducerPath: 'bookingAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Booking'],
  endpoints: (builder) => ({
    createBooking: builder.mutation<{ success: boolean; message: string; booking: Booking }, CreateBookingParams>({
      query: (body) => ({
        url: '/bookings/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Booking'],
    }),
    getUserBookings: builder.query<BookingsResponse, { page?: number; limit?: number; status?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.status) searchParams.set('status', params.status);
        const qs = searchParams.toString();
        return `/bookings/my-bookings${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Booking'],
    }),
    getBookingDetail: builder.query<Booking, string>({
      query: (id) => `/bookings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Booking', id }],
    }),
    cancelBooking: builder.mutation<{ success: boolean; message: string; booking: Booking }, string>({
      query: (id) => ({
        url: `/bookings/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Booking'],
    }),
    applyVoucher: builder.mutation<{ success: boolean; discount: number; voucherId: string }, { code: string; amount: number }>({
      query: (body) => ({
        url: '/bookings/apply-voucher',
        method: 'POST',
        body,
      }),
    }),
    holdSeats: builder.mutation<{ success: boolean; expiresAt: number }, { showId: string; seatIds: string[] }>({
      query: (body) => ({
        url: '/bookings/hold',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetUserBookingsQuery,
  useGetBookingDetailQuery,
  useCancelBookingMutation,
  useApplyVoucherMutation,
  useHoldSeatsMutation,
} = bookingAPI;
