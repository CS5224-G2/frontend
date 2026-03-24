import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AntDesign, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/native/Common';
import { mockRoutes, Route } from '../types';

type Props = NativeStackScreenProps<any, 'Recommendation'>;

export default function RouteRecommendationPage({ navigation }: Props) {
  const recommendedRoutes = mockRoutes.slice(0, 3);

  const renderRoute = ({ item }: { item: Route }) => (
    <Pressable
      style={({ pressed }) => [styles.routeCard, pressed && styles.pressedCard]}
      onPress={() => navigation.navigate('RouteDetails', { routeId: item.id })}
    >
      <Card>
        <CardHeader>
          <CardTitle style={styles.routeName}>{item.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.description}>{item.description}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statText}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                Distance
              </Text>
              <Text style={styles.statText}>{item.distance} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statText}>
                <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                Estimated Time
              </Text>
              <Text style={styles.statText}>{item.estimatedTime} min</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statText}>
                <MaterialCommunityIcons name="arrow-up" size={16} color="#6b7280" />
                Elevation
              </Text>
              <Text style={styles.statText}>{item.elevation} m</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statText}>
                <MaterialCommunityIcons name="tree" size={16} color="#6b7280" />
                Shade
              </Text>
              <Text style={styles.statText}>{item.shade}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statText}>
                <MaterialCommunityIcons name="air-filter" size={16} color="#6b7280" />
                Air Quality
              </Text>
              <Text style={styles.statText}>{item.airQuality}%</Text>
            </View>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.rating}>
              <AntDesign name="star" size={15} color="#f59e0b" />
              {item.rating} ({item.reviewCount})
            </Text>
            <Text style={styles.typeBadge}>
              {item.cyclistType}
            </Text>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Recommendations</Text>
      </View>

      <Text style={styles.subtitle}>{recommendedRoutes.length} routes found</Text>

      <FlatList
        data={recommendedRoutes}
        keyExtractor={(item) => item.id}
        renderItem={renderRoute}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { marginBottom: 14, color: '#64748b' },
  routeCard: { borderRadius: 12 },
  pressedCard: { opacity: 0.8 },
  routeName: { fontSize: 18, fontWeight: '700' },
  description: { fontSize: 14, color: '#475569', marginBottom: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: '#64748b' },
  statValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  statText: { fontSize: 16, color: '#6b7280', marginLeft: 4, textAlign: 'center' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rating: { fontSize: 13, color: '#444' },
  typeBadge: { fontSize: 12, color: '#1e293b', fontWeight: '700', textTransform: 'capitalize' },
  separator: { height: 12 },
});
