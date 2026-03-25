import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../components/native/Common';
import { type RideHistory, type GraphDataPoint, type GraphPeriod } from '../../../../shared/types/index';
import { getRideHistory, getDistanceStats } from '../../services/rideService';

type Props = NativeStackScreenProps<any, 'RideHistory'>;

export default function RideHistoryPage({ navigation }: Props) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [history, stats, saved] = await Promise.all([
          getRideHistory(),
          getDistanceStats(period),
          AsyncStorage.getItem('favoriteRoutes'),
        ]);
        setRideHistory(history);
        setGraphData(stats);
        if (saved) setFavorites(JSON.parse(saved));
      } catch (error) {
        console.warn('Error loading ride data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [period]);

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

  const totalGraphDistance = graphData.reduce((sum, item) => sum + item.distance, 0);
  const totalTime = rideHistory.reduce((sum, ride) => sum + ride.totalTime, 0);
  const totalCheckpoints = rideHistory.reduce((sum, ride) => sum + ride.checkpoints, 0);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderGraphBar = (item: any) => {
    const maxDistance = Math.max(...graphData.map((d) => d.distance), 1);
    const barWidth = `${(item.distance / maxDistance) * 100}%`;

    return (
      <View key={item.id} className="flex-row items-center mb-[6px]">
        <Text className="text-xs text-slate-500" style={{ width: 50 }}>{period === 'week' ? item.day : item.week}</Text>
        <View className="flex-1 rounded-full bg-[#e2e8f0] mx-2" style={{ height: 8 }}>
          <View className="rounded-full bg-[#3b82f6]" style={{ height: 8, width: barWidth as any }} />
        </View>
        <Text className="text-[11px] text-slate-500 text-right" style={{ width: 60 }}>{item.distance.toFixed(1)} km</Text>
      </View>
    );
  };

  const renderRide = ({ item }: { item: RideHistory }) => {
    const isFav = favorites.includes(item.routeId);
    const displayName = item.routeName;

    return (
      <Pressable
        style={({ pressed }) => [
          { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
          pressed && { opacity: 0.8 },
        ]}
        onPress={() => navigation.navigate('HistoryDetails', { rideId: item.id })}
      >
        <View className="flex-row justify-between items-center mb-[6px]">
          <Text className="text-base font-bold text-[#1e293b] flex-1 mr-2">{displayName}</Text>
          <Pressable onPress={() => toggleFavorite(item.routeId, displayName)}>
            <MaterialCommunityIcons
              name={isFav ? 'star' : 'star-outline'}
              size={24}
              color={isFav ? '#f59e0b' : '#a1a1aa'}
            />
          </Pressable>
        </View>

        <Text className="text-xs text-[#6b7280] mb-2">{item.completionDate} • {item.completionTime}</Text>

        <View className="flex-row flex-wrap justify-between">
          <View className="flex-row items-center gap-1 my-[3px]" style={{ width: '48%' }}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
            <Text className="text-[13px] text-[#334155] ml-1">{item.distance} km</Text>
          </View>
          <View className="flex-row items-center gap-1 my-[3px]" style={{ width: '48%' }}>
            <MaterialCommunityIcons name="clock" size={14} color="#6b7280" />
            <Text className="text-[13px] text-[#334155] ml-1">{formatTime(item.totalTime)}</Text>
          </View>
          <View className="flex-row items-center gap-1 my-[3px]" style={{ width: '48%' }}>
            <MaterialCommunityIcons name="speedometer" size={14} color="#6b7280" />
            <Text className="text-[13px] text-[#334155] ml-1">{item.avgSpeed} km/h</Text>
          </View>
          <View className="flex-row items-center gap-1 my-[3px]" style={{ width: '48%' }}>
            <MaterialCommunityIcons name="map-legend" size={14} color="#6b7280" />
            <Text className="text-[13px] text-[#334155] ml-1">{item.checkpoints} checkpoints</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
      <View className="mb-[12px]">
        <Text className="text-[28px] font-bold text-[#1e293b]">Ride History</Text>
        <Text className="text-sm text-[#64748b] mt-1">Track progress & achievements</Text>
      </View>

      <View className="flex-row flex-wrap justify-between mb-[12px]">
        <Card style={{ width: '48%', padding: 10, borderRadius: 12 }}>
          <CardContent>
            <Text className="text-xs text-[#64748b]">Total Rides</Text>
            <Text className="text-xl font-bold text-[#1e293b] mt-[6px]">{rideHistory.length}</Text>
          </CardContent>
        </Card>
        <Card style={{ width: '48%', padding: 10, borderRadius: 12 }}>
          <CardContent>
            <Text className="text-xs text-[#64748b]">Distance</Text>
            <Text className="text-xl font-bold text-[#1e293b] mt-[6px]">{graphData.reduce((sum, item) => sum + item.distance, 0).toFixed(1)} km</Text>
          </CardContent>
        </Card>
        <Card style={{ width: '48%', padding: 10, borderRadius: 12 }}>
          <CardContent>
            <Text className="text-xs text-[#64748b]">Total Time</Text>
            <Text className="text-xl font-bold text-[#1e293b] mt-[6px]">{formatTime(totalTime)}</Text>
          </CardContent>
        </Card>
        <Card style={{ width: '48%', padding: 10, borderRadius: 12 }}>
          <CardContent>
            <Text className="text-xs text-[#64748b]">Checkpoints</Text>
            <Text className="text-xl font-bold text-[#1e293b] mt-[6px]">{totalCheckpoints}</Text>
          </CardContent>
        </Card>
      </View>

      <Card>
        <CardHeader>
          <View className="flex-row justify-between items-center">
            <View>
              <CardTitle>Distance Over Time</CardTitle>
              <CardDescription>{`Total ${period === 'week' ? 'this week' : 'this month'}: ${totalGraphDistance.toFixed(1)} km`}</CardDescription>
            </View>
            <View className="flex-row gap-2">
              <Button
                style={[{ backgroundColor: '#e2e8f0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }, period === 'week' && { backgroundColor: '#2563eb' }]}
                onPress={() => setPeriod('week')}
              >
                <Text style={[{ color: '#1e293b', fontSize: 13, fontWeight: '600' }, period === 'week' && { color: '#fff' }]}>Week</Text>
              </Button>
              <Button
                style={[{ backgroundColor: '#e2e8f0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }, period === 'month' && { backgroundColor: '#2563eb' }]}
                onPress={() => setPeriod('month')}
              >
                <Text style={[{ color: '#1e293b', fontSize: 13, fontWeight: '600' }, period === 'month' && { color: '#fff' }]}>Month</Text>
              </Button>
            </View>
          </View>
        </CardHeader>
        <CardContent>
          <View className="mt-2 py-1">
            {graphData.map((item) => renderGraphBar(item))}
          </View>
        </CardContent>
      </Card>

      <View className="my-[10px]">
        <Text className="text-xl font-bold text-[#1e293b]">Recent Rides</Text>
        <Text className="text-xs text-[#64748b]">Tap a ride for details</Text>
      </View>

      <FlatList
        data={rideHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderRide}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </ScrollView>
  );
}
