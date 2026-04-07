/** AsyncStorage keys — match User Journey web localStorage names where applicable. */
export const STORAGE_KEYS = {
  userPreferences: 'userPreferences',
  routeStartPoint: 'routeStartPoint',
  routeEndPoint: 'routeEndPoint',
  activeRideSession: 'activeRideSession',
  rideNotificationIds: 'rideNotificationIds',
} as const;
