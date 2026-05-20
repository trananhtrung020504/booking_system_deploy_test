import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type { Show, ShowsByMovieResponse } from '@/types';

export const showAPI = createApi({
  reducerPath: 'showAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Show'],
  endpoints: (builder) => ({
    getShows: builder.query<Show[], { movieId?: string; theaterId?: string; date?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.movieId) searchParams.set('movieId', params.movieId);
        if (params?.theaterId) searchParams.set('theaterId', params.theaterId);
        if (params?.date) searchParams.set('date', params.date);
        const qs = searchParams.toString();
        return `/shows${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Show'],
    }),
    getShow: builder.query<Show, string>({
      query: (id) => `/shows/${id}`,
      providesTags: (result, error, id) => [{ type: 'Show', id }],
    }),
    getShowsByMovie: builder.query<ShowsByMovieResponse, { movieId: string; date?: string }>({
      query: ({ movieId, date }) => {
        const qs = date ? `?date=${date}` : '';
        return `/shows/movie/${movieId}${qs}`;
      },
      providesTags: ['Show'],
    }),
    getAvailableDates: builder.query<string[], string>({
      query: (movieId) => `/shows/movie/${movieId}/dates`,
    }),
  }),
});

export const {
  useGetShowsQuery,
  useGetShowQuery,
  useGetShowsByMovieQuery,
  useGetAvailableDatesQuery,
} = showAPI;
