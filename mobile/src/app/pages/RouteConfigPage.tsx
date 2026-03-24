import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/native/Common';
import { UserPreferences, CyclistType } from '../types';

type Props = NativeStackScreenProps<any, 'RouteConfig'>;

const cyclistTypes: { type: CyclistType; label: string }[] = [
  { type: 'recreational', label: 'Recreational' },
  { type: 'commuter', label: 'Commuter' },
  { type: 'fitness', label: 'Fitness' },
  { type: 'general', label: 'General' },
];

export default function RouteConfigPage({ navigation }: Props) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    cyclistType: 'general',
    preferredShade: 50,
    elevation: 50,
    distance: 10,
    airQuality: 50,
  });
  const [startPoint, setStartPoint] = useState('Central Park South');
  const [endPoint, setEndPoint] = useState('Times Square');

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem('userPreferences');
        const savedStart = await AsyncStorage.getItem('routeStartPoint');
        const savedEnd = await AsyncStorage.getItem('routeEndPoint');

        if (saved) setPreferences(JSON.parse(saved));
        if (savedStart) setStartPoint(savedStart);
        if (savedEnd) setEndPoint(savedEnd);
      } catch (error) {
        console.warn('Error loading route config', error);
      }
    };
    load();
  }, []);

  const handleConfirm = async () => {
    try {
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
      await AsyncStorage.setItem('routeStartPoint', startPoint);
      await AsyncStorage.setItem('routeEndPoint', endPoint);
      navigation.navigate('Recommendation');
    } catch (error) {
      console.warn('Error saving route config', error);
      Alert.alert('Error', 'Unable to save route configuration.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card>
        <CardHeader>
          <CardTitle>Configure Custom Route</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Start Point</Text>
            <TextInput
              style={styles.input}
              value={startPoint}
              onChangeText={setStartPoint}
              placeholder="Enter start location"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>End Point</Text>
            <TextInput
              style={styles.input}
              value={endPoint}
              onChangeText={setEndPoint}
              placeholder="Enter end location"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cyclist Type</Text>
            <View style={styles.chipRow}>
              {cyclistTypes.map((option) => (
                <Pressable
                  key={option.type}
                  onPress={() => setPreferences({ ...preferences, cyclistType: option.type })}
                  style={[
                    styles.chip,
                    preferences.cyclistType === option.type && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      preferences.cyclistType === option.type && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Preferred Shade: {preferences.preferredShade}%</Text>
            <Slider
              style={styles.slider}
              value={preferences.preferredShade}
              onValueChange={(value) => setPreferences({ ...preferences, preferredShade: value })}
              minimumValue={0}
              maximumValue={100}
              step={10}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#d1d5db"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Elevation Challenge: {preferences.elevation}%</Text>
            <Slider
              style={styles.slider}
              value={preferences.elevation}
              onValueChange={(value) => setPreferences({ ...preferences, elevation: value })}
              minimumValue={0}
              maximumValue={100}
              step={10}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#d1d5db"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Preferred Distance: {preferences.distance} km</Text>
            <Slider
              style={styles.slider}
              value={preferences.distance}
              onValueChange={(value) => setPreferences({ ...preferences, distance: value })}
              minimumValue={5}
              maximumValue={50}
              step={5}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#d1d5db"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Minimum Air Quality: {preferences.airQuality}%</Text>
            <Slider
              style={styles.slider}
              value={preferences.airQuality}
              onValueChange={(value) => setPreferences({ ...preferences, airQuality: value })}
              minimumValue={0}
              maximumValue={100}
              step={10}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#d1d5db"
            />
          </View>

          <Button onPress={handleConfirm}>Find Routes</Button>
        </CardContent>
      </Card>

      <Pressable onPress={() => navigation.goBack()} style={styles.linkButton}>
        <Text style={styles.linkText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 36 },
  fieldGroup: { marginBottom: 16 },
  label: { marginBottom: 8, fontSize: 14, color: '#475569', fontWeight: '600' },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#334155' },
  chipTextActive: { color: '#fff' },
  slider: { width: '100%', height: 40 },
  linkButton: { marginTop: 14, alignItems: 'center' },
  linkText: { color: '#2563eb', fontWeight: '700' },
})
