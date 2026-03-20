import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockRoutes, type Route, type UserPreferences } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<any, 'HomeTab'>;

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
    <Pressable onPress={onPress} style={styles.routeCardContainer}>
      <View style={[styles.routeCard, isFavorite && styles.routeCardFavorite]}>
        {isFavorite && (
          <View style={styles.favoriteBadge}>
            <MaterialCommunityIcons name="star" size={20} color="#f59e0b" />
          </View>
        )}

        {showMatchBadge && (
          <View style={styles.matchBadgeContainer}>
            <LinearGradient colors={['#a855f7', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>{getMatchPercentage(matchScore)}% Match</Text>
            </LinearGradient>
          </View>
        )}

        <View style={styles.cardHeader}>
          <Text style={styles.routeName} numberOfLines={2}>{route.name}</Text>
        </View>

        <Text style={styles.routeDescription} numberOfLines={2}>{route.description}</Text>

        <View style={styles.ratingContainer}>
          <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
          <Text style={styles.ratingText}>{route.rating}</Text>
          <Text style={styles.reviewCount}>({route.reviewCount} reviews)</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
            <Text style={styles.detailText}>{route.distance} km</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="clock" size={14} color="#6b7280" />
            <Text style={styles.detailText}>{route.estimatedTime} min</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="mountain" size={14} color="#6b7280" />
            <Text style={styles.detailText}>{route.elevation}m</Text>
          </View>
          <View style={[styles.detailItem, styles.badgeItem]}>
            <Text style={styles.badgeText}>{route.cyclistType}</Text>
          </View>
        </View>

        {showMatchBadge && (
          <View style={styles.whyThisRoute}>
            <Text style={styles.whyText}>Why this route:</Text>
            <View style={styles.reasonBadges}>
              {route.rating >= 4.7 && (
                <View style={styles.reasonBadge}>
                  <Text style={styles.reasonText}>Highly rated</Text>
                </View>
              )}
              {route.reviewCount > 400 && (
                <View style={styles.reasonBadge}>
                  <Text style={styles.reasonText}>Popular</Text>
                </View>
              )}
              {route.cyclistType === preferences?.cyclistType && (
                <View style={styles.reasonBadge}>
                  <Text style={styles.reasonText}>Your style</Text>
                </View>
              )}
              {preferences && Math.abs(route.distance - preferences.distance) < 3 && (
                <View style={styles.reasonBadge}>
                  <Text style={styles.reasonText}>Perfect distance</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container} scrollIndicatorInsets={{ right: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CycleLink</Text>
        <View style={styles.headerRight}>
          {/* <Pressable onPress={() => navigation.navigate('UserJourneyPage')} style={styles.infoButton}>
            <MaterialCommunityIcons name="information" size={16} color="#6b7280" />
            <Text style={styles.infoButtonText}>User Journey</Text>
          </Pressable> */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{preferences?.cyclistType || 'General'}</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Discover Routes</Text>
          <Text style={styles.mainSubtitle}>Highly rated routes recommended for you</Text>
        </View>

        {/* Info Banner */}
        {/* <LinearGradient colors={['#eff6ff', '#f3e8ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.infoBanner}>
          <View style={styles.infoBannerContent}>
            <View style={styles.infoBannerIcon}>
              <MaterialCommunityIcons name="information" size={20} color="white" />
            </View>
            <View style={styles.infoBannerText}>
              <Text style={styles.infoBannerTitle}>New to CycleLink?</Text>
              <Text style={styles.infoBannerDescription}>Explore the complete user journey timeline</Text>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('UserJourneyPage')} style={styles.infoBannerButton}>
            <Text style={styles.infoBannerButtonText}>View Timeline</Text>
          </Pressable>
        </LinearGradient> */}

        {/* Create Custom Route Button */}
        <Pressable onPress={() => navigation.navigate('Recommendation')} style={styles.createRouteButton}>
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.createRouteButtonText}>Create Custom Route</Text>
        </Pressable>

        {/* Favorite Routes Section */}
        {favoriteRoutes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={['#fbbf24', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sectionIcon}>
                <MaterialCommunityIcons name="star" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text style={styles.sectionTitle}>Starred Routes</Text>
                <Text style={styles.sectionDescription}>Your favorite routes ready to ride again</Text>
              </View>
            </View>

            <View style={styles.routesContainer}>
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
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={['#a855f7', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sectionIcon}>
                <MaterialCommunityIcons name="sparkles" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text style={styles.sectionTitle}>Suggested for You</Text>
                <Text style={styles.sectionDescription}>Personalized routes based on your preferences</Text>
              </View>
            </View>

            <View style={styles.routesContainer}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Recommended Routes</Text>

          <View style={styles.routesContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  infoButtonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  badge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#4f46e5',
    textTransform: 'capitalize',
  },
  mainContent: {
    padding: 16,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  infoBannerIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBannerText: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  infoBannerDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoBannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  infoBannerButtonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  createRouteButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  createRouteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  routesContainer: {
    gap: 12,
  },
  routeCardContainer: {
    marginBottom: 0,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  routeCardFavorite: {
    borderColor: '#fcd34d',
    borderWidth: 2,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  matchBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHeader: {
    marginBottom: 8,
    paddingRight: 60,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  routeDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  reviewCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: '45%',
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  badgeItem: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  whyThisRoute: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  whyText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  reasonBadge: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reasonText: {
    fontSize: 11,
    color: '#6b7280',
  },
});
