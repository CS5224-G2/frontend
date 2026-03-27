import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '../components/native/Common';
import { type Route, type RouteRecommendationRequest, type RouteRequestLocation } from '../../../../shared/types/index';
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

export default function RouteRecommendationPage({ navigation }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeRequest, setRouteRequest] = useState<RouteRecommendationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const savedRequest = await AsyncStorage.getItem(ROUTE_REQUEST_STORAGE_KEY);
        const parsedRequest = savedRequest ? (JSON.parse(savedRequest) as RouteRecommendationRequest) : null;

        setRouteRequest(parsedRequest);

        const data = parsedRequest?.preferences
          ? await getRouteRecommendations(parsedRequest.preferences, 3)
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
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{item.distance} km</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                Estimated Time
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{item.estimatedTime} min</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="arrow-up" size={16} color="#6b7280" />
                Elevation
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{item.elevation} m</Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-2">
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="tree" size={16} color="#6b7280" />
                Shade
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{item.shade}%</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">
                <MaterialCommunityIcons name="air-filter" size={16} color="#6b7280" />
                Air Quality
              </Text>
              <Text className="text-base text-[#6b7280] dark:text-slate-400 ml-1 text-center">{item.airQuality}%</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-[#444] dark:text-slate-400">
              <AntDesign name="star" size={15} color="#f59e0b" />
              {item.rating} ({item.reviewCount})
            </Text>
            <Text className="text-xs text-[#1e293b] dark:text-slate-100 font-bold capitalize">
              {item.cyclistType}
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
            <CardTitle style={{ fontSize: 18 }}>Mock API Request</CardTitle>
            <CardDescription>
              The backend is not connected yet, so these routes are still mocked. This card shows the request payload that would be submitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {routeRequest.preferences.cyclistType} rider · {routeRequest.preferences.distance} km target · {routeRequest.preferences.airQuality}% min air quality
              </Text>
              <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                Shade {routeRequest.preferences.preferredShade}% · Elevation {routeRequest.preferences.elevation}%
              </Text>
            </View>
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
