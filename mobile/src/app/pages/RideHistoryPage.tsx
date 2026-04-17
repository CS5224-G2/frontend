import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StyleSheet,
  UIManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { useColorScheme } from 'nativewind';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/native/Common';
import { type RideHistory, type GraphDataPoint, type GraphPeriod } from '../../../../shared/types/index';
import { getRideHistory, getDistanceStats } from '../../services/rideService';
import { isCoordinatePlaceholderName } from '../utils/placeGeocode';
import { routeToMapCoordinates } from '@/utils/routeGeometry';
import {
  MAX_FAVORITE_ROUTES,
  addFavoriteRouteByRouteId,
  getLocalFavoriteRouteIds,
  removeFavoriteRouteByRouteId,
} from '../../services/favoriteRoutesService';

type Props = NativeStackScreenProps<any, 'RideHistory'>;
type DistanceStatsByPeriod = Record<GraphPeriod, GraphDataPoint[]>;

/** Skip rAF / Animated drivers in Jest — they schedule updates outside React's act(). */
const isTestEnv = process.env.NODE_ENV === 'test';

const emptyDistanceStats: DistanceStatsByPeriod = {
  week: [],
  month: [],
};
const supportsNativeGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

function dedupeFavoriteRouteIds(routeIds: string[]): string[] {
  const uniqueIds: string[] = [];
  const seenRouteIds = new Set<string>();

  for (const routeId of routeIds) {
    if (typeof routeId !== 'string' || seenRouteIds.has(routeId)) {
      continue;
    }

    seenRouteIds.add(routeId);
    uniqueIds.push(routeId);

    if (uniqueIds.length >= MAX_FAVORITE_ROUTES) {
      break;
    }
  }

  return uniqueIds;
}

function getGraphLabel(item: GraphDataPoint) {
  return 'day' in item ? item.day : item.week;
}

function formatEndpointTitle(name: string | undefined, fallback: string): string {
  const trimmed = name?.trim() ?? '';
  return trimmed && !isCoordinatePlaceholderName(trimmed) ? trimmed : fallback;
}

function shouldReplaceRouteName(ride: RideHistory): boolean {
  const routeName = ride.routeName.trim();
  if (!routeName) {
    return true;
  }

  if (isCoordinatePlaceholderName(routeName)) {
    return true;
  }

  return routeName
    .split(/->|→/)
    .map((part) => part.trim())
    .some((part) => isCoordinatePlaceholderName(part));
}

function getRideDisplayName(ride: RideHistory): string {
  if (!shouldReplaceRouteName(ride)) {
    return ride.routeName.trim();
  }

  if (!ride.routeDetails) {
    return 'Pinned route';
  }

  const startLabel = formatEndpointTitle(ride.routeDetails.startPoint.name, 'Pinned start');
  const endLabel = formatEndpointTitle(ride.routeDetails.endPoint.name, 'Pinned location');

  if (startLabel === endLabel) {
    return `${startLabel} Loop`;
  }

  return `${startLabel} to ${endLabel}`;
}

