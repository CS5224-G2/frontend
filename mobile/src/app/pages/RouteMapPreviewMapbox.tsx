import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  LineLayer,
  MapView,
  MarkerView,
  ShapeSource,
  StyleURL,
  setAccessToken,
} from '@rnmapbox/maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { boundsFromCoordinates, type LngLat } from '@/utils/routeGeometry';
import { getMapboxAccessToken } from '../utils/mapboxSupport';

type RoutePreviewMarker = {
  id: string;
  coordinate: LngLat;
  color: string;
  kind?: 'start' | 'end' | 'waypoint' | 'poi';
  testID?: string;
};

type Props = {
  lineCoordinates: LngLat[];
  markers: RoutePreviewMarker[];
  strokeColor: string;
  testID: string;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
};

const RouteMapPreviewMapbox = memo(function RouteMapPreviewMapbox({
  lineCoordinates,
  markers,
  strokeColor,
  testID,
  zoomEnabled = true,
  scrollEnabled = true,
}: Props) {
  const token = getMapboxAccessToken();

  useEffect(() => {
    if (token) {
      setAccessToken(token);
    }
  }, [token]);

  const bounds = useMemo(() => {
    const points = [...lineCoordinates, ...markers.map((marker) => marker.coordinate)];
    return boundsFromCoordinates(points);
  }, [lineCoordinates, markers]);

  const lineFeature = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: lineCoordinates,
      },
    }),
    [lineCoordinates],
  );

  return (
    <MapView
      style={styles.map}
      styleURL={StyleURL.Street}
      scaleBarEnabled={false}
      logoEnabled={false}
      attributionEnabled
      zoomEnabled={zoomEnabled}
      scrollEnabled={scrollEnabled}
      rotateEnabled={false}
      pitchEnabled={false}
      testID={testID}
    >
      <Camera
        bounds={{
          ne: bounds.ne,
          sw: bounds.sw,
          paddingTop: 28,
          paddingBottom: 28,
          paddingLeft: 28,
          paddingRight: 28,
        }}
        animationDuration={0}
      />

      {lineCoordinates.length >= 2 ? (
        <ShapeSource id={`${testID}-route-line`} shape={lineFeature}>
          <LineLayer
            id={`${testID}-route-layer`}
            style={{
              lineColor: strokeColor,
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      ) : null}

      {markers.map((marker) => (
        <MarkerView
          key={marker.id}
          coordinate={marker.coordinate}
          anchor={{ x: 0.5, y: 1 }}
          allowOverlap
          allowOverlapWithPuck
        >
          <View testID={marker.testID} style={styles.markerContainer}>
            {marker.kind === 'start' || marker.kind === 'end' ? (
              <View
                style={[
                  styles.endpointMarker,
                  {
                    backgroundColor: marker.color,
                    borderColor: '#ffffff',
                  },
                ]}
              />
            ) : (
              <MaterialCommunityIcons name="map-marker" size={30} color={marker.color} />
            )}
          </View>
        </MarkerView>
      ))}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 240,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  endpointMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
});

export default RouteMapPreviewMapbox;
