import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1/web',
  credentials: 'include', // Send cookies automatically
  prepareHeaders: (headers) => {
    headers.set('ngrok-skip-browser-warning', 'true');
    return headers;
  },
});

export const baseQueryWithRefresh: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (
    result.error &&
    result.error.status === 401 &&
    ((result.error.data as { message?: string })?.message?.includes('Token hết hạn') || 
     (result.error.data as { message?: string })?.message?.includes('Mã xác thực không hợp lệ'))
  ) {
    // Try to refresh the token
    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Retry the original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed - Clear auth state
      const { clearUser } = await import('@/store/slice/authSlice');
      api.dispatch(clearUser());
      
      return {
        error: {
          status: 401,
          data: { message: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' },
        },
      };
    }
  }

  return result;
};
