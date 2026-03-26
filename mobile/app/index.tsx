import { useContext } from 'react';
import { Redirect } from 'expo-router';

import { AuthContext } from '@/app/AuthContext';

export default function IndexScreen() {
  const { isLoggedIn } = useContext(AuthContext);

  return <Redirect href={isLoggedIn ? '/(tabs)/home-tab' : '/login'} />;
}
