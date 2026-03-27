import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import LiveMapExpoGoScreen from './LiveMapExpoGoScreen';

/**
 * Expo Go does not include @rnmapbox/maps native binaries. Do not `import` the Mapbox screen
 * at module scope — only `require` it when running in a dev/standalone build with native Mapbox.
 *
 * Uses `require()` (not `import()`) so Jest and Metro behave consistently.
 */
const mapboxNativeUnavailable =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Platform.OS === 'web';

export default function LiveMapScreen() {
  if (mapboxNativeUnavailable) {
    return <LiveMapExpoGoScreen />;
  }

  const LiveMapMapboxScreen = require('./LiveMapMapbox').default;
  return <LiveMapMapboxScreen />;
}
