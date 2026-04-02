import { useContext } from 'react';
import { Redirect } from 'expo-router';

import { AuthContext } from '@/app/AuthContext';
import OnboardingPage from '@/app/pages/OnboardingPage';

export default function OnboardingRoute() {
  const { isLoggedIn, user } = useContext(AuthContext);

  if (isLoggedIn && user?.onboardingComplete) {
    return <Redirect href="/(tabs)/home-tab" />;
  }

  return <OnboardingPage />;
}
