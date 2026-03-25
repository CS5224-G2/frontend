import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert } from 'react-native';
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
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
      <Card>
        <CardHeader>
          <CardTitle>Configure Custom Route</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="mb-cy-lg">
            <Text className="mb-2 text-sm text-slate-500 font-semibold">Start Point</Text>
            <TextInput
              className="border border-slate-300 rounded-[10px] px-cy-md bg-white"
              style={{ height: 44 }}
              value={startPoint}
              onChangeText={setStartPoint}
              placeholder="Enter start location"
              autoCapitalize="words"
            />
          </View>

          <View className="mb-cy-lg">
            <Text className="mb-2 text-sm text-slate-500 font-semibold">End Point</Text>
            <TextInput
              className="border border-slate-300 rounded-[10px] px-cy-md bg-white"
              style={{ height: 44 }}
              value={endPoint}
              onChangeText={setEndPoint}
              placeholder="Enter end location"
              autoCapitalize="words"
            />
          </View>

          <View className="mb-cy-lg">
            <Text className="text-base font-bold text-[#1e293b] mb-2">Cyclist Type</Text>
            <View className="flex-row flex-wrap gap-cy-sm">
              {cyclistTypes.map((option) => (
                <Pressable
                  key={option.type}
                  onPress={() => setPreferences({ ...preferences, cyclistType: option.type })}
                  className={`border rounded-[10px] py-2 px-cy-md mr-2 mb-2 ${
                    preferences.cyclistType === option.type
                      ? 'bg-[#2563eb] border-[#2563eb]'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  <Text
                    className={`text-[13px] ${
                      preferences.cyclistType === option.type ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mb-cy-lg">
            <Text className="mb-2 text-sm text-slate-500 font-semibold">Preferred Shade: {preferences.preferredShade}%</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              value={preferences.preferredShade}
              onValueChange={(value) => setPreferences({ ...preferences, preferredShade: value })}
              minimumValue={0}
              maximumValue={100}
              step={10}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#d1d5db"
            />
          </View>

          <View className="mb-cy-lg">
            <Text className="mb-2 text-sm text-slate-500 font-semibold">Elevation Challenge: {preferences.elevation}%</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              value={preferences.elevation}
              onValueChange={(value) => setPreferences({ ...preferences, elevation: value })}
              minimumValue={0}
              maximumValue={100}
              step={10}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#d1d5db"
            />
          </View>

          <View className="mb-cy-lg">
            <Text className="mb-2 text-sm text-slate-500 font-semibold">Preferred Distance: {preferences.distance} km</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              value={preferences.distance}
              onValueChange={(value) => setPreferences({ ...preferences, distance: value })}
              minimumValue={5}
              maximumValue={50}
              step={5}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#d1d5db"
            />
          </View>

          <View className="mb-cy-lg">
            <Text className="mb-2 text-sm text-slate-500 font-semibold">Minimum Air Quality: {preferences.airQuality}%</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
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

      <Pressable onPress={() => navigation.goBack()} className="mt-[14px] items-center">
        <Text className="text-[#2563eb] font-bold">Back</Text>
      </Pressable>
    </ScrollView>
  );
}
