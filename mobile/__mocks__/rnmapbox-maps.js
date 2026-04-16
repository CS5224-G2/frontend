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
  MarkerView: ({ children, ...props }) => React.createElement(View, props, children),
  PointAnnotation: ({ children, ...props }) => React.createElement(View, props, children),
  ShapeSource: ({ children }) => React.createElement(View, { testID: 'mock-shape-source' }, children),
  LineLayer: () => null,
  CircleLayer: () => null,
  SymbolLayer: () => null,
  Images: () => null,
};
