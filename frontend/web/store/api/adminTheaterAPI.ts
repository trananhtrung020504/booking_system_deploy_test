import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type {
  Theater,
  TheaterAnalytics,
  AdminTheatersResponse,
  CreateTheaterParams,
  UpdateTheaterParams,
  GetAdminTheatersParams,
  GetCitiesResponse,
} from '@/types';

export const adminTheaterAPI = createApi({
  reducerPath: 'adminTheaterAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['AdminTheater'],
  endpoints: (builder) => ({
    // Create theater
    createTheater: builder.mutation<
      { message: string; theater: Theater },
      CreateTheaterParams
    >({
      query: (body) => {
        const formData = new FormData();
        formData.append('name', body.name);
        formData.append('location', body.location);
        formData.append('city', body.city);
        if (body.state) formData.append('state', body.state);
        if (body.logo) {
          formData.append('logo', body.logo);
        }

        return {
          url: '/admin/theaters',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['AdminTheater'],
    }),

    // Get all theaters (admin)
    getAdminTheaters: builder.query<
      AdminTheatersResponse,
      GetAdminTheatersParams | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.city) searchParams.set('city', params.city);
        if (params?.search) searchParams.set('search', params.search);
        const qs = searchParams.toString();
        return `/admin/theaters${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminTheater'],
    }),

    // Get cities
    getCities: builder.query<string[], void>({
      query: () => '/admin/theaters/cities',
    }),

    // Update theater
    updateTheater: builder.mutation<
      { message: string; theater: Theater },
      { id: string; data: UpdateTheaterParams }
    >({
      query: ({ id, data }) => {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.location) formData.append('location', data.location);
        if (data.city) formData.append('city', data.city);
        if (data.state) formData.append('state', data.state);
        if (data.logo) {
          formData.append('logo', data.logo);
        }

        return {
          url: `/admin/theaters/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: ['AdminTheater'],
    }),

    // Delete theater
    deleteTheater: builder.mutation<{ message: string; theater: Theater }, string>(
      {
        query: (id) => ({
          url: `/admin/theaters/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AdminTheater'],
      }
    ),

    // Get theater analytics
    getTheaterAnalytics: builder.query<TheaterAnalytics, string>({
      query: (id) => `/admin/theaters/${id}/analytics`,
      providesTags: (result, error, id) => [
        { type: 'AdminTheater', id: `analytics-${id}` },
      ],
    }),
  }),
});

export const {
  useCreateTheaterMutation,
  useGetAdminTheatersQuery,
  useLazyGetAdminTheatersQuery,
  useGetCitiesQuery,
  useUpdateTheaterMutation,
  useDeleteTheaterMutation,
  useGetTheaterAnalyticsQuery,
} = adminTheaterAPI;
