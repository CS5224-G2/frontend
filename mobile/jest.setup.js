// Avoid Jest hangs with react-native + certain async patterns (see @rnmapbox/maps/setup-jest).
delete global.MessageChannel;

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
    BestForNavigation: 6,
  },
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
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
