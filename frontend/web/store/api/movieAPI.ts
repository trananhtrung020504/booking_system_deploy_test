import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type { Movie, MoviesResponse, GetMoviesParams } from '@/types';

export const movieAPI = createApi({
  reducerPath: 'movieAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Movie'],
  endpoints: (builder) => ({
    getMovies: builder.query<MoviesResponse, GetMoviesParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.genre) searchParams.set('genre', params.genre);
        if (params?.search) searchParams.set('search', params.search);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.sort) searchParams.set('sort', params.sort);
        const qs = searchParams.toString();
        return `/movies${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Movie'],
    }),
    getMovie: builder.query<Movie, string>({
      query: (id) => `/movies/${id}`,
      providesTags: (result, error, id) => [{ type: 'Movie', id }],
    }),
    getGenres: builder.query<string[], void>({
      query: () => '/movies/genres',
    }),
  }),
});

export const {
  useGetMoviesQuery,
  useGetMovieQuery,
  useLazyGetMoviesQuery,
  useGetGenresQuery,
} = movieAPI;
