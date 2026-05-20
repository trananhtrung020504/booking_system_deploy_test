import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type { Theater, GetAdminTheatersParams } from '@/types';

interface PublicTheatersResponse {
  theaters: (Theater & { activeShowsCount: number })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const theaterAPI = createApi({
  reducerPath: 'theaterAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Theater'],
  endpoints: (builder) => ({
    getTheaters: builder.query<PublicTheatersResponse, GetAdminTheatersParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.city) searchParams.set('city', params.city);
        if (params?.search) searchParams.set('search', params.search);
        const qs = searchParams.toString();
        return `/theaters${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Theater'],
    }),
    getCities: builder.query<string[], void>({
      query: () => '/theaters/cities',
    }),
  }),
});

export const {
  useGetTheatersQuery,
  useGetCitiesQuery,
} = theaterAPI;
