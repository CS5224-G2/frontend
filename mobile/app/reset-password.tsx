import { useContext } from 'react';
import { Redirect } from 'expo-router';

import { AuthContext } from '@/app/AuthContext';
import ResetPasswordPage from '@/app/pages/ResetPasswordPage';

export default function ResetPasswordRoute() {
  const { isLoggedIn } = useContext(AuthContext);

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home-tab" />;
  }

  return <ResetPasswordPage />;
}
