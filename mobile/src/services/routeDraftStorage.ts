import AsyncStorage from '@react-native-async-storage/async-storage';

export const ROUTE_REQUEST_STORAGE_KEY = 'routeRecommendationRequest';
export const LEGACY_ROUTE_START_STORAGE_KEY = 'routeStartPoint';
export const LEGACY_ROUTE_END_STORAGE_KEY = 'routeEndPoint';

export async function clearRouteDraft(): Promise<void> {
  await AsyncStorage.multiRemove([
    ROUTE_REQUEST_STORAGE_KEY,
    LEGACY_ROUTE_START_STORAGE_KEY,
    LEGACY_ROUTE_END_STORAGE_KEY,
  ]);
}
