import { useLocalSearchParams } from 'expo-router';

import LiveMapPage from '../../src/screens/LiveMapPage';

export default function LiveMapScreen() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  return <LiveMapPage routeId={routeId} />;
}
