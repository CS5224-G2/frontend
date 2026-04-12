import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export function getMapboxAccessToken() {
  return process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
}

export function hasNativeMapboxRuntime() {
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && Platform.OS !== 'web';
}

export function canUseAndroidMapbox() {
  return Platform.OS === 'android' && hasNativeMapboxRuntime() && getMapboxAccessToken().length > 0;
}
