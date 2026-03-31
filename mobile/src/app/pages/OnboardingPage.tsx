import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as Location from 'expo-location';

import { AuthContext } from '../AuthContext';
import { updateUserProfile } from '../../services/userService';
import type { AuthResult, CyclingPreference, UserProfile } from '../../../../shared/types/index';

const PREFERENCE_OPTIONS: CyclingPreference[] = ['Leisure', 'Commuter', 'Performance'];

export default function OnboardingPage() {
  const route = useRoute<any>();
  const { login } = useContext(AuthContext);
  const { colorScheme } = useColorScheme();

  const authResult: AuthResult | undefined = route.params?.authResult;

  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [cyclingPreference, setCyclingPreference] = useState<CyclingPreference | null>(null);
  const [weeklyGoalKm, setWeeklyGoalKm] = useState('80');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location access denied', 'Enter your neighbourhood manually.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      const area = geocode?.district ?? geocode?.subregion ?? geocode?.city ?? '';
      setLocation(area ? `${area}, Singapore` : 'Singapore');
    } catch {
      Alert.alert('Location unavailable', 'Enter your neighbourhood manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!authResult) {
      return;
    }
    if (!location.trim()) {
      Alert.alert('Missing location', 'Please enter your neighbourhood or tap Use Current Location.');
      return;
    }
    if (!cyclingPreference) {
      Alert.alert('Missing preference', 'Please select a cycling preference before continuing.');
      return;
    }
    const goal = parseInt(weeklyGoalKm, 10);
    if (!goal || goal <= 0) {
      Alert.alert('Invalid goal', 'Please enter a weekly goal greater than 0 km.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile: UserProfile = {
        userId: authResult.user.id,
        fullName: authResult.user.fullName,
        email: authResult.user.email,
        location: location.trim(),
        memberSince: '',
        cyclingPreference,
        weeklyGoalKm: goal,
        bio: bio.trim(),
        avatarUrl: null,
        avatarColor: '#3b82f6',
        stats: { totalRides: 0, totalDistanceKm: 0, favoriteTrails: 0 },
      };
      await updateUserProfile(profile, authResult.accessToken);
      await login(authResult);
    } catch (error) {
      Alert.alert(
        'Setup failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'border border-border-light dark:border-[#2d2d2d] rounded-cy-xl px-cy-lg py-[15px] text-[15px] text-slate-900 dark:text-slate-100 bg-bg-light dark:bg-[#1a1a1a]';

  return (
    <SafeAreaView className="flex-1 bg-bg-page dark:bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-7">
            <View
              className="items-center justify-center mb-4 bg-primary dark:bg-blue-500"
              style={{ width: 72, height: 72, borderRadius: 36, shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 8 }}
            >
              <Text className="text-white text-[22px] font-extrabold tracking-widest">CL</Text>
            </View>
            <Text className="text-[34px] font-extrabold text-[#2563eb] dark:text-blue-400 mb-2">CycleLink</Text>
            <Text className="text-[15px] leading-[22px] text-[#475569] dark:text-slate-400 text-center" style={{ maxWidth: 300 }}>
              Let's personalise your experience before you start.
            </Text>
          </View>

          <View
            className="bg-bg-base dark:bg-[#111111] rounded-cy-2xl px-[22px] py-cy-xl"
            style={{ shadowColor: '#0f172a', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 }}
          >
            <Text className="text-[24px] font-bold text-slate-900 dark:text-slate-100 mb-1.5">Your Profile</Text>
            <Text className="text-[14px] text-text-secondary mb-[18px]">Takes about 30 seconds. You can update everything later.</Text>

            {/* Location */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Location</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Neighbourhood, Singapore"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                  className={`flex-1 ${inputClass}`}
                />
                <Pressable
                  onPress={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="items-center justify-center rounded-cy-xl px-cy-md bg-[#DBEAFE] dark:bg-[#1e293b] border border-[#2563eb]"
                  style={{ minWidth: 56 }}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Text className="text-[#2563eb] dark:text-blue-400 text-[12px] font-bold text-center">Use Current Location</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Cycling Preference */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Cycling Preference</Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {PREFERENCE_OPTIONS.map((option) => {
                  const isSelected = cyclingPreference === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setCyclingPreference(option)}
                      className={`px-cy-lg py-cy-md rounded-full border ${isSelected ? 'bg-[#DBEAFE] dark:bg-[#1e293b] border-[#2563eb]' : 'bg-bg-light dark:bg-[#1a1a1a] border-border-light dark:border-[#2d2d2d]'}`}
                    >
                      <Text className={`text-[14px] font-semibold ${isSelected ? 'text-[#2563eb] dark:text-blue-400' : 'text-text-secondary dark:text-slate-400'}`}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Weekly Goal */}
            <View className="mb-4">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">Weekly Goal (km)</Text>
              <TextInput
                value={weeklyGoalKm}
                onChangeText={setWeeklyGoalKm}
                placeholder="80"
                placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                keyboardType="number-pad"
                className={inputClass}
              />
            </View>

            {/* Bio */}
            <View className="mb-5">
              <Text className="text-[14px] font-semibold text-[#334155] dark:text-slate-100 mb-2">
                Bio <Text className="text-text-secondary font-normal">(optional)</Text>
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell other riders about your style..."
                placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                multiline
                textAlignVertical="top"
                className={inputClass}
                style={{ minHeight: 80 }}
              />
            </View>

            <Pressable
              disabled={isSubmitting || !authResult}
              onPress={handleSubmit}
              className="bg-primary dark:bg-blue-500 rounded-[18px] items-center justify-center py-cy-lg"
              style={isSubmitting || !authResult ? { opacity: 0.7 } : undefined}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-[16px] font-bold">Get Started</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
