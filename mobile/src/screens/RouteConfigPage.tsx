import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { STORAGE_KEYS } from '../constants/routeStorage';
import type { CyclistType, UserRoutePreferences } from '../types/route';

const CYCLIST_OPTIONS: { type: CyclistType; label: string }[] = [
  { type: 'recreational', label: 'Recreational' },
  { type: 'commuter', label: 'Commuter' },
  { type: 'fitness', label: 'Fitness' },
  { type: 'general', label: 'General' },
];

const defaultPreferences: UserRoutePreferences = {
  cyclistType: 'general',
  preferredShade: 50,
  elevation: 50,
  distance: 10,
  airQuality: 50,
};

export default function RouteConfigPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [preferences, setPreferences] = useState<UserRoutePreferences>(defaultPreferences);
  const [startPoint, setStartPoint] = useState('Central Park South');
  const [endPoint, setEndPoint] = useState('Times Square');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prefsJson, start, end] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.userPreferences),
          AsyncStorage.getItem(STORAGE_KEYS.routeStartPoint),
          AsyncStorage.getItem(STORAGE_KEYS.routeEndPoint),
        ]);
        if (cancelled) return;
        if (prefsJson) {
          const parsed = JSON.parse(prefsJson) as UserRoutePreferences;
          setPreferences({ ...defaultPreferences, ...parsed });
        }
        if (start) setStartPoint(start);
        if (end) setEndPoint(end);
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.userPreferences, JSON.stringify(preferences)),
      AsyncStorage.setItem(STORAGE_KEYS.routeStartPoint, startPoint),
      AsyncStorage.setItem(STORAGE_KEYS.routeEndPoint, endPoint),
    ]);
    router.push('/route');
  }, [preferences, startPoint, endPoint, router]);

  if (!hydrated) {
    return (
      <View style={styles.loading} testID="route-config-loading">
        <ActivityIndicator size="large" color="#2563eb" />
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
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="route-config-back"
          >
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
          <Text style={styles.title} testID="route-config-title">
            Configure Custom Route
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Preferences</Text>

          <View style={styles.row2}>
            <View style={styles.field}>
              <Text style={styles.label}>Start Point</Text>
              <TextInput
                value={startPoint}
                onChangeText={setStartPoint}
                placeholder="Enter start location"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                testID="route-config-start"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>End Point</Text>
              <TextInput
                value={endPoint}
                onChangeText={setEndPoint}
                placeholder="Enter end location"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                testID="route-config-end"
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Cyclist Type</Text>
          <View style={styles.typeGrid} testID="route-config-cyclist-grid">
            {CYCLIST_OPTIONS.map(({ type, label }) => {
              const selected = preferences.cyclistType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setPreferences((p) => ({ ...p, cyclistType: type }))}
                  style={[styles.typeChip, selected && styles.typeChipSelected]}
                  testID={`route-config-cyclist-${type}`}
                >
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SliderRow
            label="Preferred Shade"
            value={preferences.preferredShade}
            suffix="%"
            minimumValue={0}
            maximumValue={100}
            step={10}
            onChange={(preferredShade) => setPreferences((p) => ({ ...p, preferredShade }))}
            testID="route-config-shade-slider"
          />
          <SliderRow
            label="Elevation Challenge"
            value={preferences.elevation}
            suffix="%"
            minimumValue={0}
            maximumValue={100}
            step={10}
            onChange={(elevation) => setPreferences((p) => ({ ...p, elevation }))}
            testID="route-config-elevation-slider"
          />
          <SliderRow
            label="Preferred Distance"
            value={preferences.distance}
            suffix=" km"
            minimumValue={5}
            maximumValue={50}
            step={5}
            onChange={(distance) => setPreferences((p) => ({ ...p, distance }))}
            testID="route-config-distance-slider"
          />
          <SliderRow
            label="Minimum Air Quality"
            value={preferences.airQuality}
            suffix="%"
            minimumValue={0}
            maximumValue={100}
            step={10}
            onChange={(airQuality) => setPreferences((p) => ({ ...p, airQuality }))}
            testID="route-config-air-slider"
          />

          <Pressable
            style={styles.primaryBtn}
            onPress={handleConfirm}
            testID="route-config-find-routes"
          >
            <Text style={styles.primaryBtnText}>Find Routes</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SliderRow(props: {
  label: string;
  value: number;
  suffix: string;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onChange: (v: number) => void;
  testID?: string;
}) {
  return (
    <View style={styles.sliderBlock}>
      <Text style={styles.sliderLabel}>
        {props.label}: {props.value}
        {props.suffix}
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={props.minimumValue}
        maximumValue={props.maximumValue}
        step={props.step}
        value={props.value}
        onValueChange={props.onChange}
        minimumTrackTintColor="#2563eb"
        maximumTrackTintColor="#e2e8f0"
        thumbTintColor="#1d4ed8"
        testID={props.testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  scroll: { padding: 20, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backGlyph: { fontSize: 28, color: '#0f172a', marginTop: -4 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#0f172a' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  row2: { gap: 12, marginBottom: 16 },
  field: { marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#dbe3f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fbff',
  },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  typeChipSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeChipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  typeChipTextSelected: { color: '#1d4ed8' },
  sliderBlock: { marginBottom: 18 },
  sliderLabel: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 6 },
  slider: { width: '100%', height: 40 },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
