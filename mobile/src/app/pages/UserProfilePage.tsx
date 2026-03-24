import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { getUserProfile, serializeUserProfile, UserProfile } from '@/services/userService';

const theme = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2FF',
  primary: '#1D4ED8',
  primarySoft: '#DBEAFE',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  successSoft: '#DCFCE7',
  successText: '#166534',
  warningSoft: '#FEF3C7',
  warningText: '#92400E',
};

const statCards = [
  {
    key: 'totalRides',
    label: 'Total rides',
    backgroundColor: theme.primarySoft,
    textColor: theme.primary,
  },
  {
    key: 'totalDistanceKm',
    label: 'Distance',
    backgroundColor: theme.successSoft,
    textColor: theme.successText,
  },
  {
    key: 'favoriteTrails',
    label: 'Saved trails',
    backgroundColor: theme.warningSoft,
    textColor: theme.warningText,
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
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.stateTitle}>Loading your profile</Text>
        <Text style={styles.stateText}>Fetching CycleLink account details and ride stats.</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.stateTitle}>Profile unavailable</Text>
        <Text style={styles.stateText}>{error ?? 'No user profile was returned.'}</Text>
        <Pressable style={styles.primaryButton} onPress={() => loadProfile()}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadProfile('refresh')} />
      }
    >
      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName}>{profile.fullName}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            <Text style={styles.profileMeta}>{profile.location}</Text>
            <Text style={styles.profileMeta}>Member since {profile.memberSince}</Text>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() =>
              navigation.navigate('EditProfile', { profile: serializeUserProfile(profile) })
            }
          >
            <Text style={styles.editButtonText}>Edit profile</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        {statCards.map((card) => {
          const value =
            card.key === 'totalDistanceKm'
              ? `${profile.stats[card.key].toFixed(1)} km`
              : String(profile.stats[card.key]);

          return (
            <View
              key={card.key}
              style={[styles.statCard, { backgroundColor: card.backgroundColor }]}
            >
              <Text style={[styles.statValue, { color: card.textColor }]}>{value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Cycling preference</Text>
        <Text style={styles.sectionTitle}>{profile.cyclingPreference}</Text>
        <Text style={styles.sectionBody}>
          Weekly goal: {profile.weeklyGoalKm} km
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>About</Text>
        <Text style={styles.sectionBody}>{profile.bio}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>Account settings</Text>
        <Pressable
          style={styles.settingRow}
          onPress={() => navigation.navigate('PrivacySecurity')}
        >
          <Text style={styles.settingTitle}>Notifications</Text>
          <Text style={styles.settingValue}>Manage</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.settingRow}
          onPress={() => navigation.navigate('PrivacySecurity')}
        >
          <Text style={styles.settingTitle}>Privacy</Text>
          <Text style={styles.settingValue}>Review</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.settingRow}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Text style={styles.settingTitle}>Password</Text>
          <Text style={styles.settingValue}>Change</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: theme.background,
  },
  stateTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
  },
  stateText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: theme.textMuted,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  profileHeaderRow: {
    gap: 16,
  },
  profileTextBlock: {
    gap: 4,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  profileEmail: {
    fontSize: 16,
    color: theme.text,
  },
  profileMeta: {
    fontSize: 14,
    color: theme.textMuted,
  },
  editButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: theme.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: theme.textMuted,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  sectionBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: theme.textMuted,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  settingValue: {
    fontSize: 14,
    color: theme.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});