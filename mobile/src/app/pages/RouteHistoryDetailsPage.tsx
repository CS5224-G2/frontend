import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../components/native/Common';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { type RideHistory } from '../../../../shared/types/index';
import { getRideById } from '../../services/rideService';

type Props = NativeStackScreenProps<any, 'HistoryDetails'>;

export default function RouteHistoryDetailsPage({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { rideId } = route.params as { rideId: string };
  const [ride, setRide] = useState<RideHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const loadData = async () => {
      const rideData = await getRideById(rideId);
      if (rideData) setRide(rideData);
      setIsLoading(false);
    };
    loadData();
  }, [rideId]);

  const routeInfo = ride?.routeDetails ?? null;
  const visitedCheckpoints = ride?.visitedCheckpoints ?? routeInfo?.checkpoints ?? [];
  const visitedPois = ride?.pointsOfInterestVisited ?? routeInfo?.pointsOfInterestVisited ?? [];
  const routePath = routeInfo?.routePath ?? [];
  const visitedPoisWithCoords = (ride?.pointsOfInterestVisited ?? []).filter(
    (poi): poi is { name: string; description?: string; lat: number; lng: number } =>
      typeof poi.lat === 'number' && typeof poi.lng === 'number',
  );

  const checkpointCoords = useMemo(
    () => visitedCheckpoints.map((cp) => ({ latitude: cp.lat, longitude: cp.lng })),
    [visitedCheckpoints],
  );

  const poiCoords = useMemo(
    () => visitedPoisWithCoords.map((poi) => ({ latitude: poi.lat, longitude: poi.lng })),
    [visitedPoisWithCoords],
  );

  const pathCoords = useMemo(
    () => routePath.map((point) => ({ latitude: point.lat, longitude: point.lng })),
    [routePath],
  );

  const mapRegion = useMemo<Region>(() => {
    const points: LatLng[] = [...pathCoords, ...checkpointCoords, ...poiCoords];
    if (points.length === 0) {
      return {
        latitude: 40.758,
        longitude: -73.9855,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
      longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
    };
  }, [checkpointCoords, pathCoords, poiCoords]);

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

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-black"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
    >
      <View className="mb-[12px]">
        <Text className="text-[22px] font-bold text-[#1e293b] dark:text-slate-100">{routeInfo.name}</Text>
        <Text className="text-[13px] text-[#64748b] dark:text-slate-400 mt-1">{routeInfo.description}</Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
          <CardDescription>Blue pins are checkpoints, amber pins are points of interest.</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="rounded-[12px] overflow-hidden border border-[#e2e8f0] dark:border-[#2d2d2d]">
            <MapView
              style={{ width: '100%', height: 240 }}
              initialRegion={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
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

              {visitedCheckpoints.map((checkpoint) => (
                <Marker
                  key={`checkpoint-${checkpoint.id}`}
                  coordinate={{ latitude: checkpoint.lat, longitude: checkpoint.lng }}
                  title={checkpoint.name}
                  description={checkpoint.description}
                >
                  <MaterialCommunityIcons name="map-marker" size={30} color="#2563eb" />
                </Marker>
              ))}

              {visitedPoisWithCoords.map((poi, index) => (
                <Marker
                  key={`poi-${poi.name}-${index}`}
                  coordinate={{ latitude: poi.lat, longitude: poi.lng }}
                  title={poi.name}
                  description={poi.description}
                >
                  <MaterialCommunityIcons name="map-marker" size={30} color="#f59e0b" />
                </Marker>
              ))}
            </MapView>
          </View>
        </CardContent>
      </Card>

      <Card style={{ marginBottom: 12, backgroundColor: isDark ? '#1e293b' : '#e0f2fe', borderColor: isDark ? '#2d2d2d' : '#bae6fd' }}>
        <CardHeader>
          <CardTitle>Ride Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-[#0369a1] dark:text-slate-400">{ride.completionDate} • {ride.completionTime}</Text>
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
              <Text className="text-base font-bold mt-[6px] text-[#1e293b] dark:text-slate-100">{routeInfo.elevation} m</Text>
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
          <CardDescription>{routeInfo.cyclistType} • {routeInfo.estimatedTime} min estimate</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="flex-row flex-wrap gap-2 mb-2">
            <View className="bg-[#e0e7ff] dark:bg-[#1a1a1a] py-1 px-[10px] rounded-cy-md">
              <Text className="text-[#1e3a8a] dark:text-slate-100 text-xs font-semibold">Shade {routeInfo.shade}%</Text>
            </View>
            <View className="bg-[#e0e7ff] dark:bg-[#1a1a1a] py-1 px-[10px] rounded-cy-md">
              <Text className="text-[#1e3a8a] dark:text-slate-100 text-xs font-semibold">Air {routeInfo.airQuality}/100</Text>
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
        onPress={() =>
          navigation.navigate('HomeTab', {
            state: {
              routes: [
                { name: 'HomePage' },
                { name: 'RouteDetails', params: { routeId: routeInfo.id, route: routeInfo } },
              ],
              index: 1,
            },
          })
        }
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
