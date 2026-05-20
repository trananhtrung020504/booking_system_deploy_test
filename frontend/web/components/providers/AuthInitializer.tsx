'use client';

import { useEffect } from 'react';
import { useGetMeQuery } from '@/store/api/authAPI';
import { useAppDispatch } from '@/store/hooks';
import { setUser, clearUser, setLoading } from '@/store/slice/authSlice';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data: user, isLoading, isError } = useGetMeQuery();

  useEffect(() => {
    if (isLoading) {
      dispatch(setLoading(true));
    } else if (user) {
      dispatch(setUser(user));
    } else {
      dispatch(clearUser());
    }
  }, [user, isLoading, isError, dispatch]);

  return <>{children}</>;
}
