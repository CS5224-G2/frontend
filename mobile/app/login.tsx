import { useContext } from 'react';
import { Redirect } from 'expo-router';

import { AuthContext } from '@/app/AuthContext';
import LoginPage from '@/app/pages/LoginPage';

export default function LoginRoute() {
  const { isLoggedIn } = useContext(AuthContext);

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home-tab" />;
  }

  return <LoginPage />;
}
