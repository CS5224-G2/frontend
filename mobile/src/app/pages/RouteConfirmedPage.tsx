import { useCallback } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { openRouteInMaps } from '@/services/maps';
import { getRouteById } from '../types';

export default function RouteConfirmedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { params } = useRoute<any>();
  const routeId = params?.routeId as string | undefined;
  const route = getRouteById(routeId);

  const goHome = useCallback(() => {
    navigation.navigate('HomePage');
  }, [navigation]);

  const openExternalMaps = useCallback(async () => {
    if (!route) return;
    const origin = `${route.startPoint.lat},${route.startPoint.lng}`;
    const destination = `${route.endPoint.lat},${route.endPoint.lng}`;
    const waypoints = route.checkpoints.map((c) => `${c.lat},${c.lng}`);
    try {
      await openRouteInMaps({
        origin,
        destination,
        waypoints,
        preferGoogle: Platform.OS === 'android',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not open maps.';
      Alert.alert('Maps', message);
    }
  }, [route]);

  if (!route) {
    return (
      <View style={styles.centered} testID="route-confirmed-missing">
        <Text style={styles.missingText}>Route not found</Text>
        <Pressable style={styles.secondaryBtn} onPress={goHome} testID="route-confirmed-back-home">
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.checkCircle} testID="route-confirmed-icon">
            <Text style={styles.checkGlyph}>✓</Text>
          </View>
          <Text style={styles.heroTitle} testID="route-confirmed-title">
            Route Confirmed!
          </Text>
          <Text style={styles.heroSubtitle}>Your cycling adventure awaits</Text>
        </View>

        <View style={styles.summaryCard} testID="route-confirmed-summary">
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.metaLine}>
            <Text style={styles.metaKey}>Distance: </Text>
            {route.distance} km
          </Text>
          <Text style={styles.metaLine}>
            <Text style={styles.metaKey}>Estimated Time: </Text>
            {route.estimatedTime} minutes
          </Text>
          <Text style={styles.metaLine}>
            <Text style={styles.metaKey}>Checkpoints: </Text>
            {route.checkpoints.length}
          </Text>
        </View>

        <Pressable
          style={styles.outlineBtn}
          onPress={openExternalMaps}
          testID="route-confirmed-external-maps"
        >
          <Text style={styles.outlineBtnText}>View Route on Google / Apple Maps</Text>
        </Pressable>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('LiveMap', { routeId: route.id })}
          testID="route-confirmed-start-cycling"
        >
          <Text style={styles.primaryBtnText}>Start Cycling Now</Text>
        </Pressable>

        <Text style={styles.footerNote}>Have a safe and enjoyable ride!</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdf4' },
  scroll: { padding: 24, paddingBottom: 40 },
  centered: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missingText: { fontSize: 16, color: '#475569', marginBottom: 16 },
  hero: { alignItems: 'center', marginBottom: 24 },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkGlyph: { fontSize: 40, color: '#16a34a', fontWeight: '700' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  heroSubtitle: { fontSize: 15, color: '#64748b' },
  summaryCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  routeName: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  metaLine: { fontSize: 14, color: '#334155', marginBottom: 4 },
  metaKey: { fontWeight: '700', color: '#1e293b' },
  outlineBtn: {
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  outlineBtnText: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryBtnText: { fontWeight: '700', color: '#0f172a' },
  footerNote: { textAlign: 'center', fontSize: 13, color: '#64748b' },
});
