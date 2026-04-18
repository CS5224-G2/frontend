// Avoid Jest hangs with react-native + certain async patterns (see @rnmapbox/maps/setup-jest).
delete global.MessageChannel;

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
    BestForNavigation: 6,
    High: 6,
  },
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
  isBackgroundLocationAvailableAsync: jest.fn(() => Promise.resolve(true)),
  hasStartedLocationUpdatesAsync: jest.fn(() => Promise.resolve(false)),
  startLocationUpdatesAsync: jest.fn(() => Promise.resolve()),
  stopLocationUpdatesAsync: jest.fn(() => Promise.resolve()),
  getLastKnownPositionAsync: jest.fn(() => Promise.resolve(null)),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 1.3001,
        longitude: 103.7701,
        accuracy: 10,
      },
    })
  ),
  watchPositionAsync: jest.fn((_options, callback) => {
    callback({
      coords: {
        latitude: 1.3001,
        longitude: 103.7701,
        accuracy: 10,
      },
    });
    return Promise.resolve({
      remove: jest.fn(),
    });
  }),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  IosAuthorizationStatus: {
    PROVISIONAL: 3,
  },
  AndroidImportance: {
    MAX: 7,
  },
  AndroidNotificationVisibility: {
    PUBLIC: 1,
  },
  AndroidNotificationPriority: {
    DEFAULT: 'default',
    MAX: 'max',
  },
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
  },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
}));

const mockAsyncStorageStore = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key) => Promise.resolve(mockAsyncStorageStore.get(key) ?? null)),
    setItem: jest.fn((key, value) => {
      mockAsyncStorageStore.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      mockAsyncStorageStore.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      mockAsyncStorageStore.clear();
      return Promise.resolve();
    }),
  },
}));

jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockSlider(props) {
    return (
      <View testID={props.testID}>
        <Text>{props.value}</Text>
      </View>
    );
  };
});
