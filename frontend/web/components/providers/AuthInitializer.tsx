'use client';

import { useEffect } from 'react';
import { useGetMeQuery } from '@/store/api/authAPI';
import { useAppDispatch } from '@/store/hooks';
import { setUser, clearUser, setLoading } from '@/store/slice/authSlice';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data: user, isLoading, isFetching, isError, isSuccess } = useGetMeQuery();

  useEffect(() => {
    if (isLoading || isFetching) {
      dispatch(setLoading(true));
    } else if (isSuccess && user) {
      dispatch(setUser(user));
    } else if (isError) {
      dispatch(clearUser());
    }
  }, [user, isLoading, isFetching, isError, isSuccess, dispatch]);

  return <>{children}</>;
}
