import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';

import {
  getUserProfile,
  parseUserProfileParam,
  updateUserProfile,
  UserProfile,
} from '@/services/userService';

const preferenceOptions: Array<UserProfile['cyclingPreference']> = [
  'Leisure',
  'Commuter',
  'Performance',
];

export default function EditProfilePage() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params || {};
  const profileFromParams = useMemo(() => parseUserProfileParam(params.profile), [params.profile]);

  const [formState, setFormState] = useState<UserProfile | null>(profileFromParams);
  const [isLoading, setIsLoading] = useState(!profileFromParams);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profileFromParams) {
      setFormState(profileFromParams);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadFallbackProfile = async () => {
      try {
        const fetchedProfile = await getUserProfile();
        if (isMounted) {
          setFormState(fetchedProfile);
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert(
            'Unable to load profile',
            error instanceof Error ? error.message : 'Please try again later.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFallbackProfile();

    return () => {
      isMounted = false;
    };
  }, [profileFromParams]);

  const initials = useMemo(() => {
    if (!formState) {
      return '';
    }

    return formState.fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [formState]);

  const updateField = <Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) => {
    setFormState((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSave = async () => {
    if (!formState) {
      return;
    }

    if (!formState.fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your full name before saving.');
      return;
    }

    if (!formState.location.trim()) {
      Alert.alert('Missing location', 'Please enter your city or preferred riding area.');
      return;
    }

    setIsSaving(true);

    try {
      await updateUserProfile({
        ...formState,
        fullName: formState.fullName.trim(),
        location: formState.location.trim(),
        bio: formState.bio.trim(),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error ? error.message : 'Your changes could not be saved.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !formState) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F3F4F6]">
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text className="mt-4 text-[20px] font-bold text-slate-900">Preparing edit form</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F3F4F6]" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className="bg-white rounded-[24px] p-cy-xl items-center border border-border">
        <View
          className="justify-center items-center mb-4 rounded-full"
          style={{ width: 82, height: 82, backgroundColor: formState.avatarColor }}
        >
          <Text className="text-white text-[28px] font-extrabold">{initials}</Text>
        </View>
        <Text className="text-[28px] font-extrabold text-slate-900">Edit profile</Text>
        <Text className="mt-2 text-[15px] leading-[22px] text-text-secondary text-center">
          Update your public details, riding preference, and weekly goal.
        </Text>
      </View>

      <View className="bg-white rounded-[24px] p-5 border border-border">
        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900">Full name</Text>
        <TextInput
          value={formState.fullName}
          onChangeText={(value) => updateField('fullName', value)}
          placeholder="Enter your full name"
          placeholderTextColor="#64748B"
          className="border border-border rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] text-slate-900 text-[15px]"
          style={{ minHeight: 54 }}
        />

        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900">Email</Text>
        <TextInput
          value={formState.email}
          editable={false}
          selectTextOnFocus={false}
          className="border border-border rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] text-text-secondary text-[15px]"
          style={{ minHeight: 54 }}
        />
        <Text className="mt-2 text-[13px] leading-[18px] text-text-secondary">Email is locked until backend account flows are ready.</Text>

        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900">Location</Text>
        <TextInput
          value={formState.location}
          onChangeText={(value) => updateField('location', value)}
          placeholder="City, State"
          placeholderTextColor="#64748B"
          className="border border-border rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] text-slate-900 text-[15px]"
          style={{ minHeight: 54 }}
        />

        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900">Bio</Text>
        <TextInput
          value={formState.bio}
          onChangeText={(value) => updateField('bio', value)}
          placeholder="Tell other riders about your style."
          placeholderTextColor="#64748B"
          multiline
          textAlignVertical="top"
          className="border border-border rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] text-slate-900 text-[15px]"
          style={{ minHeight: 54 + 66 }}
        />
      </View>

      <View className="bg-white rounded-[24px] p-5 border border-border">
        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900">Cycling preference</Text>
        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {preferenceOptions.map((option) => {
            const isSelected = formState.cyclingPreference === option;

            return (
              <Pressable
                key={option}
                className={`px-cy-lg py-cy-md rounded-full border ${isSelected ? 'bg-[#DBEAFE] border-[#1D4ED8]' : 'bg-[#F8FAFC] border-border'}`}
                onPress={() => updateField('cyclingPreference', option)}
              >
                <Text className={`text-[14px] font-semibold ${isSelected ? 'text-[#1D4ED8]' : 'text-text-secondary'}`}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-4 mb-2 text-[14px] font-bold text-slate-900">Weekly goal (km)</Text>
        <TextInput
          value={String(formState.weeklyGoalKm)}
          keyboardType="number-pad"
          onChangeText={(value) => {
            const numericValue = Number(value.replace(/[^0-9]/g, ''));
            updateField('weeklyGoalKm', Number.isNaN(numericValue) ? 0 : numericValue);
          }}
          placeholder="80"
          placeholderTextColor="#64748B"
          className="border border-border rounded-cy-xl px-cy-lg py-[14px] bg-[#F8FAFC] text-slate-900 text-[15px]"
          style={{ minHeight: 54 }}
        />
      </View>

      <View className="flex-row mb-2" style={{ gap: 12 }}>
        <Pressable
          className="flex-1 justify-center items-center bg-white border border-border rounded-cy-xl"
          style={{ minHeight: 54 }}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text className="text-slate-900 text-[15px] font-bold">Cancel</Text>
        </Pressable>
        <Pressable
          className="flex-1 justify-center items-center bg-primary-dark rounded-cy-xl"
          style={{ minHeight: 54 }}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text className="text-white text-[15px] font-bold">{isSaving ? 'Saving...' : 'Save changes'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
