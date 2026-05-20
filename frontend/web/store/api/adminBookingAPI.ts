import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type {
  Booking,
  DashboardStats,
  BookingsReport,
  RevenueReport,
  AdminBookingsResponse,
  BookingDetailResponse,
  CancelBookingParams,
  GetAdminBookingsParams,
} from '@/types';

export const adminBookingAPI = createApi({
  reducerPath: 'adminBookingAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['AdminBooking', 'AdminDashboard'],
  endpoints: (builder) => ({
    // Get all bookings (admin)
    getAdminBookings: builder.query<AdminBookingsResponse, GetAdminBookingsParams | void>(
      {
        query: (params) => {
          const searchParams = new URLSearchParams();
          if (params?.page) searchParams.set('page', String(params.page));
          if (params?.limit) searchParams.set('limit', String(params.limit));
          if (params?.status) searchParams.set('status', params.status);
          if (params?.userId) searchParams.set('userId', params.userId);
          if (params?.showId) searchParams.set('showId', params.showId);
          if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
          if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
          if (params?.search) searchParams.set('search', params.search);
          const qs = searchParams.toString();
          return `/admin/bookings${qs ? `?${qs}` : ''}`;
        },
        providesTags: ['AdminBooking'],
      }
    ),

    // Get booking detail (admin)
    getAdminBookingDetail: builder.query<BookingDetailResponse, string>({
      query: (id) => `/admin/bookings/${id}`,
      providesTags: (result, error, id) => [
        { type: 'AdminBooking', id },
      ],
    }),

    // Cancel booking (admin)
    cancelAdminBooking: builder.mutation<
      { message: string; booking: Booking; reason?: string },
      { id: string; data?: CancelBookingParams }
    >({
      query: ({ id, data }) => ({
        url: `/admin/bookings/${id}/cancel`,
        method: 'PATCH',
        body: data || {},
      }),
      invalidatesTags: ['AdminBooking'],
    }),

    // Dashboard - Get overall stats
    getDashboardStats: builder.query<
      DashboardStats,
      { dateFrom?: string; dateTo?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
        if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
        const qs = searchParams.toString();
        return `/admin/bookings/dashboard/stats${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminDashboard'],
    }),

    // Get bookings report
    getBookingsReport: builder.query<
      BookingsReport,
      {
        groupBy?: 'date' | 'status' | 'movie';
        dateFrom?: string;
        dateTo?: string;
      } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.groupBy) searchParams.set('groupBy', params.groupBy);
        if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
        if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
        const qs = searchParams.toString();
        return `/admin/bookings/reports/bookings${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminDashboard'],
    }),

    // Get revenue report
    getRevenueReport: builder.query<
      RevenueReport,
      { dateFrom?: string; dateTo?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
        if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
        const qs = searchParams.toString();
        return `/admin/bookings/reports/revenue${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminDashboard'],
    }),
  }),
});

export const {
  useGetAdminBookingsQuery,
  useLazyGetAdminBookingsQuery,
  useGetAdminBookingDetailQuery,
  useCancelAdminBookingMutation,
  useGetDashboardStatsQuery,
  useGetBookingsReportQuery,
  useGetRevenueReportQuery,
} = adminBookingAPI;
