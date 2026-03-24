import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import {
  getUserProfile,
  parseUserProfileParam,
  updateUserProfile,
  UserProfile,
} from '@/services/userService';

const theme = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  primary: '#1D4ED8',
  primarySoft: '#DBEAFE',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  inputBackground: '#F8FAFC',
};

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
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.stateTitle}>Preparing edit form</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroCard}>
        <View style={[styles.avatar, { backgroundColor: formState.avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroTitle}>Edit profile</Text>
        <Text style={styles.heroSubtitle}>
          Update your public details, riding preference, and weekly goal.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={formState.fullName}
          onChangeText={(value) => updateField('fullName', value)}
          placeholder="Enter your full name"
          placeholderTextColor={theme.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={formState.email}
          editable={false}
          selectTextOnFocus={false}
          style={[styles.input, styles.disabledInput]}
        />
        <Text style={styles.helperText}>Email is locked until backend account flows are ready.</Text>

        <Text style={styles.label}>Location</Text>
        <TextInput
          value={formState.location}
          onChangeText={(value) => updateField('location', value)}
          placeholder="City, State"
          placeholderTextColor={theme.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={formState.bio}
          onChangeText={(value) => updateField('bio', value)}
          placeholder="Tell other riders about your style."
          placeholderTextColor={theme.textMuted}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textArea]}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.label}>Cycling preference</Text>
        <View style={styles.optionRow}>
          {preferenceOptions.map((option) => {
            const isSelected = formState.cyclingPreference === option;

            return (
              <Pressable
                key={option}
                style={[styles.choiceChip, isSelected && styles.choiceChipSelected]}
                onPress={() => updateField('cyclingPreference', option)}
              >
                <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Weekly goal (km)</Text>
        <TextInput
          value={String(formState.weeklyGoalKm)}
          keyboardType="number-pad"
          onChangeText={(value) => {
            const numericValue = Number(value.replace(/[^0-9]/g, ''));
            updateField('weeklyGoalKm', Number.isNaN(numericValue) ? 0 : numericValue);
          }}
          placeholder="80"
          placeholderTextColor={theme.textMuted}
          style={styles.input}
        />
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()} disabled={isSaving}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save changes'}</Text>
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
    backgroundColor: theme.background,
  },
  stateTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  heroCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: theme.textMuted,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    fontSize: 15,
  },
  disabledInput: {
    color: theme.textMuted,
  },
  helperText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: theme.textMuted,
  },
  textArea: {
    minHeight: 120,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
  },
  choiceChipSelected: {
    backgroundColor: theme.primarySoft,
    borderColor: theme.primary,
  },
  choiceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
  },
  choiceChipTextSelected: {
    color: theme.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  secondaryButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});