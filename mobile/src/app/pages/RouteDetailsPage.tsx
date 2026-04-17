import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { type Route } from '../../../../shared/types/index';
import { resolveRouteById } from '../../services/routeLookup';
import {
  formatRouteElevation,
  hasRouteCoordinates,
  routeCoordinateSubtitle,
} from '../utils/routeDisplay';
import { mapDotMarkerProps, mapPinMarkerProps } from '../utils/mapMarkers';
import { isLikelyHawkerCentre } from '../utils/poiLabels';
import { useRouteEndpointLabels } from '../utils/placeGeocode';
import { useFloatingTabBarScrollPadding } from '../utils/floatingTabBarInset';
import { fitRegionForCoordinates, routeToLineCoordinates, routeToMapCoordinates } from '@/utils/routeGeometry';
import { canUseAndroidMapbox } from '../utils/mapboxSupport';

export default function RouteDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const routeNav = useRoute<any>();
  const routeParam = routeNav.params?.route as Route | undefined;
  const routeId = (routeNav.params?.routeId as string | undefined) ?? routeParam?.id;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [route, setRoute] = useState<Route | null>(routeParam ?? null);
  const [loading, setLoading] = useState(!routeParam);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!routeId) {
        if (!cancelled) {
          setRoute(routeParam ?? null);
          setLoading(false);
        }
        return;
      }

      if (!routeParam) {
        setLoading(true);
      }

      const r = await resolveRouteById(routeId);
      if (!cancelled) {
        setRoute(r ?? routeParam ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const handleSafeBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomePage' }],
    });
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: (props) => <HeaderBackButton {...props} onPress={handleSafeBack} />,
    });
  }, [navigation, handleSafeBack]);

  const { startLabel, endLabel } = useRouteEndpointLabels(route);
  const scrollBottomPad = useFloatingTabBarScrollPadding(20);
  const androidMapboxEnabled = canUseAndroidMapbox();
  const RouteMapPreviewMapbox =
    androidMapboxEnabled ? require('./RouteMapPreviewMapbox').default : null;

  const polylineCoords = useMemo(() => (route ? routeToMapCoordinates(route) : []), [route]);
  const lineCoords = useMemo(
    () => (route ? routeToLineCoordinates(route).filter(([lng, lat]) => hasRouteCoordinates(lat, lng)) : []),
    [route],
  );

  const mapRegion = useMemo(() => {
    if (!route) {
      return fitRegionForCoordinates([]);
    }
    const points = [...polylineCoords];
    points.push(
      { latitude: route.startPoint.lat, longitude: route.startPoint.lng },
      { latitude: route.endPoint.lat, longitude: route.endPoint.lng },
    );
    route.checkpoints.forEach((c) => {
      if (hasRouteCoordinates(c.lat, c.lng)) {
        points.push({ latitude: c.lat, longitude: c.lng });
      }
    });
    (route.pointsOfInterestVisited ?? []).forEach((poi) => {
      if (typeof poi.lat === 'number' && typeof poi.lng === 'number') {
        points.push({ latitude: poi.lat, longitude: poi.lng });
      }
    });
    return fitRegionForCoordinates(points);
  }, [route, polylineCoords]);

  const mapUsable = Boolean(
    route &&
      (polylineCoords.length >= 1 ||
        hasRouteCoordinates(route.startPoint.lat, route.startPoint.lng) ||
        hasRouteCoordinates(route.endPoint.lat, route.endPoint.lng) ||
        route.checkpoints.some((c) => hasRouteCoordinates(c.lat, c.lng))),
  );
  const showIosEmbeddedMap = mapUsable && Platform.OS !== 'android';
  const showAndroidMapboxMap = mapUsable && Platform.OS === 'android' && androidMapboxEnabled && RouteMapPreviewMapbox;

  const mapboxMarkers = useMemo(() => {
    if (!route) {
      return [];
    }

    const markers = [] as Array<{
      id: string;
      coordinate: [number, number];
      color: string;
      kind?: 'start' | 'end' | 'waypoint' | 'poi';
      testID?: string;
    }>;

    if (hasRouteCoordinates(route.startPoint.lat, route.startPoint.lng)) {
      markers.push({
        id: 'route-start',
        coordinate: [route.startPoint.lng, route.startPoint.lat],
        color: '#22c55e',
        kind: 'start',
        testID: 'route-details-marker-start',
      });
    }

    route.checkpoints.forEach((checkpoint) => {
      if (hasRouteCoordinates(checkpoint.lat, checkpoint.lng)) {
        markers.push({
          id: checkpoint.id,
          coordinate: [checkpoint.lng, checkpoint.lat],
          color: '#2563eb',
          kind: 'waypoint',
        });
      }
    });

    (route.pointsOfInterestVisited ?? []).forEach((poi, index) => {
      if (typeof poi.lat === 'number' && typeof poi.lng === 'number') {
        markers.push({
          id: `poi-${poi.name}-${index}`,
          coordinate: [poi.lng, poi.lat],
          color: '#f59e0b',
          kind: 'poi',
        });
      }
    });

    if (hasRouteCoordinates(route.endPoint.lat, route.endPoint.lng)) {
      markers.push({
        id: 'route-end',
        coordinate: [route.endPoint.lng, route.endPoint.lat],
        color: '#ef4444',
        kind: 'end',
        testID: 'route-details-marker-end',
      });
    }

    return markers;
  }, [route]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f3f4f6] dark:bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!route) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f3f4f6] dark:bg-black px-6">
        <Text className="text-base text-[#64748b] dark:text-slate-400 mb-4 text-center">Route not found</Text>
        <Pressable
          className="bg-[#e2e8f0] dark:bg-[#2d2d2d] px-5 py-3 rounded-xl"
          onPress={handleSafeBack}
        >
          <Text className="font-bold text-[#0f172a] dark:text-slate-100">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#f3f4f6] dark:bg-black"
      contentContainerStyle={{ paddingBottom: scrollBottomPad }}
      scrollIndicatorInsets={{ right: 1 }}
    >
      <View className="px-cy-lg pt-2">
        <View className="bg-white dark:bg-[#111111] rounded-cy-md p-cy-md border border-[#e5e7eb] dark:border-[#2d2d2d] mb-cy-md">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-[#1f2937] dark:text-slate-100 mb-1">{route.name}</Text>
              <Text className="text-sm text-[#6b7280] dark:text-slate-400 leading-[20px]">{route.description}</Text>
            </View>
            <View className="bg-[#e0e7ff] dark:bg-[#1e1b4b] px-cy-sm py-1 rounded-md">
              <Text className="text-xs text-[#4f46e5] dark:text-indigo-300 capitalize">{route.cyclistType}</Text>
            </View>
          </View>
        </View>

        <View className="mb-cy-md rounded-cy-md overflow-hidden border border-[#bfdbfe] dark:border-[#1e3a5f] min-h-[220px] bg-[#e2e8f0] dark:bg-[#0c1929]">
          {showIosEmbeddedMap ? (
            <MapView
              style={{ width: '100%', height: 240 }}
              initialRegion={mapRegion}
              scrollEnabled
              zoomEnabled
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              testID="route-details-map"
            >
              {polylineCoords.length >= 2 ? (
                <Polyline
                  coordinates={polylineCoords}
                  strokeColor="#2563eb"
                  strokeWidth={4}
                />
              ) : null}

              {hasRouteCoordinates(route.startPoint.lat, route.startPoint.lng) ? (
                <Marker
                  coordinate={{ latitude: route.startPoint.lat, longitude: route.startPoint.lng }}
                  title="Start"
                  description={startLabel}
                  testID="route-details-marker-start"
                  {...mapDotMarkerProps()}
                >
                  <View style={styles.markerStart} />
                </Marker>
              ) : null}

              {route.checkpoints.map((cp) =>
                hasRouteCoordinates(cp.lat, cp.lng) ? (
                  <Marker
                    key={cp.id}
                    coordinate={{ latitude: cp.lat, longitude: cp.lng }}
                    title={cp.name}
                    description={cp.description}
                    {...mapPinMarkerProps()}
                  >
                    <MaterialCommunityIcons name="map-marker" size={28} color="#2563eb" />
                  </Marker>
                ) : null,
              )}

              {(route.pointsOfInterestVisited ?? []).map((poi, i) => {
                if (typeof poi.lat !== 'number' || typeof poi.lng !== 'number') return null;
                const hawker = isLikelyHawkerCentre(poi.name);
                return (
                  <Marker
                    key={`poi-${poi.name}-${i}`}
                    coordinate={{ latitude: poi.lat, longitude: poi.lng }}
                    title={poi.name}
                    description={poi.description}
                    {...mapPinMarkerProps()}
                  >
                    <MaterialCommunityIcons
                      name={hawker ? 'food' : 'map-marker'}
                      size={26}
                      color={hawker ? '#be185d' : '#f59e0b'}
                    />
                  </Marker>
                );
              })}

              {hasRouteCoordinates(route.endPoint.lat, route.endPoint.lng) ? (
                <Marker
                  coordinate={{ latitude: route.endPoint.lat, longitude: route.endPoint.lng }}
                  title="End"
                  description={endLabel}
                  testID="route-details-marker-end"
                  {...mapDotMarkerProps()}
                >
                  <View style={styles.markerEnd} />
                </Marker>
              ) : null}
            </MapView>
          ) : showAndroidMapboxMap ? (
            <RouteMapPreviewMapbox
              lineCoordinates={lineCoords}
              markers={mapboxMarkers}
              strokeColor="#2563eb"
              testID="route-details-map"
            />
          ) : (
            <View className="flex-1 min-h-[220px] items-center justify-center px-cy-md py-cy-lg">
              <MaterialCommunityIcons name="map-search-outline" size={48} color={isDark ? '#64748b' : '#64748b'} />
              <Text className="text-base font-semibold text-[#475569] dark:text-slate-400 mt-2 text-center">
                {Platform.OS === 'android' && !androidMapboxEnabled ? 'Mapbox preview unavailable' : 'Map preview unavailable'}
              </Text>
              <Text className="text-xs text-[#64748b] dark:text-slate-500 text-center mt-1 px-4">
                {Platform.OS === 'android' && !androidMapboxEnabled
                  ? 'Use a development build with EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN configured to render the Android route preview with Mapbox.'
                  : 'This route has no coordinates yet. Once the backend returns start/end points, checkpoints, or a route_path, the map will show here.'}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row flex-wrap gap-cy-sm mb-cy-md">
          <View className="flex-1 min-w-[30%] bg-white dark:bg-[#111111] rounded-cy-md p-cy-md border border-[#e5e7eb] dark:border-[#2d2d2d] items-center">
            <MaterialCommunityIcons name="map-marker-distance" size={22} color="#2563eb" />
            <Text className="text-xl font-bold text-[#1f2937] dark:text-slate-100 mt-1">{route.distance}</Text>
            <Text className="text-xs text-[#6b7280] dark:text-slate-400">km</Text>
          </View>
          <View className="flex-1 min-w-[30%] bg-white dark:bg-[#111111] rounded-cy-md p-cy-md border border-[#e5e7eb] dark:border-[#2d2d2d] items-center">
            <MaterialCommunityIcons name="terrain" size={22} color="#16a34a" />
            <Text className="text-xl font-bold text-[#1f2937] dark:text-slate-100 mt-1" numberOfLines={1}>
              {formatRouteElevation(route.elevation)}
            </Text>
            <Text className="text-xs text-[#6b7280] dark:text-slate-400">Elevation</Text>
          </View>
          <View className="flex-1 min-w-[30%] bg-white dark:bg-[#111111] rounded-cy-md p-cy-md border border-[#e5e7eb] dark:border-[#2d2d2d] items-center">
            <MaterialCommunityIcons name="clock-outline" size={22} color="#ea580c" />
            <Text className="text-xl font-bold text-[#1f2937] dark:text-slate-100 mt-1">{route.estimatedTime}</Text>
            <Text className="text-xs text-[#6b7280] dark:text-slate-400">min</Text>
          </View>
        </View>

        <View className="bg-white dark:bg-[#111111] rounded-cy-md p-cy-md border border-[#e5e7eb] dark:border-[#2d2d2d] mb-cy-md">
          <Text className="text-base font-bold text-[#1f2937] dark:text-slate-100 mb-3">Route points</Text>
          <View className="flex-row items-start gap-3 mb-3">
            <View className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
            <View className="flex-1">
              <Text className="font-semibold text-[#1f2937] dark:text-slate-100">Start</Text>
              <Text className="text-sm text-[#1f2937] dark:text-slate-200 mt-0.5">{startLabel}</Text>
              {routeCoordinateSubtitle(route.startPoint.lat, route.startPoint.lng) ? (
                <Text className="text-xs text-[#6b7280] dark:text-slate-500 mt-1 font-mono">
                  {routeCoordinateSubtitle(route.startPoint.lat, route.startPoint.lng)}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="flex-row items-start gap-3">
            <View className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
            <View className="flex-1">
              <Text className="font-semibold text-[#1f2937] dark:text-slate-100">End</Text>
              <Text className="text-sm text-[#1f2937] dark:text-slate-200 mt-0.5">{endLabel}</Text>
              {routeCoordinateSubtitle(route.endPoint.lat, route.endPoint.lng) ? (
                <Text className="text-xs text-[#6b7280] dark:text-slate-500 mt-1 font-mono">
                  {routeCoordinateSubtitle(route.endPoint.lat, route.endPoint.lng)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View className="bg-white dark:bg-[#111111] rounded-cy-md p-cy-md border border-[#e5e7eb] dark:border-[#2d2d2d] mb-cy-md">
          <Text className="text-base font-bold text-[#1f2937] dark:text-slate-100 mb-3">
            Checkpoints ({route.checkpoints.length})
          </Text>
          {route.checkpoints.map((cp, index) => (
            <View
              key={cp.id}
              className="flex-row items-start gap-3 p-3 mb-2 last:mb-0 bg-[#f9fafb] dark:bg-[#1a1a1a] rounded-cy-sm"
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="#2563eb" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="font-semibold text-[#1f2937] dark:text-slate-100">
                  {index + 1}. {cp.name}
                </Text>
                <Text className="text-sm text-[#6b7280] dark:text-slate-400 mt-0.5">{cp.description}</Text>
                {routeCoordinateSubtitle(cp.lat, cp.lng) ? (
                  <Text className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1 font-mono">
                    {routeCoordinateSubtitle(cp.lat, cp.lng)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View className="bg-white dark:bg-[#111111] rounded-cy-md p-cy-md border border-[#e5e7eb] dark:border-[#2d2d2d] mb-cy-md flex-row items-center gap-2">
          <MaterialCommunityIcons name="star" size={24} color="#f59e0b" />
          <Text className="text-2xl font-bold text-[#1f2937] dark:text-slate-100">{route.rating}</Text>
          <Text className="text-sm text-[#6b7280] dark:text-slate-400">({route.reviewCount} reviews)</Text>
        </View>

        <Pressable
          className="bg-[#2563eb] rounded-cy-md py-4 items-center"
          onPress={() => navigation.navigate('RouteConfirmed', { routeId: route.id, route })}
          testID="route-details-confirm"
        >
          <Text className="text-white text-base font-bold">Confirm route</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  markerStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerEnd: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
