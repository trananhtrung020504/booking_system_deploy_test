import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';

export interface Voucher {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  expiresAt: string;
  isActive: boolean;
}

interface VouchersResponse {
  success: boolean;
  vouchers: Voucher[];
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
  }),
});

export const {
  useGetVouchersQuery,
} = voucherAPI;
