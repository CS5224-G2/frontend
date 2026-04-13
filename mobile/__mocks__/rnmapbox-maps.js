const React = require('react');
const { View } = require('react-native');

const MapView = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref, testID: props.testID })
);

module.exports = {
  __esModule: true,
  setAccessToken: jest.fn(),
  StyleURL: { Street: 'mapbox://styles/mapbox/streets-v11' },
  MapView,
  Camera: () => null,
  ShapeSource: ({ children }) => React.createElement(View, { testID: 'mock-shape-source' }, children),
  LineLayer: () => null,
  CircleLayer: () => null,
  SymbolLayer: () => null,
  Images: () => null,
};
