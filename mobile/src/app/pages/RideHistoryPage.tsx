import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../components/native/Common';
import { RideHistory, mockRideHistory, weeklyData, monthlyData, mockRoutes } from '../types';

type Props = NativeStackScreenProps<any, 'RideHistory'>;

export default function RideHistoryPage({ navigation }: Props) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const saved = await AsyncStorage.getItem('favoriteRoutes');
        if (saved) {
          setFavorites(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Error loading favorites', error);
      }
    };
    loadFavorites();
  }, []);

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

  const graphData = period === 'week' ? weeklyData : monthlyData;
  const totalGraphDistance = graphData.reduce((sum, item) => sum + item.distance, 0);
  const totalTime = mockRideHistory.reduce((sum, ride) => sum + ride.totalTime, 0);
  const totalCheckpoints = mockRideHistory.reduce((sum, ride) => sum + ride.checkpoints, 0);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderGraphBar = (item: any) => {
    const maxDistance = Math.max(...graphData.map((d) => d.distance), 1);
    const width = `${(item.distance / maxDistance) * 100}%`;

    return (
      <View key={item.id} style={styles.graphBarRow}>
        <Text style={styles.graphBarLabel}>{period === 'week' ? item.day : item.week}</Text>
        <View style={styles.graphBarTrack}>
          <View style={[styles.graphBarFill, { width }]} />
        </View>
        <Text style={styles.graphBarValue}>{item.distance.toFixed(1)} km</Text>
      </View>
    );
  };

  const renderRide = ({ item }: { item: RideHistory }) => {
    const isFav = favorites.includes(item.routeId);
    const route = mockRoutes.find((routeItem) => routeItem.id === item.routeId);
    const displayName = route?.name ?? item.routeName;

    return (
      <Pressable
        style={({ pressed }) => [styles.rideCard, pressed && styles.rideCardPressed]}
        onPress={() => navigation.navigate('HistoryDetails', { rideId: item.id })}
      >
        <View style={styles.rideCardHeader}>
          <Text style={styles.rideName}>{displayName}</Text>
          <Pressable onPress={() => toggleFavorite(item.routeId, displayName)}>
            <MaterialCommunityIcons
              name={isFav ? 'star' : 'star-outline'}
              size={24}
              color={isFav ? '#f59e0b' : '#a1a1aa'}
            />
          </Pressable>
        </View>

        <Text style={styles.rideMeta}>{item.completionDate} • {item.completionTime}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#6b7280" />
            <Text style={styles.statText}>{item.distance} km</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock" size={14} color="#6b7280" />
            <Text style={styles.statText}>{formatTime(item.totalTime)}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="speedometer" size={14} color="#6b7280" />
            <Text style={styles.statText}>{item.avgSpeed} km/h</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="map-legend" size={14} color="#6b7280" />
            <Text style={styles.statText}>{item.checkpoints} checkpoints</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubTitle}>Track progress & achievements</Text>
      </View>

      <View style={styles.summaryGrid}>
        <Card style={styles.cardSmall}>
          <CardContent>
            <Text style={styles.summaryLabel}>Total Rides</Text>
            <Text style={styles.summaryValue}>{mockRideHistory.length}</Text>
          </CardContent>
        </Card>
        <Card style={styles.cardSmall}>
          <CardContent>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>{graphData.reduce((sum, item) => sum + item.distance, 0).toFixed(1)} km</Text>
          </CardContent>
        </Card>
        <Card style={styles.cardSmall}>
          <CardContent>
            <Text style={styles.summaryLabel}>Total Time</Text>
            <Text style={styles.summaryValue}>{formatTime(totalTime)}</Text>
          </CardContent>
        </Card>
        <Card style={styles.cardSmall}>
          <CardContent>
            <Text style={styles.summaryLabel}>Checkpoints</Text>
            <Text style={styles.summaryValue}>{totalCheckpoints}</Text>
          </CardContent>
        </Card>
      </View>

      <Card>
        <CardHeader>
          <View style={styles.chartHeader}>
            <View>
              <CardTitle>Distance Over Time</CardTitle>
              <CardDescription>{`Total ${period === 'week' ? 'this week' : 'this month'}: ${totalGraphDistance.toFixed(1)} km`}</CardDescription>
            </View>
            <View style={styles.rangeButtons}>
              <Button
                style={[styles.rangeButton, period === 'week' && styles.rangeButtonActive]}
                onPress={() => setPeriod('week')}
              >
                <Text style={[styles.rangeButtonText, period === 'week' && styles.rangeButtonTextActive]}>Week</Text>
              </Button>
              <Button
                style={[styles.rangeButton, period === 'month' && styles.rangeButtonActive]}
                onPress={() => setPeriod('month')}
              >
                <Text style={[styles.rangeButtonText, period === 'month' && styles.rangeButtonTextActive]}>Month</Text>
              </Button>
            </View>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.graphContainer}>
            {graphData.map((item) => renderGraphBar(item))}
          </View>
        </CardContent>
      </Card>

      <View style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>Recent Rides</Text>
        <Text style={styles.sectionSubTitle}>Tap a ride for details</Text>
      </View>

      <FlatList
        data={mockRideHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderRide}
        scrollEnabled={false}
        contentContainerStyle={styles.ridesList}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 36 },
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  headerSubTitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  cardSmall: { width: '48%', padding: 10, borderRadius: 12 },
  summaryLabel: { fontSize: 12, color: '#64748b' },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 6 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rangeButtons: { flexDirection: 'row', gap: 8 },
  rangeButton: { backgroundColor: '#e2e8f0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  rangeButtonActive: { backgroundColor: '#2563eb' },
  rangeButtonText: { color: '#1e293b', fontSize: 13, fontWeight: '600' },
  rangeButtonTextActive: { color: '#fff' },
  graphContainer: { marginTop: 8, paddingVertical: 4 },
  graphBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  graphBarLabel: { width: 50, fontSize: 12, color: '#475569' },
  graphBarTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: '#e2e8f0', marginHorizontal: 8 },
  graphBarFill: { height: 8, borderRadius: 999, backgroundColor: '#3b82f6' },
  graphBarValue: { width: 60, fontSize: 11, color: '#475569', textAlign: 'right' },
  sectionHeader: { marginVertical: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  sectionSubTitle: { fontSize: 12, color: '#64748b' },
  ridesList: { paddingBottom: 80 },
  rideCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  rideCardPressed: { opacity: 0.8 },
  rideCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rideName: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1, marginRight: 8 },
  rideMeta: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statItem: { flexDirection: 'row', alignItems: 'center', width: '48%', marginVertical: 3, gap: 4 },
  statText: { fontSize: 13, color: '#334155', marginLeft: 4 },
});
