import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../components/native/Common';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { type RideHistory, type Route } from '../../../../shared/types/index';
import { getRideById } from '../../services/rideService';
import { resolveRouteById } from '../../services/routeLookup';
import { useFloatingTabBarScrollPadding } from '../utils/floatingTabBarInset';
import {
  fitRegionForCoordinates,
  projectPointOntoRoute,
  routeToLineCoordinates,
  routeToMapCoordinates,
} from '@/utils/routeGeometry';
import { canUseAndroidMapbox } from '../utils/mapboxSupport';
import { mapPinMarkerProps } from '../utils/mapMarkers';
import { isLikelyHawkerCentre } from '../utils/poiLabels';
import { formatRouteElevation } from '../utils/routeDisplay';

type Props = NativeStackScreenProps<any, 'HistoryDetails'>;

function formatCyclistTypeLabel(value: Route['cyclistType'] | undefined): string {
  if (!value) {
    return 'General';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatShadeSummary(value: Route['shade'] | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `Shade ${Math.round(value)}%`;
  }

  if (value === 'reduce-shade') {
    return 'Shade preferred';
  }

  return 'Shade flexible';
}

function formatAirQualitySummary(value: Route['airQuality'] | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `Air ${Math.round(value)}/100`;
  }

  if (value === 'care') {
    return 'Air monitored';
  }

  return 'Air flexible';
}

