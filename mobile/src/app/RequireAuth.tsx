import { useContext } from 'react';
import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';

import { AuthContext } from './AuthContext';

type RequireAuthProps = {
  children: ReactNode;
};

export default function RequireAuth({ children }: Readonly<RequireAuthProps>) {
  const { isLoggedIn, isRestoring } = useContext(AuthContext);

  if (isRestoring) {
    return null;
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}
