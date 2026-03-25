import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockRoutes, type Route, type UserPreferences } from '../types';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<any, 'HomePage'>;

export default function HomeScreen({ navigation }: Props) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const loadPreferences = async () => {
      const savedPrefs = await AsyncStorage.getItem('userPreferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    };
    loadPreferences();
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

  // Calculate match score for personalized recommendations
  const calculateMatchScore = (route: Route): number => {
    if (!preferences) return route.rating * 20;

    let score = 0;
    score += route.rating * 10;
    score += Math.min(route.reviewCount / 100, 10);

    if (route.cyclistType === preferences.cyclistType) {
      score += 20;
    }

    const distanceDiff = Math.abs(route.distance - preferences.distance);
    score += Math.max(10 - distanceDiff / 2, 0);

    const elevationDiff = Math.abs(route.elevation - preferences.elevation * 3);
    score += Math.max(10 - elevationDiff / 30, 0);

    const shadeDiff = Math.abs(route.shade - preferences.preferredShade);
    score += Math.max(10 - shadeDiff / 10, 0);

    const airQualityDiff = Math.abs(route.airQuality - preferences.airQuality);
    score += Math.max(10 - airQualityDiff / 10, 0);

    return score;
  };

  // Get favorite routes
  const favoriteRoutes = mockRoutes.filter((route) => favorites.includes(route.id));

  // Get personalized suggestions
  const suggestedRoutes = [...mockRoutes]
    .map(route => ({
      ...route,
      matchScore: calculateMatchScore(route)
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // Filter routes based on user preferences
  const recommendedRoutes = mockRoutes
    .filter((route) => {
      if (!preferences) return true;
      return (
        route.cyclistType === preferences.cyclistType &&
        route.distance <= preferences.distance * 1.5 &&
        route.airQuality >= preferences.airQuality - 20
      );
    })
    .slice(0, 6);

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
      <View className={`bg-white rounded-cy-md p-cy-md border-2 ${isFavorite ? 'border-[#fcd34d]' : 'border-[#e5e7eb]'}`}>
        {isFavorite && (
          <View className="absolute top-2 right-2 z-10">
            <MaterialCommunityIcons name="star" size={20} color="#f59e0b" />
          </View>
        )}

        {showMatchBadge && (
          <View className="absolute top-2 right-2 z-10">
            <LinearGradient colors={['#a855f7', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="px-cy-sm py-1 rounded-cy-sm">
              <Text className="text-white text-xs font-semibold">{getMatchPercentage(matchScore)}% Match</Text>
            </LinearGradient>
          </View>
        )}

        <View className="mb-2 pr-[60px]">
          <Text className="text-base font-semibold text-[#1f2937]" numberOfLines={2}>{route.name}</Text>
        </View>

        <Text className="text-xs text-[#6b7280] mb-2" numberOfLines={2}>{route.description}</Text>

        <View className="flex-row items-center bg-[#fef3c7] px-cy-sm py-[6px] rounded-cy-sm mb-2 gap-1">
          <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
          <Text className="text-base font-bold text-[#1f2937]">{route.rating}</Text>
          <Text className="text-xs text-[#6b7280]">({route.reviewCount} reviews)</Text>
        </View>

        <View className="flex-row flex-wrap gap-cy-sm mb-2">
          <View className="flex-row items-center gap-1 flex-1" style={{ minWidth: '45%' }}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
            <Text className="text-xs text-[#6b7280]">{route.distance} km</Text>
          </View>
          <View className="flex-row items-center gap-1 flex-1" style={{ minWidth: '45%' }}>
            <MaterialCommunityIcons name="clock" size={14} color="#6b7280" />
            <Text className="text-xs text-[#6b7280]">{route.estimatedTime} min</Text>
          </View>
          <View className="flex-row items-center gap-1 flex-1" style={{ minWidth: '45%' }}>
            <FontAwesome5 name="mountain" size={14} color="#6b7280" />
            <Text className="text-xs text-[#6b7280]">{route.elevation}m</Text>
          </View>
          <View className="flex-row items-center gap-1 flex-1 bg-[#e5e7eb] px-cy-sm py-1 rounded" style={{ minWidth: '45%' }}>
            <Text className="text-xs text-[#4f46e5] capitalize">{route.cyclistType}</Text>
          </View>
        </View>

        {showMatchBadge && (
          <View className="pt-2 border-t border-[#e5e7eb]">
            <Text className="text-[11px] text-[#6b7280] font-semibold mb-1">Why this route:</Text>
            <View className="flex-row flex-wrap gap-1">
              {route.rating >= 4.7 && (
                <View className="border border-[#d1d5db] px-[6px] py-[2px] rounded">
                  <Text className="text-[11px] text-[#6b7280]">Highly rated</Text>
                </View>
              )}
              {route.reviewCount > 400 && (
                <View className="border border-[#d1d5db] px-[6px] py-[2px] rounded">
                  <Text className="text-[11px] text-[#6b7280]">Popular</Text>
                </View>
              )}
              {route.cyclistType === preferences?.cyclistType && (
                <View className="border border-[#d1d5db] px-[6px] py-[2px] rounded">
                  <Text className="text-[11px] text-[#6b7280]">Your style</Text>
                </View>
              )}
              {preferences && Math.abs(route.distance - preferences.distance) < 3 && (
                <View className="border border-[#d1d5db] px-[6px] py-[2px] rounded">
                  <Text className="text-[11px] text-[#6b7280]">Perfect distance</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <ScrollView className="flex-1 bg-[#f3f4f6]" scrollIndicatorInsets={{ right: 1 }}>
      {/* Header */}
      <View className="bg-white px-cy-lg py-cy-md flex-row justify-between items-center border-b border-[#e5e7eb]">
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
          <Text className="text-[32px] font-bold text-[#1f2937] mb-1">Discover Routes</Text>
          <Text className="text-sm text-[#6b7280]">Highly rated routes recommended for you</Text>
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
              <LinearGradient colors={['#fbbf24', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text className="text-2xl font-bold text-[#1f2937]">Starred Routes</Text>
                <Text className="text-xs text-[#6b7280] mt-[2px]">Your favorite routes ready to ride again</Text>
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
              <LinearGradient colors={['#a855f7', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text className="text-2xl font-bold text-[#1f2937]">Suggested for You</Text>
                <Text className="text-xs text-[#6b7280] mt-[2px]">Personalized routes based on your preferences</Text>
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
          <Text className="text-2xl font-bold text-[#1f2937]">All Recommended Routes</Text>

          <View className="gap-cy-md">
            {recommendedRoutes.slice(0, 3).map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                isFavorite={favorites.includes(route.id)}
                onPress={() => navigation.navigate('RouteDetails', { routeId: route.id })}
              />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
