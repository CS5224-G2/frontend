import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../components/native/Common';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { type RideHistory, type Route } from '../../../../shared/types/index';
import { getRideById } from '../../services/rideService';
import { getRouteById } from '../../services/routeService';

type Props = NativeStackScreenProps<any, 'HistoryDetails'>;

export default function RouteHistoryDetailsPage({ navigation, route }: Props) {
  const { rideId } = route.params as { rideId: string };
  const [ride, setRide] = useState<RideHistory | null>(null);
  const [routeInfo, setRouteInfo] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const loadData = async () => {
      const rideData = await getRideById(rideId);
      if (rideData) {
        const [routeData] = await Promise.all([getRouteById(rideData.routeId)]);
        setRide(rideData);
        setRouteInfo(routeData);
      }
      setIsLoading(false);
    };
    loadData();
  }, [rideId]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#1D4ED8'} />
      </View>
    );
  }

  if (!ride || !routeInfo) {
    return (
      <View className="flex-1 justify-center items-center p-cy-lg">
        <Text className="text-[26px] font-bold text-[#1e293b] dark:text-slate-100 mb-2">Ride not found</Text>
        <Text className="text-sm text-[#64748b] dark:text-slate-400 mb-[12px]">Please select a valid ride from history.</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-black" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View className="mb-[12px]">
        <Text className="text-[22px] font-bold text-[#1e293b] dark:text-slate-100">{routeInfo.name}</Text>
        <Text className="text-[13px] text-[#64748b] dark:text-slate-400 mt-1">{routeInfo.description}</Text>
      </View>

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
          <Text className="mt-2 mb-1 text-[#334155] dark:text-slate-100 font-bold">Points of Interest</Text>
          {routeInfo.checkpoints.map((checkpoint) => (
            <View key={checkpoint.id} className="flex-row items-center gap-2 mb-[6px]">
              <MaterialCommunityIcons name="map-marker-radius" size={16} color="#2563eb" />
              <Text className="text-[#475569] dark:text-slate-400 text-[13px]">{checkpoint.name} — {checkpoint.description}</Text>
            </View>
          ))}
        </CardContent>
      </Card>

      <Button onPress={() => navigation.navigate('RouteDetails', { routeId: routeInfo.id })} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, marginTop: 12, gap: 8 }}>
        <MaterialCommunityIcons name="play" size={18} color="#fff" />
        <Text className="text-white text-sm font-bold">Ride This Route Again</Text>
      </Button>

      <Pressable onPress={() => navigation.goBack()} className="mt-2 items-center">
        <Text className="text-[#2563eb] dark:text-blue-400 font-bold">Back to History</Text>
      </Pressable>
    </ScrollView>
  );
}