function RouteMiniPreview({
  ride,
  isDark,
}: {
  ride: RideHistory;
  isDark: boolean;
}) {
  const width = 86;
  const height = 56;
  const padding = 7;
  const route = ride.routeDetails;
  const points = route ? routeToMapCoordinates(route) : [];
  const validPoints = points.filter(
    (point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
  );

  if (validPoints.length < 2) {
    return (
      <View
        testID={`ride-preview-${ride.id}`}
        className="rounded-[10px] border overflow-hidden"
        style={{
          width,
          height,
          borderColor: isDark ? '#2d2d2d' : '#dbeafe',
          backgroundColor: isDark ? '#020617' : '#eff6ff',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: padding,
            right: padding,
            top: height / 2,
            height: 1,
            borderStyle: 'dashed',
            borderTopWidth: 1,
            borderColor: isDark ? '#1e293b' : '#dbeafe',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 18,
            top: 31,
            width: 42,
            height: 2.5,
            borderRadius: 999,
            backgroundColor: isDark ? '#60a5fa' : '#2563eb',
            transform: [{ rotate: '-18deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 20,
            top: 28,
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: '#22c55e',
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 18,
            top: 20,
            width: 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: '#ef4444',
          }}
        />
      </View>
    );
  }

  const lats = validPoints.map((point) => point.latitude);
  const lngs = validPoints.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.0008);
  const lngSpan = Math.max(maxLng - minLng, 0.0008);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const normalized = validPoints.map((point) => ({
    x: padding + ((point.longitude - minLng) / lngSpan) * innerWidth,
    y: height - padding - ((point.latitude - minLat) / latSpan) * innerHeight,
  }));
  const segments = normalized.slice(1).map((point, index) => {
    const previous = normalized[index];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const angle = `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`;
    const midpointX = (previous.x + point.x) / 2;
    const midpointY = (previous.y + point.y) / 2;

    return {
      key: `segment-${index}`,
      left: midpointX - length / 2,
      top: midpointY - 1.25,
      width: length,
      angle,
    };
  });

  const start = normalized[0];
  const end = normalized[normalized.length - 1];

  return (
    <View
      testID={`ride-preview-${ride.id}`}
      className="rounded-[10px] border overflow-hidden"
      style={{
        width,
        height,
        borderColor: isDark ? '#2d2d2d' : '#dbeafe',
        backgroundColor: isDark ? '#020617' : '#eff6ff',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: padding,
          right: padding,
          top: height / 2,
          height: 1,
          borderStyle: 'dashed',
          borderTopWidth: 1,
          borderColor: isDark ? '#1e293b' : '#dbeafe',
        }}
      />
      {segments.map((segment) => (
        <View
          key={segment.key}
          style={{
            position: 'absolute',
            left: segment.left,
            top: segment.top - 1.25,
            width: segment.width,
            height: 2.5,
            borderRadius: 999,
            backgroundColor: isDark ? '#60a5fa' : '#2563eb',
            transform: [{ rotate: segment.angle }],
          }}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          left: start.x - 3.5,
          top: start.y - 3.5,
          width: 7,
          height: 7,
          borderRadius: 999,
          backgroundColor: '#22c55e',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: end.x - 3.5,
          top: end.y - 3.5,
          width: 7,
          height: 7,
          borderRadius: 999,
          backgroundColor: '#ef4444',
        }}
      />
    </View>
  );
}

function AnimatedMetricValue({
  value,
  formatter,
  style,
  animationKey,
}: {
  value: number;
  formatter: (value: number) => string;
  style?: any;
  animationKey: string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (isTestEnv) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    let frame = 0;
    let startTime = 0;
    const from = previousValue.current;
    const to = value;
    const duration = 480;

    const step = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = from + (to - from) * eased;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        previousValue.current = to;
      }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [animationKey, value]);

  return <Text style={style}>{formatter(displayValue)}</Text>;
}

function MetricCard({
  label,
  value,
  formatter,
  isDark,
}: {
  label: string;
  value: number;
  formatter: (value: number) => string;
  isDark: boolean;
}) {
  return (
    <View style={{ width: '48%' }}>
      <Card style={{ padding: 10, borderRadius: 12 }}>
        <CardContent>
          <Text className="text-xs text-[#64748b] dark:text-slate-400">{label}</Text>
          <AnimatedMetricValue
            value={value}
            formatter={formatter}
            animationKey={label}
            style={[styles.metricValue, isDark && styles.metricValueDark]}
          />
        </CardContent>
      </Card>
    </View>
  );
}

function GraphBar({
  label,
  distance,
  maxDistance,
  isDark,
}: {
  label: string;
  distance: number;
  maxDistance: number;
  isDark: boolean;
}) {
  const ratio = maxDistance > 0 ? distance / maxDistance : 0;
  const barProgress = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    if (isTestEnv) {
      barProgress.setValue(ratio);
      return;
    }
    Animated.timing(barProgress, {
      toValue: ratio,
      duration: 360,
      useNativeDriver: false,
    }).start();
  }, [barProgress, ratio]);

  return (
    <View className="flex-row items-center mb-[6px]">
      <Text className="text-xs text-slate-500 dark:text-slate-400" style={{ width: 50 }}>{label}</Text>
      <View className="flex-1 rounded-full bg-[#e2e8f0] dark:bg-[#2d2d2d] mx-2" style={{ height: 8 }}>
        <Animated.View
          className="rounded-full bg-[#3b82f6]"
          style={{
            height: 8,
            width: barProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
      <AnimatedMetricValue
        value={distance}
        formatter={(value) => `${value.toFixed(1)} km`}
        animationKey={label}
        style={[styles.graphValue, isDark && styles.graphValueDark]}
      />
    </View>
  );
}

export default function RideHistoryPage({ navigation }: Props) {
  const [period, setPeriod] = useState<GraphPeriod>('week');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);
  const [distanceStats, setDistanceStats] = useState<DistanceStatsByPeriod>(emptyDistanceStats);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [periodToggleWidth, setPeriodToggleWidth] = useState(0);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const favoritesRef = useRef<string[]>([]);
  const periodIndicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    const isFabric = Boolean((globalThis as any).nativeFabricUIManager);
    if (Platform.OS === 'android' && !isFabric && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const loadData = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [history, weeklyStats, monthlyStats, localFavoriteIds] = await Promise.all([
        getRideHistory(),
        getDistanceStats('week'),
        getDistanceStats('month'),
        getLocalFavoriteRouteIds(),
      ]);
      setRideHistory(history);
      setDistanceStats({
        week: weeklyStats,
        month: monthlyStats,
      });

      const sanitizedFavorites = dedupeFavoriteRouteIds(localFavoriteIds);

      favoritesRef.current = sanitizedFavorites;
      setFavorites(sanitizedFavorites);
    } catch (error) {
      console.warn('Error loading ride data', error);
    } finally {
      if (mode === 'refresh') {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData('refresh');
    }, [loadData])
  );

  const graphData = distanceStats[period];
  const graphRows = useMemo(
    () =>
      graphData.map((item, index) => ({
        key: `graph-row-${index}`,
        label: getGraphLabel(item),
        distance: item.distance,
      })),
    [graphData]
  );
  const uniqueFavoriteRouteIds = useMemo(() => dedupeFavoriteRouteIds(favorites), [favorites]);

  const handlePeriodChange = (nextPeriod: GraphPeriod) => {
    if (nextPeriod === period) {
      return;
    }

    LayoutAnimation.configureNext({
      duration: 320,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });

    setPeriod(nextPeriod);
  };

  const totalGraphDistance = graphData.reduce((sum, item) => sum + item.distance, 0);
  const totalTime = rideHistory.reduce((sum, ride) => sum + ride.totalTime, 0);
  const totalCheckpoints = rideHistory.reduce((sum, ride) => sum + ride.checkpoints, 0);
  const totalDistance = graphData.reduce((sum, item) => sum + item.distance, 0);
  const maxDistance = Math.max(...graphData.map((item) => item.distance), 1);
  const periodIndicatorWidth = periodToggleWidth > 0 ? (periodToggleWidth - 10) / 2 : 0;

  useEffect(() => {
    if (isTestEnv) {
      periodIndicator.setValue(period === 'week' ? 0 : 1);
      return;
    }
    Animated.spring(periodIndicator, {
      toValue: period === 'week' ? 0 : 1,
      damping: 18,
      mass: 0.8,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [period, periodIndicator]);

  const toggleFavorite = async (routeId: string, routeName: string) => {
    const previousFavorites = dedupeFavoriteRouteIds(await getLocalFavoriteRouteIds());
    const isFav = previousFavorites.includes(routeId);

    if (!isFav && previousFavorites.length >= MAX_FAVORITE_ROUTES) {
      Alert.alert(
        'Favorites limit reached',
        `You can only save up to ${MAX_FAVORITE_ROUTES} routes. Remove one before adding ${routeName}.`
      );
      return;
    }

    try {
      if (isFav) {
        await removeFavoriteRouteByRouteId(routeId);
      } else {
        await addFavoriteRouteByRouteId(routeId);
      }

      const syncedFavorites = dedupeFavoriteRouteIds(await getLocalFavoriteRouteIds());
      favoritesRef.current = syncedFavorites;
      setFavorites(syncedFavorites);

      Alert.alert(
        isFav ? 'Removed from favorites' : 'Added to favorites',
        `${routeName} has been ${isFav ? 'removed from' : 'added to'} favorites.`
      );
    } catch (error) {
      console.warn('Error saving favorites', error);

      const statusCode =
        typeof error === 'object' && error && 'status' in error
          ? Number((error as { status?: unknown }).status)
          : undefined;

      if (!isFav && statusCode === 409) {
        Alert.alert(
          'Favorites limit reached',
          `You can only save up to ${MAX_FAVORITE_ROUTES} routes. Remove one before adding ${routeName}.`
        );
        await loadData('refresh');
        return;
      }

      Alert.alert('Error', 'Unable to update favorites right now.');
      await loadData('refresh');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderRide = ({ item }: { item: RideHistory }) => {
    const isFav = uniqueFavoriteRouteIds.includes(item.routeId);
    const displayName = getRideDisplayName(item);

    return (
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        onPress={() => navigation.navigate('HistoryDetails', { rideId: item.id })}
      >
        <View
          className="rounded-[12px] border p-3 bg-[#f8fbff] dark:bg-[#111111] border-[#bfdbfe] dark:border-[#2d2d2d]"
          style={{
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0 : 0.08,
            shadowRadius: 8,
            elevation: isDark ? 0 : 2,
          }}
        >
          <View className="flex-row gap-3 mb-[6px]">
            <View className="flex-1 justify-between">
              <View className="flex-row justify-between items-start">
                <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100 flex-1 mr-2" numberOfLines={2}>
                  {displayName}
                </Text>
                <Pressable onPress={() => toggleFavorite(item.routeId, displayName)}>
                  <MaterialCommunityIcons
                    name={isFav ? 'star' : 'star-outline'}
                    size={24}
                    color={isFav ? '#f59e0b' : '#a1a1aa'}
                  />
                </Pressable>
              </View>

              <Text className="text-xs text-[#6b7280] dark:text-slate-400 mt-1">{item.completionDate} • {item.completionTime}</Text>
            </View>

            <RouteMiniPreview ride={item} isDark={isDark} />
          </View>

          <View className="flex-row flex-wrap justify-between">
            <View className="flex-row items-center gap-1 my-[3px]" style={{ width: '48%' }}>
              <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
              <Text className="text-[13px] text-[#334155] dark:text-slate-100 ml-1">{item.distance} km</Text>
            </View>
            <View className="flex-row items-center gap-1 my-[3px]" style={{ width: '48%' }}>
              <MaterialCommunityIcons name="clock" size={14} color="#6b7280" />
              <Text className="text-[13px] text-[#334155] dark:text-slate-100 ml-1">{formatTime(item.totalTime)}</Text>
            </View>
            <View className="flex-row items-center gap-1 my-[3px]" style={{ width: '48%' }}>
              <MaterialCommunityIcons name="speedometer" size={14} color="#6b7280" />
              <Text className="text-[13px] text-[#334155] dark:text-slate-100 ml-1">{item.avgSpeed} km/h</Text>
            </View>
            <View className="flex-row items-center gap-1 my-[3px]" style={{ width: '48%' }}>
              <MaterialCommunityIcons name="map-legend" size={14} color="#6b7280" />
              <Text className="text-[13px] text-[#334155] dark:text-slate-100 ml-1">{item.checkpoints} checkpoints</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-black">
        <ActivityIndicator testID="ride-history-loading" size="large" color={isDark ? '#3b82f6' : '#1D4ED8'} />
      </View>
    );
  }

  // if there is no ride -> add a word saying "Start your first ride!"
  if (rideHistory.length === 0) {
    return (
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-black"
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData('refresh')} />}
      >
        <View className="flex-1 justify-center items-start bg-slate-50 dark:bg-black">
          <Text className="text-[28px] font-bold text-[#1e293b] dark:text-slate-100 text-left">
            Ride History
          </Text>
          <Text className="text-sm text-[#64748b] dark:text-slate-400 mt-1 text-left">
            Start your first ride!
          </Text>
        </View>
      </ScrollView>
    );
  } else {
    return (
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-black"
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData('refresh')} />}
      >
        <View className="mb-[12px]">
          <Text className="text-[28px] font-bold text-[#1e293b] dark:text-slate-100">Ride History</Text>
          <Text className="text-sm text-[#64748b] dark:text-slate-400 mt-1">Track progress & achievements</Text>
        </View>

        <View className="flex-row flex-wrap justify-between mb-[12px]">
          <MetricCard
            label="Total Rides"
            value={rideHistory.length}
            formatter={(value) => `${Math.round(value)}`}
            isDark={isDark}
          />
          <MetricCard
            label="Distance"
            value={totalDistance}
            formatter={(value) => `${value.toFixed(1)} km`}
            isDark={isDark}
          />
          <MetricCard
            label="Total Time"
            value={totalTime}
            formatter={(value) => formatTime(Math.round(value))}
            isDark={isDark}
          />
          <MetricCard
            label="Checkpoints"
            value={totalCheckpoints}
            formatter={(value) => `${Math.round(value)}`}
            isDark={isDark}
          />
        </View>

        <Card>
          <CardHeader>
            <View className="flex-row justify-between items-center">
              <View>
                <CardTitle>Distance Over Time</CardTitle>
                <CardDescription>
                  {`Total ${period === 'week' ? 'this week' : 'this month'}: `}
                  <AnimatedMetricValue
                    value={totalGraphDistance}
                    formatter={(value) => `${value.toFixed(1)} km`}
                    animationKey="total-graph-distance"
                  />
                </CardDescription>
              </View>
              <View
                onLayout={(event) => setPeriodToggleWidth(event.nativeEvent.layout.width)}
                style={styles.periodToggle}
              >
                {supportsNativeGlass ? (
                  <GlassView
                    style={styles.periodToggleGlass}
                    glassEffectStyle="clear"
                    colorScheme={isDark ? 'dark' : 'light'}
                    tintColor={isDark ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.28)'}
                  />
                ) : (
                  <View
                    style={[
                      styles.periodToggleGlass,
                      isDark ? styles.periodToggleFallbackDark : styles.periodToggleFallbackLight,
                    ]}
                  />
                )}
                {periodIndicatorWidth > 0 ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.periodIndicator,
                      {
                        width: periodIndicatorWidth,
                        transform: [
                          {
                            translateX: periodIndicator.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, periodIndicatorWidth + 2],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {supportsNativeGlass ? (
                      <GlassView
                        style={StyleSheet.absoluteFillObject}
                        glassEffectStyle={{
                          style: 'regular',
                          animate: true,
                          animationDuration: 0.28,
                        }}
                        colorScheme={isDark ? 'dark' : 'light'}
                        tintColor={isDark ? 'rgba(59, 130, 246, 0.22)' : 'rgba(255, 255, 255, 0.62)'}
                      />
                    ) : (
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          styles.periodIndicatorFallback,
                        ]}
                      />
                    )}
                  </Animated.View>
                ) : null}
                <Pressable style={styles.periodButton} onPress={() => handlePeriodChange('week')}>
                  <Text
                    style={[
                      styles.periodButtonLabel,
                      period === 'week'
                        ? styles.periodButtonLabelActive
                        : isDark
                          ? styles.periodButtonLabelDark
                          : styles.periodButtonLabelLight,
                    ]}
                  >
                    Week
                  </Text>
                </Pressable>
                <Pressable style={styles.periodButton} onPress={() => handlePeriodChange('month')}>
                  <Text
                    style={[
                      styles.periodButtonLabel,
                      period === 'month'
                        ? styles.periodButtonLabelActive
                        : isDark
                          ? styles.periodButtonLabelDark
                          : styles.periodButtonLabelLight,
                    ]}
                  >
                    Month
                  </Text>
                </Pressable>
              </View>
            </View>
          </CardHeader>
          <CardContent>
            <View className="mt-2 py-1">
              {graphRows.map((row) => (
                <GraphBar
                  key={row.key}
                  label={row.label}
                  distance={row.distance}
                  maxDistance={maxDistance}
                  isDark={isDark}
                />
              ))}
            </View>
          </CardContent>
        </Card>

        <View className="my-[10px]">
          <Text className="text-xl font-bold text-[#1e293b] dark:text-slate-100">Recent Rides</Text>
          <Text className="text-xs text-[#64748b] dark:text-slate-400">Tap a ride for details</Text>
        </View>

        <FlatList
          data={rideHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderRide}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  metricValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  metricValueDark: {
    color: '#e2e8f0',
  },
  graphValue: {
    width: 60,
    textAlign: 'right',
    fontSize: 11,
    color: '#64748b',
  },
  graphValueDark: {
    color: '#94a3b8',
  },
  periodToggle: {
    width: 118,
    height: 38,
    padding: 4,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  periodToggleGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  periodToggleFallbackLight: {
    backgroundColor: 'rgba(226, 232, 240, 0.72)',
  },
  periodToggleFallbackDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.86)',
  },
  periodIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  periodIndicatorFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  periodButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  periodButtonLabelActive: {
    color: '#2563eb',
  },
  periodButtonLabelLight: {
    color: '#334155',
  },
  periodButtonLabelDark: {
    color: '#cbd5e1',
  },
});
