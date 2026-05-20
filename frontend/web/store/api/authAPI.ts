import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithRefresh } from '@/lib/baseQuery';
import type { User, SendOtpParams, VerifyOtpParams } from '@/types';

interface LoginParams {
  email: string;
  password: string;
}

interface SignupParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  otp: string;
  hash: string;
}

interface AuthResponse {
  message: string;
  user: User;
}

interface SendOtpResponse {
  hash: string;
  email: string;
  message: string;
}

export const authAPI = createApi({
  reducerPath: 'authAPI',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginParams>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    signup: builder.mutation<AuthResponse, SignupParams>({
      query: (body) => ({
        url: '/auth/signup',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    sendOtp: builder.mutation<SendOtpResponse, SendOtpParams>({
      query: ({ email }) => ({
        url: '/auth/send-otp',
        method: 'POST',
        body: { email },
      }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useSendOtpMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
} = authAPI;
