import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type Props = NativeStackScreenProps<any, 'RideHistory'>;
type DistanceStatsByPeriod = Record<GraphPeriod, GraphDataPoint[]>;

const emptyDistanceStats: DistanceStatsByPeriod = {
  week: [],
  month: [],
};
const supportsNativeGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

function getGraphLabel(item: GraphDataPoint) {
  return 'day' in item ? item.day : item.week;
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
  const [periodToggleWidth, setPeriodToggleWidth] = useState(0);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const periodIndicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [history, weeklyStats, monthlyStats, saved] = await Promise.all([
          getRideHistory(),
          getDistanceStats('week'),
          getDistanceStats('month'),
          AsyncStorage.getItem('favoriteRoutes'),
        ]);
        setRideHistory(history);
        setDistanceStats({
          week: weeklyStats,
          month: monthlyStats,
        });
        if (saved) setFavorites(JSON.parse(saved));
      } catch (error) {
        console.warn('Error loading ride data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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

  const handlePeriodChange = (nextPeriod: GraphPeriod) => {
    if (nextPeriod === period) {
      return;
    }

    setPeriod(nextPeriod);
  };

  const totalGraphDistance = graphData.reduce((sum, item) => sum + item.distance, 0);
  const totalTime = rideHistory.reduce((sum, ride) => sum + ride.totalTime, 0);
  const totalCheckpoints = rideHistory.reduce((sum, ride) => sum + ride.checkpoints, 0);
  const totalDistance = graphData.reduce((sum, item) => sum + item.distance, 0);
  const maxDistance = Math.max(...graphData.map((item) => item.distance), 1);
  const periodIndicatorWidth = periodToggleWidth > 0 ? (periodToggleWidth - 10) / 2 : 0;

  useEffect(() => {
    Animated.spring(periodIndicator, {
      toValue: period === 'week' ? 0 : 1,
      damping: 18,
      mass: 0.8,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [period, periodIndicator]);

  const toggleFavorite = async (routeId: string, routeName: string) => {
    const isFav = favorites.includes(routeId);
    const updatedFavorites = isFav ? favorites.filter((id) => id !== routeId) : [...favorites, routeId];
    setFavorites(updatedFavorites);

    try {
      await AsyncStorage.setItem('favoriteRoutes', JSON.stringify(updatedFavorites));
      Alert.alert(
        isFav ? 'Removed from favorites' : 'Added to favorites',
        `${routeName} has been ${isFav ? 'removed from' : 'added to'} favorites.`
      );
    } catch (error) {
      console.warn('Error saving favorites', error);
      Alert.alert('Error', 'Unable to update favorites right now.');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderRide = ({ item }: { item: RideHistory }) => {
    const isFav = favorites.includes(item.routeId);
    const displayName = item.routeName;

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
          <View className="flex-row justify-between items-center mb-[6px]">
            <Text className="text-base font-bold text-[#1e293b] dark:text-slate-100 flex-1 mr-2">{displayName}</Text>
            <Pressable onPress={() => toggleFavorite(item.routeId, displayName)}>
              <MaterialCommunityIcons
                name={isFav ? 'star' : 'star-outline'}
                size={24}
                color={isFav ? '#f59e0b' : '#a1a1aa'}
              />
            </Pressable>
          </View>

          <Text className="text-xs text-[#6b7280] dark:text-slate-400 mb-2">{item.completionDate} • {item.completionTime}</Text>

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

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-black" contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
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
