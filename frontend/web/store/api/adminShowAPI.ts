import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type {
  Show,
  ShowAnalytics,
  ShowSeatsStatus,
  AdminShowsResponse,
  CreateShowParams,
  UpdateShowParams,
  GetAdminShowsParams,
} from '@/types';

export const adminShowAPI = createApi({
  reducerPath: 'adminShowAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['AdminShow'],
  endpoints: (builder) => ({
    // Create show
    createShow: builder.mutation<{ message: string; show: Show }, CreateShowParams>(
      {
        query: (body) => ({
          url: '/admin/shows',
          method: 'POST',
          body: {
            ...body,
            priceMap: body.priceMap || {
              Standard: 95000,
              VIP: 125000,
              Sweetbox: 250000,
            },
            seatLayout: body.seatLayout || {
              rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
              cols: 12,
              vipRows: ['E', 'F', 'G'],
              sweetboxRows: ['J'],
              unavailable: [],
            },
          },
        }),
        invalidatesTags: ['AdminShow'],
      }
    ),

    // Get all shows (admin)
    getAdminShows: builder.query<AdminShowsResponse, GetAdminShowsParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.movieId) searchParams.set('movieId', params.movieId);
        if (params?.theaterId) searchParams.set('theaterId', params.theaterId);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
        if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
        const qs = searchParams.toString();
        return `/admin/shows${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminShow'],
    }),

    // Get single show
    getShowById: builder.query<Show, string>({
      query: (id) => `/admin/shows/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminShow', id }],
    }),

    // Update show
    updateShow: builder.mutation<
      { message: string; show: Show },
      { id: string; data: UpdateShowParams }
    >({
      query: ({ id, data }) => ({
        url: `/admin/shows/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AdminShow'],
    }),

    // Delete show (soft delete)
    deleteShow: builder.mutation<{ message: string; show: Show }, string>({
      query: (id) => ({
        url: `/admin/shows/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminShow'],
    }),

    // Hard delete show
    hardDeleteShow: builder.mutation<{ message: string; show: Show }, string>({
      query: (id) => ({
        url: `/admin/shows/${id}/hard`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminShow'],
    }),

    // Get show analytics
    getShowAnalytics: builder.query<ShowAnalytics, string>({
      query: (id) => `/admin/shows/${id}/analytics`,
      providesTags: (result, error, id) => [
        { type: 'AdminShow', id: `analytics-${id}` },
      ],
    }),

    // Get show seat status
    getShowSeatsStatus: builder.query<ShowSeatsStatus, string>({
      query: (id) => `/admin/shows/${id}/seats-status`,
      providesTags: (result, error, id) => [
        { type: 'AdminShow', id: `seats-${id}` },
      ],
    }),
  }),
});

export const {
  useCreateShowMutation,
  useGetAdminShowsQuery,
  useLazyGetAdminShowsQuery,
  useGetShowByIdQuery,
  useUpdateShowMutation,
  useDeleteShowMutation,
  useHardDeleteShowMutation,
  useGetShowAnalyticsQuery,
  useGetShowSeatsStatusQuery,
} = adminShowAPI;
