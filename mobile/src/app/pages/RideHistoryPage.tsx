import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../components/native/Common';
import { type RideHistory, type GraphDataPoint, type GraphPeriod } from '../../../../shared/types/index';
import { getRideHistory, getDistanceStats } from '../../services/rideService';

type Props = NativeStackScreenProps<any, 'RideHistory'>;
type DistanceStatsByPeriod = Record<GraphPeriod, GraphDataPoint[]>;

const emptyDistanceStats: DistanceStatsByPeriod = {
  week: [],
  month: [],
};

const cardLayoutTransition = LinearTransition.springify().damping(18).stiffness(220);
const graphLayoutTransition = LinearTransition.springify().damping(20).stiffness(240);

function getGraphLabel(item: GraphDataPoint) {
  return 'day' in item ? item.day : item.week;
}

function AnimatedValueText({
  value,
  transitionKey,
  className,
}: {
  value: string;
  transitionKey: string;
  className: string;
}) {
  return (
    <View style={{ minHeight: 28, overflow: 'hidden', justifyContent: 'center' }}>
      <Animated.Text
        key={transitionKey}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(160)}
        className={className}
      >
        {value}
      </Animated.Text>
    </View>
  );
}

function GraphBar({
  item,
  maxDistance,
  index,
}: {
  item: GraphDataPoint;
  maxDistance: number;
  index: number;
}) {
  const barWidth = `${maxDistance > 0 ? (item.distance / maxDistance) * 100 : 0}%`;

  return (
    <Animated.View
      entering={FadeInRight.duration(220).delay(index * 36)}
      exiting={FadeOutLeft.duration(140)}
      layout={graphLayoutTransition}
      className="flex-row items-center mb-[6px]"
    >
      <Text className="text-xs text-slate-500 dark:text-slate-400" style={{ width: 50 }}>{getGraphLabel(item)}</Text>
      <View className="flex-1 rounded-full bg-[#e2e8f0] dark:bg-[#2d2d2d] mx-2" style={{ height: 8 }}>
        <Animated.View
          layout={graphLayoutTransition}
          className="rounded-full bg-[#3b82f6]"
          style={{
            height: 8,
            width: barWidth,
          }}
        />
      </View>
      <Text className="text-[11px] text-slate-500 dark:text-slate-400 text-right" style={{ width: 60 }}>{item.distance.toFixed(1)} km</Text>
    </Animated.View>
  );
}

export default function RideHistoryPage({ navigation }: Props) {
  const [period, setPeriod] = useState<GraphPeriod>('week');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);
  const [distanceStats, setDistanceStats] = useState<DistanceStatsByPeriod>(emptyDistanceStats);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        <Card style={{ width: '48%', padding: 10, borderRadius: 12 }}>
          <Animated.View layout={cardLayoutTransition}>
            <CardContent>
              <Text className="text-xs text-[#64748b] dark:text-slate-400">Total Rides</Text>
              <AnimatedValueText
                value={String(rideHistory.length)}
                transitionKey={`rides-${period}-${rideHistory.length}`}
                className="text-xl font-bold text-[#1e293b] dark:text-slate-100 mt-[6px]"
              />
            </CardContent>
          </Animated.View>
        </Card>
        <Card style={{ width: '48%', padding: 10, borderRadius: 12 }}>
          <Animated.View layout={cardLayoutTransition}>
            <CardContent>
              <Text className="text-xs text-[#64748b] dark:text-slate-400">Distance</Text>
              <AnimatedValueText
                value={`${totalDistance.toFixed(1)} km`}
                transitionKey={`distance-${period}-${totalDistance.toFixed(1)}`}
                className="text-xl font-bold text-[#1e293b] dark:text-slate-100 mt-[6px]"
              />
            </CardContent>
          </Animated.View>
        </Card>
        <Card style={{ width: '48%', padding: 10, borderRadius: 12 }}>
          <Animated.View layout={cardLayoutTransition}>
            <CardContent>
              <Text className="text-xs text-[#64748b] dark:text-slate-400">Total Time</Text>
              <AnimatedValueText
                value={formatTime(totalTime)}
                transitionKey={`time-${period}-${totalTime}`}
                className="text-xl font-bold text-[#1e293b] dark:text-slate-100 mt-[6px]"
              />
            </CardContent>
          </Animated.View>
        </Card>
        <Card style={{ width: '48%', padding: 10, borderRadius: 12 }}>
          <Animated.View layout={cardLayoutTransition}>
            <CardContent>
              <Text className="text-xs text-[#64748b] dark:text-slate-400">Checkpoints</Text>
              <AnimatedValueText
                value={String(totalCheckpoints)}
                transitionKey={`checkpoints-${period}-${totalCheckpoints}`}
                className="text-xl font-bold text-[#1e293b] dark:text-slate-100 mt-[6px]"
              />
            </CardContent>
          </Animated.View>
        </Card>
      </View>

      <Card>
        <CardHeader>
          <View className="flex-row justify-between items-center">
            <View>
              <CardTitle>Distance Over Time</CardTitle>
              <View style={{ minHeight: 20, overflow: 'hidden' }}>
                <Animated.View
                  key={`graph-total-${period}-${totalGraphDistance.toFixed(1)}`}
                  entering={FadeInDown.duration(220)}
                  exiting={FadeOutUp.duration(160)}
                >
                  <CardDescription>{`Total ${period === 'week' ? 'this week' : 'this month'}: ${totalGraphDistance.toFixed(1)} km`}</CardDescription>
                </Animated.View>
              </View>
            </View>
            <View className="flex-row gap-2">
              <Button
                style={[{ backgroundColor: '#e2e8f0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }, period === 'week' && { backgroundColor: '#2563eb' }]}
                onPress={() => handlePeriodChange('week')}
              >
                <Text style={[{ color: '#1e293b', fontSize: 13, fontWeight: '600' }, period === 'week' && { color: '#fff' }]}>Week</Text>
              </Button>
              <Button
                style={[{ backgroundColor: '#e2e8f0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }, period === 'month' && { backgroundColor: '#2563eb' }]}
                onPress={() => handlePeriodChange('month')}
              >
                <Text style={[{ color: '#1e293b', fontSize: 13, fontWeight: '600' }, period === 'month' && { color: '#fff' }]}>Month</Text>
              </Button>
            </View>
          </View>
        </CardHeader>
        <CardContent>
          <View className="mt-2 py-1">
            {graphData.map((item, index) => (
              <GraphBar key={`${period}-${item.id}`} item={item} maxDistance={maxDistance} index={index} />
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
