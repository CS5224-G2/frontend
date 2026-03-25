import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { getUserProfile, serializeUserProfile, UserProfile } from '@/services/userService';

const statCards = [
  {
    key: 'totalRides',
    label: 'Total rides',
    bgClassName: 'bg-[#DBEAFE]',
    textClassName: 'text-primary-dark',
  },
  {
    key: 'totalDistanceKm',
    label: 'Distance',
    bgClassName: 'bg-[#DCFCE7]',
    textClassName: 'text-[#166534]',
  },
  {
    key: 'favoriteTrails',
    label: 'Saved trails',
    bgClassName: 'bg-[#FEF3C7]',
    textClassName: 'text-[#92400E]',
  },
] as const;

export default function UserProfilePage() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await getUserProfile();
      setProfile(result);
      setError(null);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Unable to load profile right now.';
      setError(message);
    } finally {
      if (mode === 'refresh') {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile('refresh');
    }, [loadProfile])
  );

  const initials = useMemo(() => {
    if (!profile) {
      return '';
    }

    return profile.fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [profile]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center px-cy-xl bg-[#F3F4F6]">
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text className="mt-4 text-[22px] font-bold text-slate-900">Loading your profile</Text>
        <Text className="mt-2 text-[15px] leading-[22px] text-text-secondary text-center">Fetching CycleLink account details and ride stats.</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View className="flex-1 justify-center items-center px-cy-xl bg-[#F3F4F6]">
        <Text className="text-[22px] font-bold text-slate-900">Profile unavailable</Text>
        <Text className="mt-2 text-[15px] leading-[22px] text-text-secondary text-center">{error ?? 'No user profile was returned.'}</Text>
        <Pressable className="mt-5 bg-primary-dark px-5 py-cy-md rounded-[14px]" onPress={() => loadProfile()}>
          <Text className="text-white text-[15px] font-bold">Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F3F4F6]"
      contentContainerStyle={{ padding: 20, gap: 16 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadProfile('refresh')} />
      }
    >
      <View className="bg-white rounded-[24px] p-5 border border-border">
        <View
          className="justify-center items-center mb-[18px]"
          style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: profile.avatarColor }}
        >
          <Text className="text-white text-[28px] font-extrabold">{initials}</Text>
        </View>
        <View style={{ gap: 16 }}>
          <View style={{ gap: 4 }}>
            <Text className="text-[28px] font-extrabold text-slate-900">{profile.fullName}</Text>
            <Text className="text-[16px] text-slate-900">{profile.email}</Text>
            <Text className="text-[14px] text-text-secondary">{profile.location}</Text>
            <Text className="text-[14px] text-text-secondary">Member since {profile.memberSince}</Text>
          </View>
          <Pressable
            className="self-start mt-2 bg-primary-dark px-[18px] py-cy-md rounded-[14px]"
            onPress={() =>
              navigation.navigate('EditProfile', { profile: serializeUserProfile(profile) })
            }
          >
            <Text className="text-white text-[15px] font-bold">Edit profile</Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-row" style={{ gap: 12 }}>
        {statCards.map((card) => {
          const value =
            card.key === 'totalDistanceKm'
              ? `${profile.stats[card.key].toFixed(1)} km`
              : String(profile.stats[card.key]);

          return (
            <View
              key={card.key}
              className={`flex-1 rounded-[20px] py-[18px] px-cy-md ${card.bgClassName}`}
            >
              <Text className={`text-[20px] font-extrabold ${card.textClassName}`}>{value}</Text>
              <Text className="mt-1.5 text-[13px] leading-[18px] text-text-secondary">{card.label}</Text>
            </View>
          );
        })}
      </View>

      <View className="bg-white rounded-[24px] p-5 border border-border">
        <Text className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.8px]">Cycling preference</Text>
        <Text className="mt-2 text-[24px] font-extrabold text-slate-900">{profile.cyclingPreference}</Text>
        <Text className="mt-2 text-[15px] leading-[22px] text-text-secondary">
          Weekly goal: {profile.weeklyGoalKm} km
        </Text>
      </View>

      <View className="bg-white rounded-[24px] p-5 border border-border">
        <Text className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.8px]">About</Text>
        <Text className="mt-2 text-[15px] leading-[22px] text-text-secondary">{profile.bio}</Text>
      </View>

      <View className="bg-white rounded-[24px] p-5 border border-border">
        <Text className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.8px]">Account settings</Text>
        <Pressable
          className="flex-row justify-between items-center py-1.5"
          onPress={() => navigation.navigate('PrivacySecurity')}
        >
          <Text className="text-[16px] font-semibold text-slate-900">Notifications</Text>
          <Text className="text-[14px] text-text-secondary">Manage</Text>
        </Pressable>
        <View className="h-px bg-border my-3" />
        <Pressable
          className="flex-row justify-between items-center py-1.5"
          onPress={() => navigation.navigate('PrivacySecurity')}
        >
          <Text className="text-[16px] font-semibold text-slate-900">Privacy</Text>
          <Text className="text-[14px] text-text-secondary">Review</Text>
        </Pressable>
        <View className="h-px bg-border my-3" />
        <Pressable
          className="flex-row justify-between items-center py-1.5"
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Text className="text-[16px] font-semibold text-slate-900">Password</Text>
          <Text className="text-[14px] text-text-secondary">Change</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
