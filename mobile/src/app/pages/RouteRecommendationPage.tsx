import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '../components/native/Common';
import { type Route, type RouteRecommendationRequest, type RouteRequestLocation } from '../../../../shared/types/index';
import {
  getAirQualityPreferenceLabel,
  getElevationPreferenceLabel,
  getSelectedPointOfInterestLabels,
  getShadePreferenceLabel,
  hasSelectedPointsOfInterest,
  normalizeUserPreferences,
} from '../utils/routePreferences';
import { getRouteRecommendations, getRoutes } from '../../services/routeService';

type Props = NativeStackScreenProps<any, 'Recommendation'>;

const ROUTE_REQUEST_STORAGE_KEY = 'routeRecommendationRequest';

function formatCoordinates(location: Pick<RouteRequestLocation, 'lat' | 'lng'>) {
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

function getSourceLabel(source: RouteRequestLocation['source']) {
  if (source === 'current-location') {
    return 'Current location';
  }

  if (source === 'map') {
    return 'Map pin';
  }

  return 'Search result';
}

function formatPreferenceMetric(value: number | string, unit?: string) {
  if (typeof value === 'number') {
    return unit ? `${value}${unit}` : String(value);
  }

  return value
    .split('-')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function formatCyclistType(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function RouteRecommendationPage({ navigation }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeRequest, setRouteRequest] = useState<RouteRecommendationRequest | null>(null);
  const [isRequestExpanded, setIsRequestExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const savedRequest = await AsyncStorage.getItem(ROUTE_REQUEST_STORAGE_KEY);
        const parsedRequest = savedRequest ? (JSON.parse(savedRequest) as RouteRecommendationRequest) : null;
        const normalizedRequest = parsedRequest
          ? {
              ...parsedRequest,
              preferences: normalizeUserPreferences(parsedRequest.preferences),
            }
          : null;

        setRouteRequest(normalizedRequest);

        const data = normalizedRequest?.preferences
          ? await getRouteRecommendations(normalizedRequest, normalizedRequest.limit ?? 3)
          : await getRoutes();

        setRoutes(data.slice(0, 3));
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-black">
        <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#3b82f6'} />
      </View>
    );
  }

  const renderRoute = ({ item }: { item: Route }) => (
    <Pressable
      style={({ pressed }) => [{ borderRadius: 12 }, pressed && { opacity: 0.8 }]}
      onPress={() => navigation.navigate('RouteDetails', { routeId: item.id })}
    >
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 18, fontWeight: '700' }}>{item.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-slate-500 mb-2">{item.description}</Text>
          <View className="flex-row justify-between mb-2">
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                Distance
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{formatPreferenceMetric(item.distance, ' km')}</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                Estimated Time
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{formatPreferenceMetric(item.estimatedTime, ' min')}</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="arrow-up" size={16} color="#6b7280" />
                Elevation
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{formatPreferenceMetric(item.elevation, typeof item.elevation === 'number' ? ' m' : undefined)}</Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-2">
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="tree" size={16} color="#6b7280" />
                Shade
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{formatPreferenceMetric(item.shade, typeof item.shade === 'number' ? '%' : undefined)}</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="air-filter" size={16} color="#6b7280" />
                Air Quality
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{formatPreferenceMetric(item.airQuality, typeof item.airQuality === 'number' ? '%' : undefined)}</Text>
            </View>
          </View>

          {item.pointsOfInterestVisited && item.pointsOfInterestVisited.length > 0 ? (
            <View className="mb-2 rounded-[10px] border border-slate-200 dark:border-[#2d2d2d] px-3 py-2 bg-slate-50 dark:bg-[#121212]">
              <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Points of Interest Visited</Text>
              <Text className="mt-1 text-[13px] text-slate-700 dark:text-slate-200">
                {item.pointsOfInterestVisited.map((poi) => poi.name).join(', ')}
              </Text>
            </View>
          ) : null}

          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-[#444] dark:text-slate-400">
              <AntDesign name="star" size={15} color="#f59e0b" />
              {item.reviewCount} stars · {item.rating} rating
            </Text>
            <Text className="text-xs text-[#1e293b] dark:text-slate-100 font-bold capitalize">
              {formatCyclistType(item.cyclistType)}
            </Text>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-black" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View className="flex-row items-center mb-[12px] gap-cy-md">
        <Text className="text-2xl font-bold text-[#1e293b] dark:text-slate-100">Route Recommendations</Text>
      </View>

      {routeRequest ? (
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: 18 }}>API Request</CardTitle>
            <CardDescription>
              View your route configurations here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Pressable
              onPress={() => setIsRequestExpanded((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel="Toggle mock API request details"
              className="border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                  {isRequestExpanded ? 'Hide request details' : 'Show request details'}
                </Text>
                <MaterialCommunityIcons
                  name={isRequestExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isDark ? '#cbd5e1' : '#475569'}
                />
              </View>
            </Pressable>

            {isRequestExpanded ? (
              <>
                <View className="border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]">
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Start Point</Text>
                  <Text className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 mt-1">{routeRequest.startPoint.name}</Text>
                  <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                    {getSourceLabel(routeRequest.startPoint.source)} · {formatCoordinates(routeRequest.startPoint)}
                  </Text>
                </View>

                <View className="border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]">
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">End Point</Text>
                  <Text className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 mt-1">{routeRequest.endPoint.name}</Text>
                  <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                    {getSourceLabel(routeRequest.endPoint.source)} · {formatCoordinates(routeRequest.endPoint)}
                  </Text>
                </View>

                <View className="border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]">
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Checkpoints</Text>
                  {routeRequest.checkpoints.length === 0 ? (
                    <Text className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">No checkpoints added.</Text>
                  ) : (
                    routeRequest.checkpoints.map((checkpoint, index) => (
                      <View key={checkpoint.id} className={index === 0 ? 'mt-2' : 'mt-3'}>
                        <Text className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{checkpoint.name}</Text>
                        <Text className="text-[13px] text-slate-500 dark:text-slate-400">
                          {getSourceLabel(checkpoint.source)} · {formatCoordinates(checkpoint)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                <View className="border border-slate-200 dark:border-[#2d2d2d] rounded-[12px] px-cy-md py-cy-md bg-white dark:bg-[#0f0f0f]">
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Preference Summary</Text>
                  <Text className="text-[14px] text-slate-700 dark:text-slate-200 mt-2">
                    Cyclist type: {formatCyclistType(routeRequest.preferences.cyclistType)} · Max distance: {routeRequest.preferences.maxDistanceKm} km
                  </Text>
                  <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                    Shade: {getShadePreferenceLabel(routeRequest.preferences.shadePreference)} · Elevation: {getElevationPreferenceLabel(routeRequest.preferences.elevationPreference)} · Air quality: {getAirQualityPreferenceLabel(routeRequest.preferences.airQualityPreference)}
                  </Text>
                  <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                    {hasSelectedPointsOfInterest(routeRequest.preferences.pointsOfInterest)
                      ? `Points of interest enabled: ${getSelectedPointOfInterestLabels(routeRequest.preferences.pointsOfInterest).join(', ')}`
                      : 'Points of interest enabled: none'}
                  </Text>
                  <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                    allow_hawker_center: {routeRequest.preferences.pointsOfInterest.hawkerCenter ? 'true' : 'false'} · allow_park: {routeRequest.preferences.pointsOfInterest.park ? 'true' : 'false'}
                  </Text>
                  <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                    allow_historic_site: {routeRequest.preferences.pointsOfInterest.historicSite ? 'true' : 'false'} · allow_tourist_attraction: {routeRequest.preferences.pointsOfInterest.touristAttraction ? 'true' : 'false'}
                  </Text>
                </View>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Text className="mb-[14px] text-slate-500 dark:text-slate-400">{routes.length} routes found</Text>

      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderRoute}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

