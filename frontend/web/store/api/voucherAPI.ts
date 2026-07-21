import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';

export interface Voucher {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrder: number;
  maxDiscount?: number | null;
  expiresAt: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  _count?: { bookings: number };
}

interface VouchersResponse {
  success: boolean;
  vouchers: Voucher[];
}

export interface AdminVouchersResponse extends VouchersResponse {
  stats: {
    total: number;
    active: number;
    inactive: number;
    expired: number;
  };
}

export interface VoucherPayload {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrder: number;
  maxDiscount?: number | null;
  usageLimit: number;
  expiresAt: string;
  isActive: boolean;
}

export const voucherAPI = createApi({
  reducerPath: 'voucherAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Voucher'],
  endpoints: (builder) => ({
    getVouchers: builder.query<VouchersResponse, void>({
      query: () => '/vouchers',
      providesTags: ['Voucher'],
    }),
    getAdminVouchers: builder.query<AdminVouchersResponse, { search?: string; isActive?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set('search', params.search);
        if (params?.isActive) searchParams.set('isActive', params.isActive);
        const qs = searchParams.toString();
        return `/admin/vouchers${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Voucher'],
    }),
    createVoucher: builder.mutation<{ message: string; voucher: Voucher }, VoucherPayload>({
      query: (body) => ({
        url: '/admin/vouchers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Voucher'],
    }),
    updateVoucher: builder.mutation<{ message: string; voucher: Voucher }, { id: string; data: VoucherPayload }>({
      query: ({ id, data }) => ({
        url: `/admin/vouchers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Voucher'],
    }),
    toggleVoucherActive: builder.mutation<{ message: string; voucher: Voucher }, string>({
      query: (id) => ({
        url: `/admin/vouchers/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Voucher'],
    }),
    deleteVoucher: builder.mutation<{ message: string; voucher?: Voucher }, string>({
      query: (id) => ({
        url: `/admin/vouchers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Voucher'],
    }),
  }),
});

export const {
  useGetVouchersQuery,
  useGetAdminVouchersQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useToggleVoucherActiveMutation,
  useDeleteVoucherMutation,
} = voucherAPI;
