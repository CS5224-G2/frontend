import { useContext } from 'react';
import { Redirect } from 'expo-router';

import { AuthContext } from '@/app/AuthContext';

export default function IndexScreen() {
  const { isLoggedIn, user } = useContext(AuthContext);

  if (!isLoggedIn) return <Redirect href="/login" />;
  if (!user?.onboardingComplete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home-tab" />;
}
