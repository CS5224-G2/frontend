import { useContext } from 'react';
import { Redirect } from 'expo-router';

import { AuthContext } from '@/app/AuthContext';
import RegisterPage from '@/app/pages/RegisterPage';

export default function RegisterRoute() {
  const { isLoggedIn } = useContext(AuthContext);

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home-tab" />;
  }

  return <RegisterPage />;
}
