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
  },
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  isBackgroundLocationAvailableAsync: jest.fn(() => Promise.resolve(true)),
  hasStartedLocationUpdatesAsync: jest.fn(() => Promise.resolve(false)),
  startLocationUpdatesAsync: jest.fn(() => Promise.resolve()),
  stopLocationUpdatesAsync: jest.fn(() => Promise.resolve()),
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
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  Accuracy: { Balanced: 4, High: 6 },
  watchPositionAsync: jest.fn((_options, callback) => {
    const subscription = { remove: jest.fn() };
    return new Promise((resolve) => {
      setImmediate(() => {
        if (typeof callback === 'function') {
          callback({
            coords: {
              latitude: 1.2966,
              longitude: 103.7764,
              altitude: null,
              accuracy: 12,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        }
        resolve(subscription);
      });
    });
  }),
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  IosAuthorizationStatus: {
    PROVISIONAL: 3,
  },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  dismissNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
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
