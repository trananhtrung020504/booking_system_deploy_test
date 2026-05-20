import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type { Combo } from '@/types';

export const comboAPI = createApi({
  reducerPath: 'comboAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Combo'],
  endpoints: (builder) => ({
    getCombos: builder.query<Combo[], { all?: boolean } | void>({
      query: (params) => ({
        url: '/combos',
        params: params || undefined,
      }),
      providesTags: ['Combo'],
    }),
    createCombo: builder.mutation<Combo, FormData>({
      query: (formData) => ({
        url: '/combos',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Combo'],
    }),
    updateCombo: builder.mutation<Combo, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/combos/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Combo'],
    }),
    deleteCombo: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/combos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Combo'],
    }),
  }),
});

export const {
  useGetCombosQuery,
  useCreateComboMutation,
  useUpdateComboMutation,
  useDeleteComboMutation,
} = comboAPI;
