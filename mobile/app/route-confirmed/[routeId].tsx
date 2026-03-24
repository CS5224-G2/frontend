import { useLocalSearchParams } from 'expo-router';

import RouteConfirmedPage from '../../src/screens/RouteConfirmedPage';

export default function RouteConfirmedScreen() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  return <RouteConfirmedPage routeId={routeId} />;
}
