import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { openRouteInMaps } from '@/services/maps';
import { type Route } from '../../../../shared/types/index';
import { resolveRouteById } from '../../services/routeLookup';
import {
  formatRouteElevation,
  routeCoordinateSubtitle,
} from '../utils/routeDisplay';
import { useRouteEndpointLabels } from '../utils/placeGeocode';
import { useFloatingTabBarScrollPadding } from '../utils/floatingTabBarInset';

export default function RouteConfirmedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { params } = useRoute<any>();
  const routeId = params?.routeId as string | undefined;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const { startLabel, endLabel } = useRouteEndpointLabels(route);
  const scrollBottomPad = useFloatingTabBarScrollPadding(20);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const r = await resolveRouteById(routeId);
      if (!cancelled) {
        setRoute(r);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const goHome = useCallback(() => {
    navigation.navigate('HomePage');
  }, [navigation]);

  const openExternalMaps = useCallback(async () => {
    if (!route) return;
    const origin = `${route.startPoint.lat},${route.startPoint.lng}`;
    const destination = `${route.endPoint.lat},${route.endPoint.lng}`;
    const waypoints = route.checkpoints.map((c) => `${c.lat},${c.lng}`);
    try {
      await openRouteInMaps({
        origin,
        destination,
        waypoints,
        preferGoogle: Platform.OS === 'android',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not open maps.';
      Alert.alert('Maps', message);
    }
  }, [route]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#f8fafc] dark:bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!route) {
    return (
      <View className="flex-1 bg-[#f8fafc] dark:bg-black items-center justify-center px-6" testID="route-confirmed-missing">
        <Text className="text-base text-[#475569] dark:text-slate-400 mb-4">Route not found</Text>
        <Pressable
          className="bg-[#e2e8f0] dark:bg-[#2d2d2d] px-5 py-3 rounded-xl"
          onPress={goHome}
          testID="route-confirmed-back-home"
        >
          <Text className="font-bold text-[#0f172a] dark:text-slate-100">Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  const startSub = routeCoordinateSubtitle(route.startPoint.lat, route.startPoint.lng);
  const endSub = routeCoordinateSubtitle(route.endPoint.lat, route.endPoint.lng);

  return (
    <SafeAreaView className="flex-1 bg-[#f0fdf4] dark:bg-black" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: scrollBottomPad }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={isDark ? ['#052e16', '#0c1929'] : ['#ecfdf5', '#eff6ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            borderRadius: 16,
            paddingVertical: 32,
            paddingHorizontal: 16,
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          <View
            className="w-20 h-20 rounded-full bg-[#dcfce7] dark:bg-[#14532d] items-center justify-center mb-4"
            testID="route-confirmed-icon"
          >
            <MaterialCommunityIcons name="check-circle" size={48} color="#16a34a" />
          </View>
          <Text
            className="text-[28px] font-extrabold text-[#0f172a] dark:text-slate-100 text-center mb-2"
            testID="route-confirmed-title"
          >
            Route Confirmed!
          </Text>
          <Text className="text-[15px] text-[#64748b] dark:text-slate-400 text-center px-2">
            Your cycling adventure awaits
          </Text>
        </LinearGradient>

        <View
          className="bg-white dark:bg-[#111111] rounded-cy-md border border-[#bfdbfe] dark:border-[#1e3a5f] p-cy-md mb-4"
          testID="route-confirmed-summary"
        >
          <Text className="text-xl font-bold text-[#0f172a] dark:text-slate-100 mb-2">{route.name}</Text>
          <Text className="text-sm text-[#64748b] dark:text-slate-400 leading-[22px] mb-5" numberOfLines={4}>
            {route.description}
          </Text>

          <Text className="text-xs font-bold text-[#64748b] dark:text-slate-500 uppercase tracking-wide mb-2">
            At a glance
          </Text>
          <View className="flex-row flex-wrap gap-cy-sm mb-5">
            <View className="flex-1 min-w-[44%] bg-[#f0f9ff] dark:bg-[#0c1929] rounded-cy-sm p-3 border border-[#bae6fd] dark:border-[#1e3a5f]">
              <MaterialCommunityIcons name="map-marker-distance" size={18} color="#2563eb" />
              <Text className="text-lg font-bold text-[#0f172a] dark:text-slate-100 mt-1">{route.distance} km</Text>
              <Text className="text-[11px] text-[#64748b] dark:text-slate-400">Distance</Text>
            </View>
            <View className="flex-1 min-w-[44%] bg-[#f0fdf4] dark:bg-[#052e16] rounded-cy-sm p-3 border border-[#bbf7d0] dark:border-[#14532d]">
              <MaterialCommunityIcons name="clock-outline" size={18} color="#16a34a" />
              <Text className="text-lg font-bold text-[#0f172a] dark:text-slate-100 mt-1">{route.estimatedTime} min</Text>
              <Text className="text-[11px] text-[#64748b] dark:text-slate-400">Est. time</Text>
            </View>
            <View className="flex-1 min-w-[44%] bg-[#fefce8] dark:bg-[#1a1a0a] rounded-cy-sm p-3 border border-[#fde047] dark:border-[#422006]">
              <MaterialCommunityIcons name="flag-checkered" size={18} color="#ca8a04" />
              <Text className="text-lg font-bold text-[#0f172a] dark:text-slate-100 mt-1">{route.checkpoints.length}</Text>
              <Text className="text-[11px] text-[#64748b] dark:text-slate-400">Checkpoints</Text>
            </View>
            <View className="flex-1 min-w-[44%] bg-[#faf5ff] dark:bg-[#1a0a1a] rounded-cy-sm p-3 border border-[#e9d5ff] dark:border-[#3b0764]">
              <MaterialCommunityIcons name="terrain" size={18} color="#9333ea" />
              <Text className="text-lg font-bold text-[#0f172a] dark:text-slate-100 mt-1" numberOfLines={1}>
                {formatRouteElevation(route.elevation)}
              </Text>
              <Text className="text-[11px] text-[#64748b] dark:text-slate-400">Elevation</Text>
            </View>
          </View>

          <View className="border-t border-[#e2e8f0] dark:border-[#2d2d2d] pt-4 mb-1">
            <Text className="text-base font-bold text-[#0f172a] dark:text-slate-100 mb-3">Route points</Text>
            <View className="flex-row items-start gap-3 mb-4">
              <View className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-[#64748b] dark:text-slate-500 uppercase">Start</Text>
                <Text className="text-[15px] font-semibold text-[#0f172a] dark:text-slate-100 mt-0.5">
                  {startLabel}
                </Text>
                {startSub ? (
                  <Text className="text-xs text-[#64748b] dark:text-slate-500 mt-1 font-mono">{startSub}</Text>
                ) : null}
              </View>
            </View>
            <View className="flex-row items-start gap-3">
              <View className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-[#64748b] dark:text-slate-500 uppercase">End</Text>
                <Text className="text-[15px] font-semibold text-[#0f172a] dark:text-slate-100 mt-0.5">
                  {endLabel}
                </Text>
                {endSub ? (
                  <Text className="text-xs text-[#64748b] dark:text-slate-500 mt-1 font-mono">{endSub}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {route.checkpoints.length > 0 ? (
            <View className="border-t border-[#e2e8f0] dark:border-[#2d2d2d] pt-4 mt-4">
              <Text className="text-base font-bold text-[#0f172a] dark:text-slate-100 mb-3">
                Checkpoints ({route.checkpoints.length})
              </Text>
              {route.checkpoints.map((cp, index) => (
                <View
                  key={cp.id}
                  className="flex-row gap-3 py-2 border-b border-[#f1f5f9] dark:border-[#1a1a1a] last:border-b-0"
                >
                  <Text className="text-sm font-bold text-[#2563eb] w-6">{index + 1}.</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-[#0f172a] dark:text-slate-100">{cp.name}</Text>
                    {cp.description ? (
                      <Text className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5" numberOfLines={2}>
                        {cp.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View className="flex-row items-center gap-2 mt-5 pt-4 border-t border-[#e2e8f0] dark:border-[#2d2d2d]">
            <MaterialCommunityIcons name="star" size={22} color="#f59e0b" />
            <Text className="text-xl font-bold text-[#0f172a] dark:text-slate-100">{route.rating}</Text>
            <Text className="text-sm text-[#64748b] dark:text-slate-400">({route.reviewCount} reviews)</Text>
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <View className="bg-[#e0e7ff] dark:bg-[#1e1b4b] px-cy-sm py-1 rounded-md">
              <Text className="text-xs text-[#4f46e5] dark:text-indigo-300 capitalize font-semibold">
                {route.cyclistType} rider
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          className="border-2 border-[#2563eb] rounded-cy-md py-3.5 items-center mb-3 bg-white dark:bg-[#111111]"
          onPress={openExternalMaps}
          testID="route-confirmed-external-maps"
        >
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="open-in-new" size={20} color="#2563eb" />
            <Text className="text-base font-bold text-[#2563eb]">View Route on Google / Apple Maps</Text>
          </View>
        </Pressable>

        <Pressable
          className="bg-[#2563eb] rounded-cy-md py-4 items-center mb-5 flex-row justify-center gap-2"
          onPress={() => navigation.navigate('LiveMap', { routeId: route.id })}
          testID="route-confirmed-start-cycling"
        >
          <MaterialCommunityIcons name="navigation-variant" size={22} color="#ffffff" />
          <Text className="text-white text-base font-bold">Start Cycling Now</Text>
        </Pressable>

        <Text className="text-center text-sm text-[#64748b] dark:text-slate-400 px-2">
          Have a safe and enjoyable ride! 🚴‍♂️
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
