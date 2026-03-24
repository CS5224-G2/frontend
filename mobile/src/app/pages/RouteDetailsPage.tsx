import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getRouteById } from '../types';

export default function RouteDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const routeNav = useRoute<any>();
  const routeId = routeNav.params?.routeId as string | undefined;
  const route = getRouteById(routeId);

  if (!route) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missingText}>Route not found</Text>
        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{route.name}</Text>
      <Text style={styles.sub}>{route.description}</Text>
      <Text style={styles.meta}>
        {route.distance} km · ~{route.estimatedTime} min · {route.checkpoints.length} checkpoints
      </Text>
      <Text style={styles.section}>Checkpoints</Text>
      {route.checkpoints.map((cp) => (
        <Text key={cp.id} style={styles.cp}>
          • {cp.name}: {cp.description}
        </Text>
      ))}
      <Pressable
        style={styles.primary}
        onPress={() => navigation.navigate('RouteConfirmed', { routeId: route.id })}
        testID="route-details-confirm"
      >
        <Text style={styles.primaryText}>Confirm route</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  missingText: { fontSize: 16, color: '#64748b', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  sub: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 12 },
  meta: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  section: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  cp: { fontSize: 14, color: '#334155', marginBottom: 6 },
  primary: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  btn: { backgroundColor: '#e2e8f0', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { fontWeight: '700', color: '#0f172a' },
});
