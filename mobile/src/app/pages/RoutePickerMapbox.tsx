import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  MapView,
  MarkerView,
  StyleURL,
  setAccessToken,
} from '@rnmapbox/maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getMapboxAccessToken } from '../utils/mapboxSupport';

type PickerRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type DraftLocation = {
  lat: number;
  lng: number;
  name: string;
};

type Props = {
  region: PickerRegion;
  draftLocation: DraftLocation | null;
  onSelectCoordinate: (latitude: number, longitude: number) => void;
};

function zoomLevelFromRegion(region: PickerRegion) {
  const longitudeDelta = Math.min(Math.max(region.longitudeDelta, 0.0005), 360);
  const derivedZoom = Math.log2(360 / longitudeDelta);
  return Math.max(1, Math.min(18, derivedZoom));
}

export default function RoutePickerMapbox({ region, draftLocation, onSelectCoordinate }: Props) {
  const token = getMapboxAccessToken();

  useEffect(() => {
    if (token) {
      setAccessToken(token);
    }
  }, [token]);

  const centerCoordinate = useMemo(
    () => [region.longitude, region.latitude] as [number, number],
    [region.latitude, region.longitude],
  );

  const zoomLevel = useMemo(() => zoomLevelFromRegion(region), [region]);

  const handleSelect = (event: any) => {
    const latitude = event?.geometry?.coordinates?.[1] ?? event?.coordinates?.latitude;
    const longitude = event?.geometry?.coordinates?.[0] ?? event?.coordinates?.longitude;

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      onSelectCoordinate(latitude, longitude);
    }
  };

  return (
    <MapView
      style={styles.map}
      styleURL={StyleURL.Street}
      scaleBarEnabled={false}
      logoEnabled={false}
      attributionEnabled
      zoomEnabled
      scrollEnabled
      rotateEnabled={false}
      pitchEnabled={false}
      onPress={handleSelect}
      onLongPress={handleSelect}
      testID="route-config-mapbox-picker"
    >
      <Camera centerCoordinate={centerCoordinate} zoomLevel={zoomLevel} animationDuration={250} />

      {draftLocation ? (
        <MarkerView
          coordinate={[draftLocation.lng, draftLocation.lat]}
          anchor={{ x: 0.5, y: 1 }}
          allowOverlap
          allowOverlapWithPuck
        >
          <View testID="route-config-draft-marker" style={styles.markerContainer}>
            <MaterialCommunityIcons name="map-marker" size={34} color="#2563eb" />
          </View>
        </MarkerView>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});