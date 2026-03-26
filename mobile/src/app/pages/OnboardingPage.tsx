import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bike, Trees, Mountain, Route, Wind, Info } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { AuthContext } from '../AuthContext';

type Props = NativeStackScreenProps<any, any>;

interface UserPreferences {
  cyclistType: 'recreational' | 'commuter' | 'fitness' | 'general';
  preferredShade: number;
  elevation: number;
  distance: number;
  airQuality: number;
}

export default function OnboardingPage({ navigation }: Props) {
  const { login } = useContext(AuthContext);
  const [preferences, setPreferences] = useState<UserPreferences>({
    cyclistType: 'general',
    preferredShade: 50,
    elevation: 50,
    distance: 10,
    airQuality: 50,
  });

  const cyclistTypes = [
    { type: 'recreational' as const, label: 'Recreational', icon: Trees, description: 'Leisurely rides for enjoyment' },
    { type: 'commuter' as const, label: 'Commuter', icon: Route, description: 'Fast routes for daily travel' },
    { type: 'fitness' as const, label: 'Fitness', icon: Mountain, description: 'Challenging routes for training' },
    { type: 'general' as const, label: 'General', icon: Bike, description: 'Balanced all-purpose cycling' },
  ];

  const handleConfirm = () => {
    console.log('User preferences:', preferences);
    void login({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: {
        id: 'onboarding-user',
        firstName: 'Cycle',
        lastName: 'Rider',
        fullName: 'Cycle Rider',
        email: 'demo@cyclelink.app',
        onboardingComplete: true,
        role: 'user',
      },
    });
  };

  const CyclistTypeButton = ({ type, label, icon: Icon, description, isSelected }: any) => (
    <TouchableOpacity
      className={`flex-1 p-cy-lg rounded-cy-md border-2 items-center ${isSelected ? 'border-[#3b82f6] bg-[#eff6ff] dark:bg-[#1e293b]' : 'border-[#d1d5db] bg-white dark:bg-[#111111]'}`}
      style={{ minWidth: '45%' }}
      onPress={() => setPreferences({ ...preferences, cyclistType: type })}
    >
      <Icon size={24} color={isSelected ? '#3b82f6' : '#6b7280'} />
      <Text className={`text-base font-semibold mt-2 mb-1 ${isSelected ? 'text-[#3b82f6] dark:text-blue-400' : 'text-[#1e293b] dark:text-slate-100'}`}>{label}</Text>
      <Text className="text-sm text-[#6b7280] dark:text-slate-400 text-center">{description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-[#DBEAFE] dark:bg-[#1e293b]">
      <View className="flex-1 p-cy-xl pt-[60px]">
        {/* Info Button */}
        <TouchableOpacity
          className="absolute top-10 right-6 flex-row items-center bg-white dark:bg-[#111111] px-cy-md py-cy-sm rounded-cy-md border border-[#d1d5db] dark:border-[#2d2d2d]"
          onPress={() => navigation.navigate('UserJourneyPage')}
        >
          <Info size={16} color="#6b7280" />
          <Text className="ml-2 text-sm text-[#6b7280] dark:text-slate-400">View Journey</Text>
        </TouchableOpacity>

        <View className="bg-white dark:bg-[#111111] rounded-cy-lg" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
          <View className="items-center p-cy-xl">
            <Text className="text-[28px] font-bold text-[#1e293b] dark:text-slate-100 text-center">Welcome to CycleLink</Text>
            <Text className="text-base text-[#64748b] dark:text-slate-400 mt-2 text-center">Let's personalize your cycling experience</Text>
          </View>

          <View className="p-cy-xl">
            {/* Cyclist Type Selection */}
            <View className="mb-[24px]">
              <Text className="text-lg font-semibold text-[#1e293b] dark:text-slate-100 mb-cy-lg">What type of cyclist are you?</Text>
              <View className="flex-row flex-wrap gap-cy-md">
                {cyclistTypes.map(({ type, label, icon, description }) => (
                  <CyclistTypeButton
                    key={type}
                    type={type}
                    label={label}
                    icon={icon}
                    description={description}
                    isSelected={preferences.cyclistType === type}
                  />
                ))}
              </View>
            </View>

            {/* Preferred Shade */}
            <View className="mb-[24px]">
              <View className="flex-row items-center mb-cy-md">
                <Trees size={20} color="#6b7280" />
                <Text className="text-base font-semibold text-[#1e293b] dark:text-slate-100 ml-2">Preferred Shade: {preferences.preferredShade}%</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={100}
                step={10}
                value={preferences.preferredShade}
                onValueChange={(value) => setPreferences({ ...preferences, preferredShade: value })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
              />
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-[#6b7280] dark:text-slate-400">Full Sun</Text>
                <Text className="text-xs text-[#6b7280] dark:text-slate-400">Full Shade</Text>
              </View>
            </View>

            {/* Elevation Preference */}
            <View className="mb-[24px]">
              <View className="flex-row items-center mb-cy-md">
                <Mountain size={20} color="#6b7280" />
                <Text className="text-base font-semibold text-[#1e293b] dark:text-slate-100 ml-2">Elevation Challenge: {preferences.elevation}%</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={100}
                step={10}
                value={preferences.elevation}
                onValueChange={(value) => setPreferences({ ...preferences, elevation: value })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
              />
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-[#6b7280] dark:text-slate-400">Flat</Text>
                <Text className="text-xs text-[#6b7280] dark:text-slate-400">Hilly</Text>
              </View>
            </View>

            {/* Distance */}
            <View className="mb-[24px]">
              <View className="flex-row items-center mb-cy-md">
                <Route size={20} color="#6b7280" />
                <Text className="text-base font-semibold text-[#1e293b] dark:text-slate-100 ml-2">Preferred Distance: {preferences.distance} km</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={5}
                maximumValue={50}
                step={5}
                value={preferences.distance}
                onValueChange={(value) => setPreferences({ ...preferences, distance: value })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
              />
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-[#6b7280] dark:text-slate-400">5 km</Text>
                <Text className="text-xs text-[#6b7280] dark:text-slate-400">50 km</Text>
              </View>
            </View>

            {/* Air Quality */}
            <View className="mb-[24px]">
              <View className="flex-row items-center mb-cy-md">
                <Wind size={20} color="#6b7280" />
                <Text className="text-base font-semibold text-[#1e293b] dark:text-slate-100 ml-2">Minimum Air Quality: {preferences.airQuality}%</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={100}
                step={10}
                value={preferences.airQuality}
                onValueChange={(value) => setPreferences({ ...preferences, airQuality: value })}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
              />
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-[#6b7280] dark:text-slate-400">Any</Text>
                <Text className="text-xs text-[#6b7280] dark:text-slate-400">Pristine</Text>
              </View>
            </View>

            <TouchableOpacity className="bg-[#3b82f6] dark:bg-blue-500 py-cy-lg px-cy-xl rounded-cy-md items-center mt-[24px]" onPress={handleConfirm}>
              <Text className="text-white text-lg font-semibold">Confirm & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
