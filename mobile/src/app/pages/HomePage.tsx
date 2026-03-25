import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Route, type UserPreferences } from '../../../../shared/types/index';
import { getRoutes, getRouteRecommendations } from '../../services/routeService';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';

type Props = NativeStackScreenProps<any, 'HomePage'>;

export default function HomeScreen({ navigation }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [suggestedRoutes, setSuggestedRoutes] = useState<(Route & { matchScore: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const savedPrefs = await AsyncStorage.getItem('userPreferences');
        const prefs: UserPreferences | null = savedPrefs ? JSON.parse(savedPrefs) : null;
        setPreferences(prefs);

        const [routes, suggested] = await Promise.all([
          getRoutes(),
          prefs ? getRouteRecommendations(prefs, 3) : Promise.resolve([]),
        ]);

        setAllRoutes(routes);
        setSuggestedRoutes(
          suggested.map((r) => ({ ...r, matchScore: calculateMatchScore(r, prefs) })),
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadFavorites = async () => {
        const savedFavorites = await AsyncStorage.getItem('favoriteRoutes');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        } else {
          setFavorites([]);
        }
      };
      loadFavorites();
    }, [])
  );

  // Match score helper (mirrors routeService logic, for badge display)
  const calculateMatchScore = (route: Route, prefs: UserPreferences | null): number => {
    if (!prefs) return route.rating * 20;
    let score = route.rating * 10 + Math.min(route.reviewCount / 100, 10);
    if (route.cyclistType === prefs.cyclistType) score += 20;
    score += Math.max(10 - Math.abs(route.distance - prefs.distance) / 2, 0);
    score += Math.max(10 - Math.abs(route.elevation - prefs.elevation * 3) / 30, 0);
    score += Math.max(10 - Math.abs(route.shade - prefs.preferredShade) / 10, 0);
    score += Math.max(10 - Math.abs(route.airQuality - prefs.airQuality) / 10, 0);
    return score;
  };

  // Derived state from service data
  const favoriteRoutes = allRoutes.filter((route) => favorites.includes(route.id));
  const recommendedRoutes = allRoutes.slice(0, 6);

  const getMatchPercentage = (score: number): number => {
    return Math.min(Math.round(score), 100);
  };

  const toggleFavorite = async (routeId: string) => {
    const isFavorite = favorites.includes(routeId);
    const updated = isFavorite
      ? favorites.filter(id => id !== routeId)
      : [...favorites, routeId];
    setFavorites(updated);
    await AsyncStorage.setItem('favoriteRoutes', JSON.stringify(updated));
  };

  const RouteCard = ({ route, isFavorite, matchScore, showMatchBadge, onPress }: any) => (
    <Pressable onPress={onPress} className="mb-0">
      <View className={`bg-white dark:bg-[#111111] rounded-cy-md p-cy-md border-2 ${isFavorite ? 'border-[#fcd34d]' : 'border-[#e5e7eb] dark:border-[#2d2d2d]'}`}>
        {isFavorite && (
          <View className="absolute top-2 right-2 z-10">
            <MaterialCommunityIcons name="star" size={20} color="#f59e0b" />
          </View>
        )}

        {showMatchBadge && (
          <View className="absolute top-2 right-2 z-10">
            <LinearGradient colors={isDark ? ['#0f172a', '#1e293b'] : ['#a855f7', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="px-cy-sm py-1 rounded-cy-sm">
              <Text className="text-white text-xs font-semibold">{getMatchPercentage(matchScore)}% Match</Text>
            </LinearGradient>
          </View>
        )}

        <View className="mb-2 pr-[60px]">
          <Text className="text-base font-semibold text-[#1f2937] dark:text-slate-100" numberOfLines={2}>{route.name}</Text>
        </View>

        <Text className="text-xs text-[#6b7280] dark:text-slate-400 mb-2" numberOfLines={2}>{route.description}</Text>

        <View className="flex-row items-center bg-[#fef3c7] dark:bg-[#1a1a1a] px-cy-sm py-[6px] rounded-cy-sm mb-2 gap-1">
          <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
          <Text className="text-base font-bold text-[#1f2937] dark:text-slate-100">{route.rating}</Text>
          <Text className="text-xs text-[#6b7280] dark:text-slate-400">({route.reviewCount} reviews)</Text>
        </View>

        <View className="flex-row flex-wrap gap-cy-sm mb-2">
          <View className="flex-row items-center gap-1 flex-1" style={{ minWidth: '45%' }}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
            <Text className="text-xs text-[#6b7280] dark:text-slate-400">{route.distance} km</Text>
          </View>
          <View className="flex-row items-center gap-1 flex-1" style={{ minWidth: '45%' }}>
            <MaterialCommunityIcons name="clock" size={14} color="#6b7280" />
            <Text className="text-xs text-[#6b7280] dark:text-slate-400">{route.estimatedTime} min</Text>
          </View>
          <View className="flex-row items-center gap-1 flex-1" style={{ minWidth: '45%' }}>
            <FontAwesome5 name="mountain" size={14} color="#6b7280" />
            <Text className="text-xs text-[#6b7280] dark:text-slate-400">{route.elevation}m</Text>
          </View>
          <View className="flex-row items-center gap-1 flex-1 bg-[#e5e7eb] dark:bg-[#1a1a1a] px-cy-sm py-1 rounded" style={{ minWidth: '45%' }}>
            <Text className="text-xs text-[#4f46e5] capitalize">{route.cyclistType}</Text>
          </View>
        </View>

        {showMatchBadge && (
          <View className="pt-2 border-t border-[#e5e7eb] dark:border-[#2d2d2d]">
            <Text className="text-[11px] text-[#6b7280] dark:text-slate-400 font-semibold mb-1">Why this route:</Text>
            <View className="flex-row flex-wrap gap-1">
              {route.rating >= 4.7 && (
                <View className="border border-[#d1d5db] dark:border-[#2d2d2d] px-[6px] py-[2px] rounded">
                  <Text className="text-[11px] text-[#6b7280] dark:text-slate-400">Highly rated</Text>
                </View>
              )}
              {route.reviewCount > 400 && (
                <View className="border border-[#d1d5db] dark:border-[#2d2d2d] px-[6px] py-[2px] rounded">
                  <Text className="text-[11px] text-[#6b7280] dark:text-slate-400">Popular</Text>
                </View>
              )}
              {route.cyclistType === preferences?.cyclistType && (
                <View className="border border-[#d1d5db] dark:border-[#2d2d2d] px-[6px] py-[2px] rounded">
                  <Text className="text-[11px] text-[#6b7280] dark:text-slate-400">Your style</Text>
                </View>
              )}
              {preferences && Math.abs(route.distance - preferences.distance) < 3 && (
                <View className="border border-[#d1d5db] dark:border-[#2d2d2d] px-[6px] py-[2px] rounded">
                  <Text className="text-[11px] text-[#6b7280] dark:text-slate-400">Perfect distance</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f3f4f6] dark:bg-black">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#f3f4f6] dark:bg-black" scrollIndicatorInsets={{ right: 1 }}>
      {/* Header */}
      <View className="bg-white dark:bg-[#111111] px-cy-lg py-cy-md flex-row justify-between items-center border-b border-[#e5e7eb] dark:border-[#2d2d2d]">
        <Text className="text-2xl font-bold text-[#2563eb]">CycleLink</Text>
        <View className="flex-row items-center gap-cy-sm">
          {/* <Pressable onPress={() => navigation.navigate('UserJourneyPage')} className="flex-row items-center gap-1 px-cy-sm py-1">
            <MaterialCommunityIcons name="information" size={16} color="#6b7280" />
            <Text className="text-xs text-[#6b7280]">User Journey</Text>
          </Pressable> */}
          <View className="bg-[#e0e7ff] px-cy-sm py-1 rounded">
            <Text className="text-xs text-[#4f46e5] capitalize">{preferences?.cyclistType || 'General'}</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View className="p-cy-lg pb-[100px]">
        <View className="mb-cy-lg">
          <Text className="text-[32px] font-bold text-[#1f2937] dark:text-slate-100 mb-1">Discover Routes</Text>
          <Text className="text-sm text-[#6b7280] dark:text-slate-400">Highly rated routes recommended for you</Text>
        </View>

        {/* Info Banner */}
        {/* <LinearGradient colors={['#eff6ff', '#f3e8ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="flex-row items-center justify-between p-cy-md rounded-cy-md mb-cy-lg border border-[#bfdbfe]">
          <View className="flex-row items-start flex-1 gap-cy-md">
            <View className="w-10 h-10 bg-[#3b82f6] rounded-full justify-center items-center">
              <MaterialCommunityIcons name="information" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#1f2937] mb-[2px]">New to CycleLink?</Text>
              <Text className="text-xs text-[#6b7280]">Explore the complete user journey timeline</Text>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('UserJourneyPage')} className="px-cy-md py-[6px] rounded-cy-sm border border-[#d1d5db]">
            <Text className="text-xs text-[#6b7280]">View Timeline</Text>
          </Pressable>
        </LinearGradient> */}

        {/* Create Custom Route Button */}
        <Pressable onPress={() => navigation.navigate('RouteConfig')} className="bg-[#3b82f6] flex-row items-center justify-center py-cy-md px-cy-lg rounded-cy-md mb-[24px] gap-cy-sm">
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text className="text-white text-base font-semibold">Create Custom Route</Text>
        </Pressable>

        {/* Favorite Routes Section */}
        {favoriteRoutes.length > 0 && (
          <View className="mb-[24px]">
            <View className="flex-row items-center gap-cy-md mb-cy-lg">
              <LinearGradient colors={isDark ? ['#0f172a', '#1e293b'] : ['#fbbf24', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text className="text-2xl font-bold text-[#1f2937] dark:text-slate-100">Starred Routes</Text>
                <Text className="text-xs text-[#6b7280] dark:text-slate-400 mt-[2px]">Your favorite routes ready to ride again</Text>
              </View>
            </View>

            <View className="gap-cy-md">
              {favoriteRoutes.slice(0, 3).map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isFavorite={true}
                  onPress={() => navigation.navigate('RouteDetails', { routeId: route.id })}
                />
              ))}
            </View>
          </View>
        )}

        {/* Suggested for You Section */}
        {preferences && (
          <View className="mb-[24px]">
            <View className="flex-row items-center gap-cy-md mb-cy-lg">
              <LinearGradient colors={isDark ? ['#0f172a', '#1e293b'] : ['#a855f7', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text className="text-2xl font-bold text-[#1f2937] dark:text-slate-100">Suggested for You</Text>
                <Text className="text-xs text-[#6b7280] dark:text-slate-400 mt-[2px]">Personalized routes based on your preferences</Text>
              </View>
            </View>

            <View className="gap-cy-md">
              {suggestedRoutes.map((route, index) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isFavorite={favorites.includes(route.id)}
                  matchScore={route.matchScore}
                  showMatchBadge={true}
                  onPress={() => navigation.navigate('RouteDetails', { routeId: route.id })}
                />
              ))}
            </View>
          </View>
        )}

        {/* All Recommended Routes */}
        <View className="mb-[24px]">
          <Text className="text-2xl font-bold text-[#1f2937] dark:text-slate-100">
            All Recommended Routes
          </Text>

          {recommendedRoutes.length > 0 ? (
            <View className="gap-cy-md">
              {recommendedRoutes.slice(0, 3).map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isFavorite={favorites.includes(route.id)}
                  onPress={() =>
                    navigation.navigate('RouteDetails', { routeId: route.id })
                  }
                />
              ))}
            </View>
          ) : (
            <Text className="mt-4 text-base text-gray-500 dark:text-slate-400">
              Start your journey by using the App!
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
