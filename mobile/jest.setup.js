// Avoid Jest hangs with react-native + certain async patterns (see @rnmapbox/maps/setup-jest).
delete global.MessageChannel;

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-location', () => ({
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
