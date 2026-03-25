import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  getPrivacySecuritySettings,
  PrivacySecuritySettings,
  updatePrivacySecuritySettings,
} from '@/services/settingsService';

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
    <View className="flex-row items-start" style={{ gap: 16 }}>
      <View className="flex-1" style={{ gap: 6 }}>
        <Text className="text-[15px] font-bold leading-[22px] text-slate-900">{title}</Text>
        <Text className="text-[14px] leading-[21px] text-text-secondary">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
        thumbColor={value ? '#1D4ED8' : '#F8FAFC'}
      />
    </View>
  );
}

export default function PrivacySecurityPage() {
  const navigation = useNavigation<any>();
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
          onPress: () => navigation.goBack(),
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
      <View className="flex-1 justify-center items-center bg-[#F3F4F6]">
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text className="mt-4 text-[20px] font-bold text-slate-900">Loading security preferences</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F3F4F6]" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className="bg-white rounded-[24px] p-[22px] border border-border">
        <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-primary-dark mb-2">Privacy and device</Text>
        <Text className="text-[28px] font-extrabold text-slate-900">Privacy & security</Text>
        <Text className="mt-[10px] text-[15px] leading-[22px] text-text-secondary">
          Control how CycleLink uses your data and manage device-level permissions.
        </Text>
      </View>

      <View className="bg-[#DBEAFE] rounded-[20px] p-[18px]">
        <Text className="text-[15px] font-extrabold text-slate-900 mb-1.5">Your privacy matters</Text>
        <Text className="text-[14px] leading-[21px] text-text-secondary">
          These controls are stored locally in a mock service for now, but they mirror the backend
          contract the app will use later.
        </Text>
      </View>

      <View className="bg-white rounded-[24px] p-5 border border-border">
        <Text className="text-[18px] font-extrabold text-slate-900 mb-4">Privacy controls</Text>
        <ToggleRow
          title="Do not share my personal information for third-party targeted advertising"
          description="When enabled, CycleLink will opt you out of advertiser data sharing."
          value={settings.noThirdPartyAds}
          onValueChange={(value) => handleToggle('noThirdPartyAds', value)}
        />
        <View className="h-px bg-border my-[18px]" />
        <ToggleRow
          title="Do not use personal data to improve application"
          description="Turn this on if you do not want account and ride data used for product improvements."
          value={settings.noDataImprovement}
          onValueChange={(value) => handleToggle('noDataImprovement', value)}
        />
      </View>

      <View className="bg-white rounded-[24px] p-5 border border-border">
        <Text className="text-[18px] font-extrabold text-slate-900 mb-4">Device permissions</Text>
        <Pressable
          testID="notifications-settings-button"
          className="flex-row justify-between items-center rounded-[18px] bg-[#F8FAFC] border border-border p-cy-lg"
          style={{ gap: 12 }}
          onPress={handleOpenNotificationSettings}
        >
          <View className="flex-1" style={{ gap: 6 }}>
            <Text className="text-[16px] font-bold text-slate-900">Notifications</Text>
            <Text className="text-[14px] leading-[21px] text-text-secondary">
              Manage push permissions in your native phone settings.
            </Text>
          </View>
          <Text className="text-[14px] font-extrabold text-primary-dark">Open settings</Text>
        </Pressable>
      </View>

      <View className="flex-row mt-1 mb-6" style={{ gap: 12 }}>
        <Pressable
          testID="privacy-security-cancel-button"
          className="flex-1 justify-center items-center border border-border bg-white rounded-[18px]"
          style={{ minHeight: 54 }}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text className="text-[15px] font-bold text-slate-900">Cancel</Text>
        </Pressable>
        <Pressable
          testID="privacy-security-save-button"
          className="justify-center items-center bg-primary-dark rounded-[18px]"
          style={{ flex: 1.15, minHeight: 54 }}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-[15px] font-extrabold text-white">Save settings</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
