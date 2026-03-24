import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { mockRoutes } from '../src/types/route';

/**
 * Route recommendations after configuring preferences (wireframe: route-recommendation).
 * Tap a route to confirm, then start live Mapbox navigation.
 */
export default function RouteScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Text style={styles.heading} testID="route-list-heading">
        Recommended routes
      </Text>
      <Text style={styles.sub}>Based on your preferences — tap to confirm</Text>
      <FlatList
        data={mockRoutes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/route-confirmed/${item.id}`)}
            testID={`route-list-item-${item.id}`}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {item.distance} km · ~{item.estimatedTime} min · {item.checkpoints.length} checkpoints
            </Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sub: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  cardMeta: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#475569', lineHeight: 20 },
});
