import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type {
  Movie,
  MovieAnalytics,
  AdminMoviesResponse,
  CreateMovieParams,
  UpdateMovieParams,
  GetAdminMoviesParams,
} from '@/types';

export const adminMovieAPI = createApi({
  reducerPath: 'adminMovieAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['AdminMovie'],
  endpoints: (builder) => ({
    // Create movie
    createMovie: builder.mutation<
      { message: string; movie: Movie },
      CreateMovieParams
    >({
      query: (body) => {
        const formData = new FormData();
        formData.append('title', body.title);
        formData.append('description', body.description);
        formData.append('duration', String(body.duration));
        formData.append('genre', JSON.stringify(body.genre));
        formData.append('releaseDate', body.releaseDate);
        formData.append('languages', JSON.stringify(body.languages));
        formData.append('certification', body.certification || '');
        formData.append('format', JSON.stringify(body.format));
        formData.append('trailerUrl', body.trailerUrl || '');
        formData.append('isActive', String(body.isActive !== false));
        if (body.poster) {
          formData.append('poster', body.poster);
        }

        return {
          url: '/admin/movies',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['AdminMovie'],
    }),

    // Get all movies (admin)
    getAdminMovies: builder.query<AdminMoviesResponse, GetAdminMoviesParams | void>(
      {
        query: (params) => {
          const searchParams = new URLSearchParams();
          if (params?.page) searchParams.set('page', String(params.page));
          if (params?.limit) searchParams.set('limit', String(params.limit));
          if (params?.isActive !== undefined) {
            searchParams.set('isActive', String(params.isActive));
          }
          if (params?.search) searchParams.set('search', params.search);
          const qs = searchParams.toString();
          return `/admin/movies${qs ? `?${qs}` : ''}`;
        },
        providesTags: ['AdminMovie'],
      }
    ),

    // Update movie
    updateMovie: builder.mutation<
      { message: string; movie: Movie },
      { id: string; data: UpdateMovieParams }
    >({
      query: ({ id, data }) => {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.duration) formData.append('duration', String(data.duration));
        if (data.genre) formData.append('genre', JSON.stringify(data.genre));
        if (data.releaseDate) formData.append('releaseDate', data.releaseDate);
        if (data.languages) {
          formData.append('languages', JSON.stringify(data.languages));
        }
        if (data.certification)
          formData.append('certification', data.certification);
        if (data.format) formData.append('format', JSON.stringify(data.format));
        if (data.trailerUrl) formData.append('trailerUrl', data.trailerUrl);
        if (data.isActive !== undefined) {
          formData.append('isActive', String(data.isActive));
        }
        if (data.poster) {
          formData.append('poster', data.poster);
        }

        return {
          url: `/admin/movies/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: ['AdminMovie'],
    }),

    // Delete movie (soft delete)
    deleteMovie: builder.mutation<{ message: string; movie: Movie }, string>(
      {
        query: (id) => ({
          url: `/admin/movies/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AdminMovie'],
      }
    ),

    // Hard delete movie
    hardDeleteMovie: builder.mutation<{ message: string; movie: Movie }, string>(
      {
        query: (id) => ({
          url: `/admin/movies/${id}/hard`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AdminMovie'],
      }
    ),

    // Get single movie by ID
    getMovieById: builder.query<{ movie: Movie }, string>({
      query: (id) => `/admin/movies/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminMovie', id }],
    }),

    // Get movie analytics
    getMovieAnalytics: builder.query<MovieAnalytics, string>({
      query: (id) => `/admin/movies/${id}/analytics`,
      providesTags: (result, error, id) => [
        { type: 'AdminMovie', id: `analytics-${id}` },
      ],
    }),
  }),
});

export const {
  useCreateMovieMutation,
  useGetAdminMoviesQuery,
  useLazyGetAdminMoviesQuery,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
  useHardDeleteMovieMutation,
  useGetMovieByIdQuery,
  useGetMovieAnalyticsQuery,
} = adminMovieAPI;
