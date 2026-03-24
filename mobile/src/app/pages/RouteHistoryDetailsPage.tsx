import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../components/native/Common';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { mockRoutes, mockRideHistory } from '../types';

type Props = NativeStackScreenProps<any, 'HistoryDetails'>;

export default function RouteHistoryDetailsPage({ navigation, route }: Props) {
  const { rideId } = route.params as { rideId: string };
  const ride = mockRideHistory.find((item) => item.id === rideId);
  const routeInfo = mockRoutes.find((r) => r.id === ride?.routeId);

  if (!ride || !routeInfo) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Ride not found</Text>
        <Text style={styles.subtitle}>Please select a valid ride from history.</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{routeInfo.name}</Text>
        <Text style={styles.headerSubtitle}>{routeInfo.description}</Text>
      </View>

      <Card style={styles.statusCard}>
        <CardHeader>
          <CardTitle>Ride Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.statusText}>{ride.completionDate} • {ride.completionTime}</Text>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Details</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.timeRow}>
            <View style={styles.timeCard}>
              <Text style={styles.timeLabel}>Start</Text>
              <Text style={styles.timeValue}>{ride.startTime ?? 'N/A'}</Text>
            </View>
            <View style={styles.timeCard}>
              <Text style={styles.timeLabel}>End</Text>
              <Text style={styles.timeValue}>{ride.endTime ?? 'N/A'}</Text>
            </View>
            <View style={styles.timeCard}>
              <Text style={styles.timeLabel}>Duration</Text>
              <Text style={styles.timeValue}>{ride.totalTime} min</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ride Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#3b82f6" />
              <Text style={styles.statValue}>{ride.distance} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="mountain" size={16} color="#f97316" />
              <Text style={styles.statValue}>{routeInfo.elevation} m</Text>
              <Text style={styles.statLabel}>Elevation</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="speedometer" size={16} color="#10b981" />
              <Text style={styles.statValue}>{ride.avgSpeed} km/h</Text>
              <Text style={styles.statLabel}>Avg Speed</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="map-legend" size={16} color="#8b5cf6" />
              <Text style={styles.statValue}>{ride.checkpoints}</Text>
              <Text style={styles.statLabel}>Checkpoints</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating & Review</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name="star"
                size={20}
                color={star <= (ride.userRating ?? 0) ? '#f59e0b' : '#d1d5db'}
              />
            ))}
            <Text style={styles.ratingValue}>{ride.userRating ?? 0}/5</Text>
          </View>
          {ride.userReview ? (
            <Text style={styles.reviewText}>{ride.userReview}</Text>
          ) : (
            <Text style={styles.reviewText}>No review provided for this ride.</Text>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Route Info</CardTitle>
          <CardDescription>{routeInfo.cyclistType} • {routeInfo.estimatedTime} min estimate</CardDescription>
        </CardHeader>
        <CardContent>
          <View style={styles.infoTags}>
            <View style={styles.tag}><Text style={styles.tagText}>Shade {routeInfo.shade}%</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Air {routeInfo.airQuality}/100</Text></View>
          </View>
          <Text style={styles.infoLabel}>Points of Interest</Text>
          {routeInfo.checkpoints.map((checkpoint) => (
            <View key={checkpoint.id} style={styles.checkpointItem}>
              <MaterialCommunityIcons name="map-marker-radius" size={16} color="#2563eb" />
              <Text style={styles.checkpointText}>{checkpoint.name} — {checkpoint.description}</Text>
            </View>
          ))}
        </CardContent>
      </Card>

      <Button onPress={() => navigation.navigate('RouteDetails', { routeId: routeInfo.id })} style={styles.primaryButton}>
        <MaterialCommunityIcons name="play" size={18} color="#fff" />
        <Text style={styles.primaryButtonText}>Ride This Route Again</Text>
      </Button>

      <Pressable onPress={() => navigation.goBack()} style={styles.linkButton}>
        <Text style={styles.linkText}>Back to History</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  statusCard: { marginBottom: 12, backgroundColor: '#e0f2fe', borderColor: '#bae6fd' },
  statusText: { fontSize: 14, color: '#0369a1' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  timeCard: { flex: 1, backgroundColor: '#f0f9ff', borderRadius: 10, padding: 10 },
  timeLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  timeValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  statItem: { width: '48%', backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 6, color: '#1e293b' },
  statLabel: { fontSize: 12, color: '#64748b' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingValue: { marginLeft: 8, color: '#1f2937', fontWeight: '700' },
  reviewText: { fontSize: 14, color: '#334155' },
  infoTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: { backgroundColor: '#e0e7ff', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  tagText: { color: '#1e3a8a', fontSize: 12, fontWeight: '600' },
  infoLabel: { marginTop: 8, marginBottom: 4, color: '#334155', fontWeight: '700' },
  checkpointItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  checkpointText: { color: '#475569', fontSize: 13 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, marginTop: 12, gap: 8 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  linkButton: { marginTop: 8, alignItems: 'center' },
  linkText: { color: '#2563eb', fontWeight: '700' },
});
