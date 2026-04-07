import { useContext } from 'react';
import { Redirect } from 'expo-router';

import { AuthContext } from '@/app/AuthContext';
import ForgotPasswordPage from '@/app/pages/ForgotPasswordPage';

export default function ForgotPasswordRoute() {
  const { isLoggedIn } = useContext(AuthContext);

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home-tab" />;
  }

  return <ForgotPasswordPage />;
}