export default function RouteHistoryDetailsPage({ navigation, route }: Props) {
  const { rideId } = route.params as { rideId: string };
  const [ride, setRide] = useState<RideHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollBottomPad = useFloatingTabBarScrollPadding(40);
  const androidMapboxEnabled = canUseAndroidMapbox();
  const RouteMapPreviewMapbox =
    androidMapboxEnabled ? require('./RouteMapPreviewMapbox').default : null;

  useEffect(() => {
    const loadData = async () => {
      const rideData = await getRideById(rideId);
      if (rideData) {
        const embeddedRoute = rideData.routeDetails;
        const embeddedRouteHasGeometry = Boolean(
          embeddedRoute &&
            (routeToMapCoordinates(embeddedRoute).some(
              (point) => !(point.latitude === 0 && point.longitude === 0),
            ) ||
              embeddedRoute.checkpoints.some((checkpoint) => !(checkpoint.lat === 0 && checkpoint.lng === 0)) ||
              (embeddedRoute.pointsOfInterestVisited ?? []).some(
                (poi) => typeof poi.lat === 'number' && typeof poi.lng === 'number' && !(poi.lat === 0 && poi.lng === 0),
              ) ||
              !(embeddedRoute.startPoint.lat === 0 && embeddedRoute.startPoint.lng === 0) ||
              !(embeddedRoute.endPoint.lat === 0 && embeddedRoute.endPoint.lng === 0)),
        );
        const fallbackRoute =
          embeddedRouteHasGeometry
            ? embeddedRoute
            : (await resolveRouteById(rideData.routeId).catch(() => null)) ?? embeddedRoute;
        setRide(
          fallbackRoute
            ? {
                ...rideData,
                routeDetails: fallbackRoute,
              }
            : rideData,
        );
      }
      setIsLoading(false);
    };
    void loadData();
  }, [rideId]);

  const routeInfo = ride?.routeDetails ?? null;
  const visitedCheckpoints = (ride?.visitedCheckpoints ?? routeInfo?.checkpoints ?? []).filter(
    (checkpoint) =>
      Number.isFinite(checkpoint.lat) &&
      Number.isFinite(checkpoint.lng) &&
      !(checkpoint.lat === 0 && checkpoint.lng === 0),
  );
  const visitedPois = ride?.pointsOfInterestVisited ?? routeInfo?.pointsOfInterestVisited ?? [];
  const visitedPoisWithCoords = visitedPois.filter(
    (poi): poi is { name: string; description?: string; lat: number; lng: number } =>
      typeof poi.lat === 'number' &&
      typeof poi.lng === 'number' &&
      !(poi.lat === 0 && poi.lng === 0),
  );

  const lineCoords = useMemo(
    () =>
      routeInfo
        ? routeToLineCoordinates(routeInfo).filter(([lng, lat]) => !(lat === 0 && lng === 0))
        : [],
    [routeInfo],
  );

  const snapToRenderedRoute = useMemo(() => {
    return (lat: number, lng: number) => {
      if (!(Number.isFinite(lat) && Number.isFinite(lng)) || (lat === 0 && lng === 0)) {
        return null;
      }

      if (lineCoords.length < 2) {
        return { latitude: lat, longitude: lng };
      }

      const { snappedPoint } = projectPointOntoRoute(lineCoords, [lng, lat]);
      return { latitude: snappedPoint[1], longitude: snappedPoint[0] };
    };
  }, [lineCoords]);

  const startMarkerCoordinate = useMemo(() => {
    if (!routeInfo) {
      return null;
    }

    if (lineCoords.length >= 1) {
      return { latitude: lineCoords[0][1], longitude: lineCoords[0][0] };
    }

    return snapToRenderedRoute(routeInfo.startPoint.lat, routeInfo.startPoint.lng);
  }, [lineCoords, routeInfo, snapToRenderedRoute]);

  const endMarkerCoordinate = useMemo(() => {
    if (!routeInfo) {
      return null;
    }

    if (lineCoords.length >= 1) {
      const last = lineCoords[lineCoords.length - 1];
      return { latitude: last[1], longitude: last[0] };
    }

    return snapToRenderedRoute(routeInfo.endPoint.lat, routeInfo.endPoint.lng);
  }, [lineCoords, routeInfo, snapToRenderedRoute]);

  type SnappedMarker = {
    id: string;
    name: string;
    description?: string;
    coordinate: { latitude: number; longitude: number };
  };

  type SnappedPoiMarker = SnappedMarker & {
    hawker: boolean;
  };

  const snappedCheckpointMarkers = useMemo(
    () => {
      const markers: SnappedMarker[] = [];
      visitedCheckpoints.forEach((checkpoint) => {
        const coordinate = snapToRenderedRoute(checkpoint.lat, checkpoint.lng);
        if (!coordinate) {
          return;
        }

        markers.push({
          id: `checkpoint-${checkpoint.id}`,
          name: checkpoint.name,
          description: checkpoint.description,
          coordinate,
        });
      });
      return markers;
    },
    [snapToRenderedRoute, visitedCheckpoints],
  );

  const snappedPoiMarkers = useMemo(
    () => {
      const markers: SnappedPoiMarker[] = [];
      visitedPoisWithCoords.forEach((poi, index) => {
        const coordinate = snapToRenderedRoute(poi.lat, poi.lng);
        if (!coordinate) {
          return;
        }

        markers.push({
          id: `poi-${poi.name}-${index}`,
          name: poi.name,
          description: poi.description,
          coordinate,
          hawker: isLikelyHawkerCentre(poi.name),
        });
      });
      return markers;
    },
    [snapToRenderedRoute, visitedPoisWithCoords],
  );

  const checkpointCoords = useMemo(
    () => snappedCheckpointMarkers.map((checkpoint) => checkpoint.coordinate),
    [snappedCheckpointMarkers],
  );

  const poiCoords = useMemo(() => snappedPoiMarkers.map((poi) => poi.coordinate), [snappedPoiMarkers]);

  const pathCoords = useMemo(
    () =>
      routeInfo
        ? routeToMapCoordinates(routeInfo).filter(
            (point) => !(point.latitude === 0 && point.longitude === 0),
          )
        : [],
    [routeInfo],
  );

  const mapRegion = useMemo<Region>(() => {
    const points: LatLng[] = [...pathCoords, ...checkpointCoords, ...poiCoords];
    if (startMarkerCoordinate) {
      points.push(startMarkerCoordinate);
    }
    if (endMarkerCoordinate) {
      points.push(endMarkerCoordinate);
    }
    return fitRegionForCoordinates(points);
  }, [checkpointCoords, endMarkerCoordinate, pathCoords, poiCoords, startMarkerCoordinate]);

  const mapUsable = Boolean(
    pathCoords.length >= 2 ||
      checkpointCoords.length > 0 ||
      poiCoords.length > 0 ||
      Boolean(startMarkerCoordinate) ||
      Boolean(endMarkerCoordinate),
  );
  const showEmbeddedMap = mapUsable && !androidMapboxEnabled;
  const showAndroidMapboxMap = mapUsable && androidMapboxEnabled && RouteMapPreviewMapbox;

  const mapboxMarkers = useMemo(
    () => [
      ...(startMarkerCoordinate
        ? [
            {
              id: 'route-start',
              coordinate: [startMarkerCoordinate.longitude, startMarkerCoordinate.latitude] as [number, number],
              color: '#22c55e',
              kind: 'start' as const,
            },
          ]
        : []),
      ...snappedCheckpointMarkers.map((checkpoint) => ({
        id: checkpoint.id,
        coordinate: [checkpoint.coordinate.longitude, checkpoint.coordinate.latitude] as [number, number],
        color: '#2563eb',
        kind: 'waypoint' as const,
      })),
      ...snappedPoiMarkers.map((poi) => ({
        id: poi.id,
        coordinate: [poi.coordinate.longitude, poi.coordinate.latitude] as [number, number],
        color: '#f59e0b',
        kind: 'poi' as const,
      })),
      ...(endMarkerCoordinate
        ? [
            {
              id: 'route-end',
              coordinate: [endMarkerCoordinate.longitude, endMarkerCoordinate.latitude] as [number, number],
              color: '#ef4444',
              kind: 'end' as const,
            },
          ]
        : []),
    ],
    [endMarkerCoordinate, snappedCheckpointMarkers, snappedPoiMarkers, startMarkerCoordinate],
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-black">
        <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#1D4ED8'} />
      </View>
    );
  }

  if (!ride || !routeInfo) {
    return (
      <View className="flex-1 justify-center items-center p-cy-lg bg-slate-50 dark:bg-black">
        <Text className="text-[26px] font-bold text-[#1e293b] dark:text-slate-100 mb-2">Ride not found</Text>
        <Text className="text-sm text-[#64748b] dark:text-slate-400 mb-[12px]">Please select a valid ride from history.</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const handleRideThisRouteAgain = () => {
    const params = { routeId: routeInfo.id, route: routeInfo };
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation) {
      parentNavigation.navigate('home-tab', {
        screen: 'RouteDetails',
        params,
      });
      return;
    }

    navigation.navigate('home-tab', {
      screen: 'RouteDetails',
      params,
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-black"
      contentContainerStyle={{ padding: 16, paddingBottom: scrollBottomPad }}
    >
      <View className="mb-[12px]">
        <Text className="text-[22px] font-bold text-[#1e293b] dark:text-slate-100">{routeInfo.name}</Text>
        <Text className="text-[13px] text-[#64748b] dark:text-slate-400 mt-1">{routeInfo.description}</Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
          <CardDescription>
            Blue pins are checkpoints; amber pins are POIs; magenta food icons are hawker centres (name match).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View className="rounded-[12px] overflow-hidden border border-[#e2e8f0] dark:border-[#2d2d2d]">
            {showEmbeddedMap ? (
              <MapView
                style={{ width: '100%', height: 240 }}
                initialRegion={mapRegion}
                scrollEnabled
                zoomEnabled
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
              >
                {pathCoords.length > 1 ? (
                  <Polyline
                    coordinates={pathCoords}
                    strokeColor="#22c55e"
                    strokeWidth={4}
                  />
                ) : null}

                {startMarkerCoordinate ? (
                  <Marker
                    coordinate={startMarkerCoordinate}
                    title="Start"
                    description={routeInfo.startPoint.name}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: '#22c55e',
                        borderWidth: 3,
                        borderColor: '#ffffff',
                      }}
                    />
                  </Marker>
                ) : null}

                {snappedCheckpointMarkers.map((checkpoint) => (
                  <Marker
                    key={checkpoint.id}
                    coordinate={checkpoint.coordinate}
                    title={checkpoint.name}
                    description={checkpoint.description}
                    {...mapPinMarkerProps()}
                  >
                    <MaterialCommunityIcons name="map-marker" size={30} color="#2563eb" />
                  </Marker>
                ))}

                {snappedPoiMarkers.map((poi) => {
                  return (
                    <Marker
                      key={poi.id}
                      coordinate={poi.coordinate}
                      title={poi.name}
                      description={poi.description}
                      {...mapPinMarkerProps()}
                    >
                      <MaterialCommunityIcons
                        name={poi.hawker ? 'food' : 'map-marker'}
                        size={30}
                        color={poi.hawker ? '#be185d' : '#f59e0b'}
                      />
                    </Marker>
                  );
                })}

                {endMarkerCoordinate ? (
                  <Marker
                    coordinate={endMarkerCoordinate}
                    title="End"
                    description={routeInfo.endPoint.name}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: '#ef4444',
                        borderWidth: 3,
                        borderColor: '#ffffff',
                      }}
                    />
                  </Marker>
                ) : null}
              </MapView>
            ) : showAndroidMapboxMap ? (
              <RouteMapPreviewMapbox
                lineCoordinates={lineCoords}
                markers={mapboxMarkers}
                strokeColor="#22c55e"
                testID="route-history-details-map"
                scrollEnabled
                zoomEnabled
              />
            ) : (
              <View className="h-[240px] items-center justify-center bg-[#e2e8f0] dark:bg-[#0f172a] px-4">
                <MaterialCommunityIcons name="map-search-outline" size={40} color={isDark ? '#64748b' : '#475569'} />
                <Text className="mt-2 text-sm font-semibold text-[#334155] dark:text-slate-300">
                  {androidMapboxEnabled ? 'Route preview unavailable' : 'Mapbox preview unavailable'}
                </Text>
                <Text className="mt-1 text-center text-xs text-[#64748b] dark:text-slate-500">
                  {androidMapboxEnabled
                    ? 'This ride record does not include route coordinates yet.'
                    : 'Use a development build with EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN configured to render the Android history preview with Mapbox.'}
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>

      <Card style={{ marginBottom: 12, backgroundColor: isDark ? '#1e293b' : '#e0f2fe', borderColor: isDark ? '#2d2d2d' : '#bae6fd' }}>
        <CardHeader>
          <CardTitle>Ride Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-[#0369a1] dark:text-slate-400">{ride.completionDate} - {ride.completionTime}</Text>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Details</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row justify-between gap-2">
            <View className="flex-1 bg-[#f0f9ff] dark:bg-[#1a1a1a] rounded-[10px] p-[10px]">
              <Text className="text-xs text-[#64748b] dark:text-slate-400 mb-1">Start</Text>
              <Text className="text-base font-bold text-[#0f172a] dark:text-slate-100">{ride.startTime ?? 'N/A'}</Text>
            </View>
            <View className="flex-1 bg-[#f0f9ff] dark:bg-[#1a1a1a] rounded-[10px] p-[10px]">
              <Text className="text-xs text-[#64748b] dark:text-slate-400 mb-1">End</Text>
              <Text className="text-base font-bold text-[#0f172a] dark:text-slate-100">{ride.endTime ?? 'N/A'}</Text>
            </View>
            <View className="flex-1 bg-[#f0f9ff] dark:bg-[#1a1a1a] rounded-[10px] p-[10px]">
              <Text className="text-xs text-[#64748b] dark:text-slate-400 mb-1">Duration</Text>
              <Text className="text-base font-bold text-[#0f172a] dark:text-slate-100">{ride.totalTime} min</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ride Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row flex-wrap justify-between gap-2">
            <View className="bg-slate-50 dark:bg-[#111111] rounded-[10px] p-[10px] border border-[#e2e8f0] dark:border-[#2d2d2d] items-center" style={{ width: '48%' }}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#3b82f6" />
              <Text className="text-base font-bold mt-[6px] text-[#1e293b] dark:text-slate-100">{ride.distance} km</Text>
              <Text className="text-xs text-[#64748b] dark:text-slate-400">Distance</Text>
            </View>
            <View className="bg-slate-50 dark:bg-[#111111] rounded-[10px] p-[10px] border border-[#e2e8f0] dark:border-[#2d2d2d] items-center" style={{ width: '48%' }}>
              <FontAwesome5 name="mountain" size={16} color="#f97316" />
              <Text className="text-base font-bold mt-[6px] text-[#1e293b] dark:text-slate-100">{formatRouteElevation(routeInfo.elevation)}</Text>
              <Text className="text-xs text-[#64748b] dark:text-slate-400">Elevation</Text>
            </View>
            <View className="bg-slate-50 dark:bg-[#111111] rounded-[10px] p-[10px] border border-[#e2e8f0] dark:border-[#2d2d2d] items-center" style={{ width: '48%' }}>
              <MaterialCommunityIcons name="speedometer" size={16} color="#10b981" />
              <Text className="text-base font-bold mt-[6px] text-[#1e293b] dark:text-slate-100">{ride.avgSpeed} km/h</Text>
              <Text className="text-xs text-[#64748b] dark:text-slate-400">Avg Speed</Text>
            </View>
            <View className="bg-slate-50 dark:bg-[#111111] rounded-[10px] p-[10px] border border-[#e2e8f0] dark:border-[#2d2d2d] items-center" style={{ width: '48%' }}>
              <MaterialCommunityIcons name="map-legend" size={16} color="#8b5cf6" />
              <Text className="text-base font-bold mt-[6px] text-[#1e293b] dark:text-slate-100">{ride.checkpoints}</Text>
              <Text className="text-xs text-[#64748b] dark:text-slate-400">Checkpoints</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating & Review</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name="star"
                size={20}
                color={star <= (ride.userRating ?? 0) ? '#f59e0b' : '#d1d5db'}
              />
            ))}
            <Text className="ml-2 text-[#1f2937] dark:text-slate-100 font-bold">{ride.userRating ?? 0}/5</Text>
          </View>
          {ride.userReview ? (
            <Text className="text-sm text-[#334155] dark:text-slate-100">{ride.userReview}</Text>
          ) : (
            <Text className="text-sm text-[#334155] dark:text-slate-100">No review provided for this ride.</Text>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Route Info</CardTitle>
          <CardDescription>{formatCyclistTypeLabel(routeInfo.cyclistType)} - {routeInfo.estimatedTime} min estimate</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="flex-row flex-wrap gap-2 mb-2">
            <View className="bg-[#e0e7ff] dark:bg-[#1a1a1a] py-1 px-[10px] rounded-cy-md">
              <Text className="text-[#1e3a8a] dark:text-slate-100 text-xs font-semibold">{formatShadeSummary(routeInfo.shade)}</Text>
            </View>
            <View className="bg-[#e0e7ff] dark:bg-[#1a1a1a] py-1 px-[10px] rounded-cy-md">
              <Text className="text-[#1e3a8a] dark:text-slate-100 text-xs font-semibold">{formatAirQualitySummary(routeInfo.airQuality)}</Text>
            </View>
          </View>
          <Text className="mt-2 mb-1 text-[#334155] dark:text-slate-100 font-bold">Checkpoints Visited</Text>
          {visitedCheckpoints.map((checkpoint) => (
            <View key={checkpoint.id} className="flex-row items-start gap-2 mb-[8px]">
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={16}
                color="#2563eb"
                style={{ marginTop: 2 }}
              />
              <Text
                className="flex-1 text-[#475569] dark:text-slate-400 text-[13px] leading-5"
                style={{ flexShrink: 1 }}
              >
                {checkpoint.name}
              </Text>
            </View>
          ))}
          <Text className="mt-2 mb-1 text-[#334155] dark:text-slate-100 font-bold">Points of Interest</Text>
          {visitedPois.length > 0 ? (
            visitedPois.map((point) => (
              <View key={point.name} className="flex-row items-start gap-2 mb-[8px]">
                <MaterialCommunityIcons
                  name="star-circle"
                  size={16}
                  color="#f59e0b"
                  style={{ marginTop: 2 }}
                />
                <Text
                  className="flex-1 text-[#475569] dark:text-slate-400 text-[13px] leading-5"
                  style={{ flexShrink: 1 }}
                >
                  {point.name} - {point.description ?? 'No description available.'}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-[#475569] dark:text-slate-400 text-[13px] leading-5">No points of interest recorded.</Text>
          )}
        </CardContent>
      </Card>

      <Button
        onPress={handleRideThisRouteAgain}
        style={{
          backgroundColor: '#2563eb',
          borderRadius: 10,
          paddingVertical: 12,
          marginTop: 12,
        }}
      >
        <Text className="text-white text-base font-bold">Ride This Route Again</Text>
      </Button>
    </ScrollView>
  );
}
