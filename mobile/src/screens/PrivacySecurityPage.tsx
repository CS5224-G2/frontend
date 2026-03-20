import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

import {
  getPrivacySecuritySettings,
  PrivacySecuritySettings,
  updatePrivacySecuritySettings,
} from '@/services/settingsService';

const theme = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  primary: '#1D4ED8',
  primarySoft: '#DBEAFE',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
};

const defaultSettings: PrivacySecuritySettings = {
  noThirdPartyAds: false,
  noDataImprovement: false,
  notificationsManagedInDeviceSettings: true,
};

type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ title, description, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextBlock}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
        thumbColor={value ? theme.primary : '#F8FAFC'}
      />
    </View>
  );
}

export default function PrivacySecurityPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySecuritySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const result = await getPrivacySecuritySettings();
        if (isMounted) {
          setSettings(result);
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert(
            'Unable to load settings',
            error instanceof Error ? error.message : 'Please try again later.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (
    key: 'noThirdPartyAds' | 'noDataImprovement',
    value: boolean
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleOpenNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        'Unable to open settings',
        'Your device settings could not be opened from CycleLink.'
      );
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await updatePrivacySecuritySettings(settings);
      Alert.alert('Settings updated', 'Your privacy preferences were saved.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Your settings could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.stateTitle}>Loading security preferences</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: 'Privacy & security' }} />
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Privacy and device</Text>
        <Text style={styles.heroTitle}>Privacy & security</Text>
        <Text style={styles.heroSubtitle}>
          Control how CycleLink uses your data and manage device-level permissions.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Your privacy matters</Text>
        <Text style={styles.infoBody}>
          These controls are stored locally in a mock service for now, but they mirror the backend
          contract the app will use later.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Privacy controls</Text>
        <ToggleRow
          title="Do not share my personal information for third-party targeted advertising"
          description="When enabled, CycleLink will opt you out of advertiser data sharing."
          value={settings.noThirdPartyAds}
          onValueChange={(value) => handleToggle('noThirdPartyAds', value)}
        />
        <View style={styles.divider} />
        <ToggleRow
          title="Do not use personal data to improve application"
          description="Turn this on if you do not want account and ride data used for product improvements."
          value={settings.noDataImprovement}
          onValueChange={(value) => handleToggle('noDataImprovement', value)}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Device permissions</Text>
        <Pressable style={styles.deviceRow} onPress={handleOpenNotificationSettings}>
          <View style={styles.deviceTextBlock}>
            <Text style={styles.deviceTitle}>Notifications</Text>
            <Text style={styles.deviceDescription}>
              Manage push permissions in your native phone settings.
            </Text>
          </View>
          <Text style={styles.deviceAction}>Open settings</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Save settings</Text>
          )}
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
    padding: 22,
    borderWidth: 1,
    borderColor: theme.border,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.primary,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: theme.textMuted,
  },
  infoCard: {
    backgroundColor: theme.primarySoft,
    borderRadius: 20,
    padding: 18,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.textMuted,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  toggleTextBlock: {
    flex: 1,
    gap: 6,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    color: theme.text,
  },
  toggleDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 18,
  },
  deviceRow: {
    borderRadius: 18,
    backgroundColor: theme.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  deviceTextBlock: {
    flex: 1,
    gap: 6,
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  deviceDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.textMuted,
  },
  deviceAction: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  primaryButton: {
    flex: 1.15,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
