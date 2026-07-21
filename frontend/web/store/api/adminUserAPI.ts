import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type {
  PaginationInfo,
} from '@/types';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
  avatar: { source: string } | null;
  _count: { bookings: number };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  stats: {
    total: number;
    active: number;
    locked: number;
  };
  pagination: PaginationInfo;
}

export interface GetAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
}

export const adminUserAPI = createApi({
  reducerPath: 'adminUserAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['AdminUser'],
  endpoints: (builder) => ({
    getAdminUsers: builder.query<AdminUsersResponse, GetAdminUsersParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.search) searchParams.set('search', params.search);
        if (params?.role) searchParams.set('role', params.role);
        if (params?.isActive) searchParams.set('isActive', params.isActive);
        const qs = searchParams.toString();
        return `/admin/users${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminUser'],
    }),

    toggleUserActive: builder.mutation<
      { message: string; user: AdminUser },
      string
    >({
      query: (id) => ({
        url: `/admin/users/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminUser'],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useToggleUserActiveMutation,
} = adminUserAPI;
